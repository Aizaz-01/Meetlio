import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  try {
    const bookings = await db.booking.findMany({
      where: { userId: user.id },
      include: {
        eventType: { select: { name: true, duration: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    if (format === 'csv') {
      const headers = 'ID,Event Name,Guest Name,Guest Email,Start Time,End Time,Status,Timezone\n';
      const rows = bookings
        .map((b) =>
          [
            b.id,
            `"${b.eventType?.name || 'Meeting'}"`,
            `"${b.guestName}"`,
            `"${b.guestEmail}"`,
            `"${b.startTime.toISOString()}"`,
            `"${b.endTime.toISOString()}"`,
            b.status,
            b.guestTimezone,
          ].join(',')
        )
        .join('\n');

      const csvContent = headers + rows;

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="meetlio-bookings-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to export bookings' },
      { status: 500 }
    );
  }
}
