import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await db.booking.findFirst({
      where: {
        OR: [
          { cancelToken: token },
          { rescheduleToken: token },
          { id: token },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        eventType: {
          select: {
            name: true,
            locationType: true,
            locationInfo: true,
          },
        },
      },
    });

    if (!booking) {
      return new Response('Calendar invite not found', { status: 404 });
    }

    const formatIcsDate = (d: Date): string => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dtStart = formatIcsDate(new Date(booking.startTime));
    const dtEnd = formatIcsDate(new Date(booking.endTime));
    const dtStamp = formatIcsDate(new Date());

    const summary = `${booking.eventType?.name || 'Meeting'} with ${booking.user?.name || 'Host'}`;
    const description = `Meeting scheduled via Meetlio.\\nHost: ${booking.user?.name} (${booking.user?.email})\\nGuest: ${booking.guestName} (${booking.guestEmail})`;
    const location = booking.eventType?.locationInfo || booking.eventType?.locationType?.replace('_', ' ') || 'Google Meet Video Call';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Meetlio//Scheduling Application//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:meetlio-booking-${booking.id}@meetlio.com`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `STATUS:${booking.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="meetlio-event-${booking.id.substring(0, 8)}.ics"`,
      },
    });
  } catch (err: any) {
    return new Response('Failed to generate calendar invite', { status: 500 });
  }
}
