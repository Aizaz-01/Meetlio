import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { recordAuditLog } from '@/lib/audit/service';

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
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

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

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Booking status is currently ${booking.status}, cannot reject.` },
        { status: 400 }
      );
    }

    const rejectedBooking = await db.booking.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Host rejected booking request',
      },
    });

    recordAuditLog({
      userId: user.id,
      action: 'BOOKING_REJECTED',
      entityType: 'BOOKING',
      entityId: booking.id,
      metadata: { guestEmail: booking.guestEmail, reason },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Booking request rejected',
      data: rejectedBooking,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reject booking' },
      { status: 500 }
    );
  }
}
