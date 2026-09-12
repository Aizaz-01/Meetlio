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
    const body = await request.json();
    const { attendance } = body;

    if (attendance !== 'ATTENDED' && attendance !== 'NO_SHOW') {
      return NextResponse.json(
        { success: false, error: 'Invalid attendance value. Must be ATTENDED or NO_SHOW' },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const updated = await db.booking.update({
      where: { id },
      data: {
        attendance,
        status: 'COMPLETED',
      },
    });

    recordAuditLog({
      userId: user.id,
      action: attendance === 'NO_SHOW' ? 'BOOKING_NO_SHOW' : 'BOOKING_ATTENDED',
      entityType: 'BOOKING',
      entityId: booking.id,
      metadata: { guestName: booking.guestName, guestEmail: booking.guestEmail, attendance },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Attendance recorded as ${attendance}`,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update attendance' },
      { status: 500 }
    );
  }
}
