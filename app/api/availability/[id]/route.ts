import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateAvailabilityWindowSchema, hasOverlappingWindows } from '@/lib/validation/availability.schema';
import { db } from '@/lib/db/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existingWindow = await db.availability.findUnique({
      where: { id },
    });

    if (!existingWindow) {
      return NextResponse.json({ success: false, error: 'Availability window not found' }, { status: 404 });
    }

    if (existingWindow.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateAvailabilityWindowSchema.parse(body);

    const targetStartTime = parsed.startTime || existingWindow.startTime;
    const targetEndTime = parsed.endTime || existingWindow.endTime;
    const targetIsActive = parsed.isActive !== undefined ? parsed.isActive : existingWindow.isActive;

    if (targetIsActive) {
      // Check overlaps with other windows for the same day (excluding current window)
      const siblingWindows = await db.availability.findMany({
        where: {
          userId: user.id,
          dayOfWeek: existingWindow.dayOfWeek,
          isActive: true,
          NOT: { id },
        },
      });

      const candidateWindows = [
        ...siblingWindows.map((w) => ({ startTime: w.startTime, endTime: w.endTime })),
        { startTime: targetStartTime, endTime: targetEndTime },
      ];

      if (hasOverlappingWindows(candidateWindows)) {
        return NextResponse.json(
          {
            success: false,
            error: `Time window ${targetStartTime}-${targetEndTime} overlaps with another active window on this day.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await db.availability.update({
      where: { id },
      data: {
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        isActive: parsed.isActive,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to update availability window' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existingWindow = await db.availability.findUnique({
      where: { id },
    });

    if (!existingWindow) {
      return NextResponse.json({ success: false, error: 'Availability window not found' }, { status: 404 });
    }

    if (existingWindow.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    await db.availability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Availability window deleted' });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete availability window' }, { status: 500 });
  }
}
