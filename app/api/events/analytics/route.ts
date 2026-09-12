import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const eventTypes = await db.eventType.findMany({
      where: { userId: user.id },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            startTime: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const analytics = eventTypes.map((evt) => {
      const total = evt.bookings.length;
      const confirmed = evt.bookings.filter((b) => b.status === 'CONFIRMED').length;
      const cancelled = evt.bookings.filter((b) => b.status === 'CANCELLED').length;
      const completed = evt.bookings.filter((b) => b.status === 'COMPLETED').length;
      const upcoming = evt.bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.startTime) >= now).length;
      const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

      return {
        eventTypeId: evt.id,
        name: evt.name,
        slug: evt.slug,
        duration: evt.duration,
        isActive: evt.isActive,
        totalBookings: total,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled,
        completedBookings: completed,
        upcomingBookings: upcoming,
        cancellationRate,
      };
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch event analytics' },
      { status: 500 }
    );
  }
}
