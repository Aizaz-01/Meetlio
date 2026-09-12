import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { availabilityWindowSchema, hasOverlappingWindows } from '@/lib/validation/availability.schema';
import { db } from '@/lib/db/prisma';
import { getOrCreateDefaultSchedule } from '@/lib/scheduling/seed-schedules';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      const defaultSched = await getOrCreateDefaultSchedule(user.id);
      scheduleId = defaultSched.id;
    }

    const availabilities = await db.availability.findMany({
      where: { userId: user.id, scheduleId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: {
        timezone: user.timezone || 'UTC',
        scheduleId,
        availabilities,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch availability schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { scheduleId: bodyScheduleId, ...rest } = body;
    const parsed = availabilityWindowSchema.parse(rest);

    let targetScheduleId = bodyScheduleId;
    if (!targetScheduleId) {
      const defaultSched = await getOrCreateDefaultSchedule(user.id);
      targetScheduleId = defaultSched.id;
    }

    // Fetch existing windows for the same day in this schedule to check overlap
    const existingDayWindows = await db.availability.findMany({
      where: {
        userId: user.id,
        scheduleId: targetScheduleId,
        dayOfWeek: parsed.dayOfWeek,
        isActive: true,
      },
    });

    const candidateWindows = [
      ...existingDayWindows.map((w) => ({ startTime: w.startTime, endTime: w.endTime })),
      { startTime: parsed.startTime, endTime: parsed.endTime },
    ];

    if (hasOverlappingWindows(candidateWindows)) {
      return NextResponse.json(
        {
          success: false,
          error: `Time window ${parsed.startTime}-${parsed.endTime} overlaps with an existing window on this day.`,
        },
        { status: 400 }
      );
    }

    const newWindow = await db.availability.create({
      data: {
        userId: user.id,
        scheduleId: targetScheduleId,
        dayOfWeek: parsed.dayOfWeek,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isActive: parsed.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: newWindow }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid window input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create availability window' },
      { status: 500 }
    );
  }
}
