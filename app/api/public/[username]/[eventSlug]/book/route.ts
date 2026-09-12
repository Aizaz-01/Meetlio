import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { createBookingSchema } from '@/lib/validation/booking.schema';
import { generateAvailableSlots } from '@/lib/scheduling/slots';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';
import { hasTimeConflict } from '@/lib/scheduling/conflicts';
import { AvailabilityOverrideItem } from '@/types/scheduling';
import { generateSecureToken } from '@/lib/auth/tokens';
import { sendBookingConfirmationEmails } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/audit/service';
import { triggerWebhooks } from '@/lib/webhooks/service';
import { canCreateBooking, incrementBookingUsage } from '@/lib/billing/usage';

function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string; eventSlug: string }> }
) {
  const { username, eventSlug } = await params;

  try {
    // 1. Resolve host
    const host = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        timezone: true,
      },
    });

    if (!host) {
      return NextResponse.json({ success: false, error: 'User workspace not found' }, { status: 404 });
    }

    // Server-side Usage Limit Check
    const bookingCheck = await canCreateBooking(host.id);
    if (!bookingCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LIMIT_REACHED',
            message: 'Monthly booking limit reached for this host. Please upgrade your plan to accept more bookings.',
            details: {
              resource: 'bookings',
              limit: bookingCheck.limit,
              current: bookingCheck.current,
            },
          },
        },
        { status: 402 }
      );
    }

    // 2. Resolve event type
    const eventType = await db.eventType.findUnique({
      where: {
        userId_slug: {
          userId: host.id,
          slug: eventSlug,
        },
      },
    });

    if (!eventType || (!eventType.isActive && !eventType.active)) {
      return NextResponse.json(
        { success: false, error: 'This event type is currently inactive or unavailable.' },
        { status: 404 }
      );
    }

    // 3. Validate request payload
    const body = await request.json();
    const parsed = createBookingSchema.parse(body);

    // 4. Calculate proposed booking start & end times (UTC)
    const proposedStart = new Date(parsed.startTime);
    const proposedEnd = new Date(proposedStart.getTime() + eventType.duration * 60 * 1000);
    const targetDate = body.targetDate || formatLocalDate(proposedStart);

    // 5. Independent Server-Side Availability Verification
    const hostAvailabilities = await db.availability.findMany({
      where: { userId: host.id },
    });

    const hostOverridesRaw = await db.availabilityOverride.findMany({
      where: { userId: host.id },
    });

    const hostOverrides: AvailabilityOverrideItem[] = hostOverridesRaw.map((o) => ({
      id: o.id,
      date: o.date,
      type: o.type as 'AVAILABLE' | 'UNAVAILABLE',
      startTime: o.startTime,
      endTime: o.endTime,
    }));

    const existingConfirmed = await db.booking.findMany({
      where: {
        userId: host.id,
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: {
        eventType: {
          select: {
            bufferBefore: true,
            bufferAfter: true,
          },
        },
      },
    });

    const existingBookingsForEngine = existingConfirmed.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      bufferBefore: b.eventType?.bufferBefore || 0,
      bufferAfter: b.eventType?.bufferAfter || 0,
    }));

    const slots = generateAvailableSlots({
      hostTimezone: host.timezone || 'UTC',
      guestTimezone: parsed.guestTimezone,
      targetDate,
      durationMinutes: eventType.duration,
      bufferBefore: eventType.bufferBefore || 0,
      bufferAfter: eventType.bufferAfter || 0,
      minimumNotice: eventType.minimumNotice ?? 0,
      maximumBookingWindow: eventType.maximumBookingWindow ?? 60,
      availabilities: hostAvailabilities.length > 0 ? hostAvailabilities : DEFAULT_WEEKLY_AVAILABILITY,
      overrides: hostOverrides,
      existingBookings: existingBookingsForEngine,
    });

    // Check if proposed slot is generated and marked available (with 1-min tolerance)
    const matchingSlot = slots.find(
      (s) => Math.abs(new Date(s.startTime || s.datetime).getTime() - proposedStart.getTime()) < 60000
    );

    if (slots.length > 0 && matchingSlot && !matchingSlot.available) {
      return NextResponse.json(
        { success: false, error: 'This time slot is no longer available.' },
        { status: 409 }
      );
    }

    // 6. Transaction-Safe Atomic Creation
    const cancelToken = generateSecureToken().rawToken;
    const rescheduleToken = generateSecureToken().rawToken;

    let newBooking;
    try {
      newBooking = await db.$transaction(async (tx) => {
        const freshConfirmed = await tx.booking.findMany({
          where: {
            userId: host.id,
            status: { in: ['CONFIRMED', 'SCHEDULED'] },
          },
          include: {
            eventType: {
              select: {
                bufferBefore: true,
                bufferAfter: true,
              },
            },
          },
        });

        const activeBookings = freshConfirmed.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
          bufferBefore: b.eventType?.bufferBefore || 0,
          bufferAfter: b.eventType?.bufferAfter || 0,
        }));

        const isConflicting = hasTimeConflict(
          proposedStart,
          proposedEnd,
          activeBookings,
          eventType.bufferBefore || 0,
          eventType.bufferAfter || 0
        );

        if (isConflicting) {
          throw new Error('RACE_CONDITION_CONFLICT');
        }

        const initialStatus = eventType.requireApproval ? 'PENDING' : 'CONFIRMED';

        const createdBooking = await tx.booking.create({
          data: {
            userId: host.id,
            eventTypeId: eventType.id,
            guestName: parsed.guestName,
            inviteeName: parsed.guestName,
            guestEmail: parsed.guestEmail,
            inviteeEmail: parsed.guestEmail,
            guestPhone: body.guestPhone || null,
            inviteePhone: body.guestPhone || null,
            guestTimezone: parsed.guestTimezone,
            timezone: parsed.guestTimezone,
            startTime: proposedStart,
            endTime: proposedEnd,
            status: initialStatus,
            location: eventType.locationInfo || eventType.locationType || 'Google Meet',
            cancelToken,
            rescheduleToken,
            invitees: Array.isArray(body.invitees) && body.invitees.length > 0 ? {
              createMany: {
                data: body.invitees.map((e: string) => ({ email: String(e).toLowerCase().trim() })),
              },
            } : undefined,
          },
        });

        // Save Custom Booking Answers
        if (body.answers && typeof body.answers === 'object') {
          const questions = await tx.eventBookingQuestion.findMany({
            where: { eventTypeId: eventType.id },
          });

          const questionMap = new Map(questions.map((q) => [q.id, q.label]));

          const answerEntries = Object.entries(body.answers).filter(([_, val]) => val !== undefined && val !== null && String(val).trim() !== '');

          if (answerEntries.length > 0) {
            await tx.bookingAnswer.createMany({
              data: answerEntries.map(([qId, val]) => ({
                bookingId: createdBooking.id,
                questionId: questionMap.has(qId) ? qId : null,
                questionLabel: questionMap.get(qId) || 'Custom Question',
                answer: String(val),
                value: String(val),
              })),
            });
          }
        }

        // Automatic Contact CRM Creation / Upsert
        const existingContact = await tx.contact.findFirst({
          where: { userId: host.id, email: parsed.guestEmail.toLowerCase().trim() },
        });

        if (!existingContact) {
          const newContact = await tx.contact.create({
            data: {
              userId: host.id,
              name: parsed.guestName.trim(),
              email: parsed.guestEmail.toLowerCase().trim(),
              phone: body.guestPhone || null,
            },
          });

          await tx.contactActivity.create({
            data: {
              contactId: newContact.id,
              type: 'BOOKING_CREATED',
              metadata: JSON.stringify({ bookingId: createdBooking.id, eventTitle: eventType.name }),
            },
          });
        } else {
          await tx.contactActivity.create({
            data: {
              contactId: existingContact.id,
              type: 'BOOKING_CREATED',
              metadata: JSON.stringify({ bookingId: createdBooking.id, eventTitle: eventType.name }),
            },
          });
        }

        // Create In-App Notification
        await tx.notification.create({
          data: {
            userId: host.id,
            bookingId: createdBooking.id,
            type: 'NEW_BOOKING',
            title: `New Booking: ${parsed.guestName}`,
            body: `${parsed.guestName} booked ${eventType.name} for ${proposedStart.toLocaleDateString()}`,
          },
        });

        return createdBooking;
      });
    } catch (txErr: any) {
      if (txErr.message === 'RACE_CONDITION_CONFLICT') {
        return NextResponse.json(
          { success: false, error: 'This time slot is no longer available.' },
          { status: 409 }
        );
      }
      throw txErr;
    }

    // Increment usage record
    incrementBookingUsage(host.id).catch(() => {});

    // Send confirmation emails asynchronously
    sendBookingConfirmationEmails({
      booking: newBooking,
      host,
      eventType,
    }).catch(() => {});

    // Record audit log & trigger webhooks
    recordAuditLog({
      userId: host.id,
      action: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: newBooking.id,
      metadata: { guestName: newBooking.guestName, guestEmail: newBooking.guestEmail, eventTitle: eventType.name },
    }).catch(() => {});

    triggerWebhooks({
      userId: host.id,
      event: 'booking.created',
      payload: {
        bookingId: newBooking.id,
        eventTypeId: eventType.id,
        eventTitle: eventType.name,
        guestName: newBooking.guestName,
        guestEmail: newBooking.guestEmail,
        startTime: newBooking.startTime.toISOString(),
        endTime: newBooking.endTime.toISOString(),
        status: newBooking.status,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newBooking.id,
          eventTitle: eventType.name,
          hostName: host.name,
          guestName: newBooking.guestName,
          guestEmail: newBooking.guestEmail,
          guestTimezone: newBooking.guestTimezone,
          startTime: newBooking.startTime.toISOString(),
          endTime: newBooking.endTime.toISOString(),
          duration: eventType.duration,
          status: newBooking.status,
          cancelToken: newBooking.cancelToken,
          rescheduleToken: newBooking.rescheduleToken,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid booking details' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
