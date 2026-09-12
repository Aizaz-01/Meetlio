import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ success: true, data: { events: [], bookings: [], contacts: [] } });
  }

  try {
    const [events, bookings, contacts] = await Promise.all([
      db.eventType.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      db.booking.findMany({
        where: {
          userId: user.id,
          OR: [
            { guestName: { contains: q, mode: 'insensitive' } },
            { guestEmail: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      db.contact.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { events, bookings, contacts },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
