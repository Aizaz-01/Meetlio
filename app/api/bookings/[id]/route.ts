import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { generateAvailableSlots } from '@/lib/scheduling/slots';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';
import { hasTimeConflict } from '@/lib/scheduling/conflicts';
import { generateSecureToken } from '@/lib/auth/tokens';
import { sendBookingCancellationEmails, sendBookingRescheduledEmails } from '@/lib/email/service';
import { AvailabilityOverrideItem } from '@/types/scheduling';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        eventType: true,
        rescheduledFrom: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        eventType: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Booking is already cancelled' }, { status: 400 });
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Completed meetings cannot be modified' }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action || (body.status === 'CANCELLED' ? 'cancel' : undefined);

    // Host Cancellation Action
    if (action === 'cancel') {
      const reason = body.reason || body.cancellationReason || 'Cancelled by host';

      const updated = await db.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'HOST',
          cancellationReason: reason,
        },
      });

      sendBookingCancellationEmails({
        booking: updated,
        host: user,
        eventType: booking.eventType,
        cancelledBy: 'HOST',
        reason,
      }).catch(() => {});

      return NextResponse.json({ success: true, data: updated });
    }

    // Host Reschedule Action
    if (action === 'reschedule') {
      const newStartTimeStr = body.newStartTime;
      if (!newStartTimeStr) {
        return NextResponse.json({ success: false, error: 'New start time is required for rescheduling' }, { status: 400 });
      }

      const proposedStart = new Date(newStartTimeStr);
      if (isNaN(proposedStart.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid datetime format for new start time' }, { status: 400 });
      }

      const eventType = booking.eventType;
      const proposedEnd = new Date(proposedStart.getTime() + eventType.duration * 60 * 1000);
      const targetDate = proposedStart.toISOString().split('T')[0];

      // Phase 4 Engine Availability Check
      const hostAvailabilities = await db.availability.findMany({
        where: { userId: user.id },
      });

      const hostOverridesRaw = await db.availabilityOverride.findMany({
        where: { userId: user.id },
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
          userId: user.id,
          status: 'CONFIRMED',
          NOT: { id: booking.id },
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
        hostTimezone: user.timezone || 'UTC',
        guestTimezone: booking.guestTimezone,
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

      // Transaction-Safe Host Reschedule
      const newCancelToken = generateSecureToken().rawToken;
      const newRescheduleToken = generateSecureToken().rawToken;

      let newBooking;
      try {
        newBooking = await db.$transaction(async (tx) => {
          const freshConfirmed = await tx.booking.findMany({
            where: {
              userId: user.id,
              status: 'CONFIRMED',
              NOT: { id: booking.id },
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

          // Cancel original booking
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CANCELLED',
              cancelledBy: 'HOST',
              cancellationReason: 'Rescheduled by host',
              cancelledAt: new Date(),
              rescheduledAt: new Date(),
            },
          });

          // Create replacement booking
          return await tx.booking.create({
            data: {
              userId: user.id,
              eventTypeId: eventType.id,
              guestName: booking.guestName,
              guestEmail: booking.guestEmail,
              guestTimezone: booking.guestTimezone,
              startTime: proposedStart,
              endTime: proposedEnd,
              status: 'CONFIRMED',
              cancelToken: newCancelToken,
              rescheduleToken: newRescheduleToken,
              rescheduledFromId: booking.id,
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

      sendBookingRescheduledEmails({
        oldBooking: booking,
        newBooking,
        host: user,
        eventType,
      }).catch(() => {});

      return NextResponse.json({ success: true, data: newBooking });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update booking' },
      { status: 500 }
    );
  }
}
