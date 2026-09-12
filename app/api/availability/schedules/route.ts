import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { getOrCreateDefaultSchedule } from '@/lib/scheduling/seed-schedules';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    await getOrCreateDefaultSchedule(user.id);

    const schedules = await db.availabilitySchedule.findMany({
      where: { userId: user.id },
      include: {
        availabilities: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch availability schedules' },
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
    const { name, timeZone, isDefault } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Schedule name is required' }, { status: 400 });
    }

    const createdSchedule = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.availabilitySchedule.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      const sched = await tx.availabilitySchedule.create({
        data: {
          userId: user.id,
          name: name.trim(),
          timeZone: timeZone || user.timezone || 'UTC',
          isDefault: Boolean(isDefault),
        },
      });

      // Populate default working hours (Mon-Fri 09:00-17:00) for new schedule
      const defaultIntervals = [];
      for (let day = 0; day <= 6; day++) {
        defaultIntervals.push({
          userId: user.id,
          scheduleId: sched.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isActive: day >= 1 && day <= 5,
        });
      }

      await tx.availability.createMany({
        data: defaultIntervals,
      });

      return sched;
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      data: createdSchedule,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create availability schedule' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, isDefault, timeZone } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
    }

    const existing = await db.availabilitySchedule.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Schedule not found or unauthorized' }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      if (isDefault) {
        await tx.availabilitySchedule.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      return tx.availabilitySchedule.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(timeZone ? { timeZone } : {}),
          ...(typeof isDefault === 'boolean' ? { isDefault } : {}),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update availability schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
    }

    const target = await db.availabilitySchedule.findFirst({
      where: { id, userId: user.id },
    });

    if (!target) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    if (target.isDefault) {
      return NextResponse.json({ success: false, error: 'Cannot delete default schedule' }, { status: 400 });
    }

    await db.availabilitySchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete availability schedule' },
      { status: 500 }
    );
  }
}
