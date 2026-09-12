import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateOverrideSchema } from '@/lib/validation/availability.schema';
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
    const existing = await db.availabilityOverride.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Date override not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateOverrideSchema.parse(body);

    const updated = await db.availabilityOverride.update({
      where: { id },
      data: {
        type: parsed.type,
        startTime: parsed.type === 'UNAVAILABLE' ? null : parsed.startTime,
        endTime: parsed.type === 'UNAVAILABLE' ? null : parsed.endTime,
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

    return NextResponse.json({ success: false, error: 'Failed to update date override' }, { status: 500 });
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
    const existing = await db.availabilityOverride.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Date override not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    await db.availabilityOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Date override deleted' });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete date override' }, { status: 500 });
  }
}
