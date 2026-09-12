import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { incrementBookingUsage } from '@/lib/billing/usage';
import { recordAuditLog } from '@/lib/audit/service';
import { sendBookingConfirmationEmails } from '@/lib/email/service';

export async function POST(
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
        invitees: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Booking status is currently ${booking.status}, cannot approve.` },
        { status: 400 }
      );
    }

    // 1. Update Booking status to CONFIRMED
    const approvedBooking = await db.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    // 2. Increment Booking Quota Usage safely
    await incrementBookingUsage(user.id).catch(() => {});

    // 3. Send Emails to Host, Guest, and Invitees
    sendBookingConfirmationEmails({
      booking,
      host: booking.user,
      eventType: booking.eventType,
    }).catch(() => {});

    // 4. Audit Log
    recordAuditLog({
      userId: user.id,
      action: 'BOOKING_APPROVED',
      entityType: 'BOOKING',
      entityId: booking.id,
      metadata: { guestName: booking.guestName, guestEmail: booking.guestEmail },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Booking approved successfully',
      data: approvedBooking,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to approve booking' },
      { status: 500 }
    );
  }
}
