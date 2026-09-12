import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'upcoming';
  const search = searchParams.get('search')?.trim() || '';
  const eventTypeId = searchParams.get('eventType');
  const statusParam = searchParams.get('status');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const skip = (page - 1) * limit;

  const now = new Date();

  try {
    let whereCondition: any = { userId: user.id };

    if (tab === 'upcoming') {
      whereCondition.status = 'CONFIRMED';
      whereCondition.startTime = { gte: now };
    } else if (tab === 'past') {
      whereCondition.OR = [
        { status: 'COMPLETED' },
        { status: 'CONFIRMED', startTime: { lt: now } },
      ];
    } else if (tab === 'cancelled') {
      whereCondition.status = 'CANCELLED';
    } else if (tab === 'pending') {
      whereCondition.status = 'PENDING';
    }

    if (statusParam) {
      whereCondition.status = statusParam;
    }

    if (eventTypeId) {
      whereCondition.eventTypeId = eventTypeId;
    }

    if (fromParam || toParam) {
      whereCondition.startTime = {
        ...(whereCondition.startTime || {}),
        ...(fromParam ? { gte: new Date(fromParam) } : {}),
        ...(toParam ? { lte: new Date(toParam) } : {}),
      };
    }

    if (search) {
      whereCondition.AND = [
        ...(whereCondition.AND || []),
        {
          OR: [
            { guestName: { contains: search, mode: 'insensitive' } },
            { guestEmail: { contains: search, mode: 'insensitive' } },
            { eventType: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [total, bookings] = await Promise.all([
      db.booking.count({ where: whereCondition }),
      db.booking.findMany({
        where: whereCondition,
        include: {
          eventType: {
            select: {
              name: true,
              slug: true,
              duration: true,
              locationType: true,
              locationInfo: true,
            },
          },
        },
        orderBy: {
          startTime: tab === 'upcoming' ? 'asc' : 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
