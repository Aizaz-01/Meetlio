import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { sendBookingCancellationEmails } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/audit/service';
import { triggerWebhooks } from '@/lib/webhooks/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, reason } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Cancellation token is required' }, { status: 400 });
    }

    const booking = await db.booking.findFirst({
      where: {
        OR: [
          { cancelToken: token },
          { id: token },
        ],
      },
      include: {
        user: true,
        eventType: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found or invalid token' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'This booking has already been cancelled.' }, { status: 400 });
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Completed meetings cannot be cancelled.' }, { status: 400 });
    }

    const updatedBooking = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'GUEST',
        cancellationReason: reason?.trim() || 'Cancelled by guest',
      },
    });

    // Send cancellation emails asynchronously
    sendBookingCancellationEmails({
      booking: updatedBooking,
      host: booking.user,
      eventType: booking.eventType,
      cancelledBy: 'GUEST',
      reason: updatedBooking.cancellationReason,
    }).catch(() => {});

    // Record audit log & webhooks
    recordAuditLog({
      userId: booking.userId,
      action: 'BOOKING_CANCELLED',
      entityType: 'BOOKING',
      entityId: booking.id,
      metadata: { cancelledBy: 'GUEST', reason: updatedBooking.cancellationReason },
    }).catch(() => {});

    triggerWebhooks({
      userId: booking.userId,
      event: 'booking.cancelled',
      payload: {
        bookingId: booking.id,
        cancelledBy: 'GUEST',
        reason: updatedBooking.cancellationReason,
        status: 'CANCELLED',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        cancelledAt: updatedBooking.cancelledAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
