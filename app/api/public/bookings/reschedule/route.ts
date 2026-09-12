import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { generateAvailableSlots } from '@/lib/scheduling/slots';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';
import { hasTimeConflict } from '@/lib/scheduling/conflicts';
import { generateSecureToken } from '@/lib/auth/tokens';
import { sendBookingRescheduledEmails } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/audit/service';
import { triggerWebhooks } from '@/lib/webhooks/service';
import { AvailabilityOverrideItem } from '@/types/scheduling';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newStartTime } = body;

    if (!token || typeof token !== 'string' || !newStartTime) {
      return NextResponse.json(
        { success: false, error: 'Reschedule token and new start time are required' },
        { status: 400 }
      );
    }

    const proposedStart = new Date(newStartTime);
    if (isNaN(proposedStart.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid datetime format for new start time' },
        { status: 400 }
      );
    }

    // Find original booking
    const oldBooking = await db.booking.findFirst({
      where: {
        OR: [
          { rescheduleToken: token },
          { id: token },
        ],
      },
      include: {
        user: true,
        eventType: true,
      },
    });

    if (!oldBooking) {
      return NextResponse.json({ success: false, error: 'Booking not found or invalid token' }, { status: 404 });
    }

    if (oldBooking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cancelled bookings cannot be rescheduled.' }, { status: 400 });
    }

    if (oldBooking.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Completed meetings cannot be rescheduled.' }, { status: 400 });
    }

    const host = oldBooking.user;
    const eventType = oldBooking.eventType;
    const proposedEnd = new Date(proposedStart.getTime() + eventType.duration * 60 * 1000);
    const targetDate = proposedStart.toISOString().split('T')[0];

    // Phase 4 Engine Availability Check
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
        status: 'CONFIRMED',
        NOT: { id: oldBooking.id },
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
      guestTimezone: oldBooking.guestTimezone,
      targetDate,
      durationMinutes: eventType.duration,
      bufferBefore: eventType.bufferBefore || 0,
      bufferAfter: eventType.bufferAfter || 0,
      minimumNotice: eventType.minimumNotice ?? 120,
      maximumBookingWindow: eventType.maximumBookingWindow ?? 60,
      availabilities: hostAvailabilities.length > 0 ? hostAvailabilities : DEFAULT_WEEKLY_AVAILABILITY,
      overrides: hostOverrides,
      existingBookings: existingBookingsForEngine,
    });

    const matchingSlot = slots.find(
      (s) => new Date(s.datetime).getTime() === proposedStart.getTime()
    );

    if (!matchingSlot || !matchingSlot.available) {
      return NextResponse.json(
        { success: false, error: 'This time slot is no longer available.' },
        { status: 409 }
      );
    }

    // Transaction-Safe Atomic Rescheduling
    const newCancelToken = generateSecureToken().rawToken;
    const newRescheduleToken = generateSecureToken().rawToken;

    let newBooking;
    try {
      newBooking = await db.$transaction(async (tx) => {
        const freshConfirmed = await tx.booking.findMany({
          where: {
            userId: host.id,
            status: 'CONFIRMED',
            NOT: { id: oldBooking.id },
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

        // Cancel old booking
        await tx.booking.update({
          where: { id: oldBooking.id },
          data: {
            status: 'CANCELLED',
            cancelledBy: 'GUEST',
            cancellationReason: 'Rescheduled',
            cancelledAt: new Date(),
            rescheduledAt: new Date(),
          },
        });

        // Create new replacement booking
        return await tx.booking.create({
          data: {
            userId: host.id,
            eventTypeId: eventType.id,
            guestName: oldBooking.guestName,
            guestEmail: oldBooking.guestEmail,
            guestTimezone: oldBooking.guestTimezone,
            startTime: proposedStart,
            endTime: proposedEnd,
            status: 'CONFIRMED',
            cancelToken: newCancelToken,
            rescheduleToken: newRescheduleToken,
            rescheduledFromId: oldBooking.id,
          },
        });
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

    // Send reschedule emails asynchronously
    sendBookingRescheduledEmails({
      oldBooking,
      newBooking,
      host,
      eventType,
    }).catch(() => {});

    // Record audit log & trigger webhooks
    recordAuditLog({
      userId: host.id,
      action: 'BOOKING_RESCHEDULED',
      entityType: 'BOOKING',
      entityId: newBooking.id,
      metadata: { oldBookingId: oldBooking.id, newBookingId: newBooking.id },
    }).catch(() => {});

    triggerWebhooks({
      userId: host.id,
      event: 'booking.rescheduled',
      payload: {
        oldBookingId: oldBooking.id,
        newBookingId: newBooking.id,
        newStartTime: newBooking.startTime.toISOString(),
        status: 'CONFIRMED',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        id: newBooking.id,
        eventTitle: eventType.name,
        hostName: host.name,
        guestName: newBooking.guestName,
        guestEmail: newBooking.guestEmail,
        guestTimezone: newBooking.guestTimezone,
        startTime: newBooking.startTime.toISOString(),
        endTime: newBooking.endTime.toISOString(),
        cancelToken: newBooking.cancelToken,
        rescheduleToken: newBooking.rescheduleToken,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
