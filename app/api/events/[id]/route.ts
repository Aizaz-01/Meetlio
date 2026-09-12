import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateEventTypeSchema } from '@/lib/validation/event.schema';
import { generateUniqueUserSlug } from '@/lib/scheduling/slug';
import { db } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const eventType = await db.eventType.findUnique({
      where: { id },
    });

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'Event type not found' }, { status: 404 });
    }

    if (eventType.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: eventType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch event type' },
      { status: 500 }
    );
  }
}

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
    const existing = await db.eventType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Event type not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateEventTypeSchema.parse(body);

    let slug = existing.slug;
    if (parsed.name && parsed.name.trim() !== existing.name) {
      slug = await generateUniqueUserSlug(user.id, parsed.slug || parsed.name);
    } else if (parsed.slug && parsed.slug !== existing.slug) {
      slug = await generateUniqueUserSlug(user.id, parsed.slug);
    }

    const updated = await db.eventType.update({
      where: { id },
      data: {
        name: parsed.name !== undefined ? parsed.name.trim() : undefined,
        slug,
        description: parsed.description !== undefined ? parsed.description : undefined,
        duration: parsed.duration !== undefined ? parsed.duration : undefined,
        kind: body.kind !== undefined ? body.kind : undefined,
        maxAttendees: body.maxAttendees !== undefined ? Number(body.maxAttendees) : undefined,
        scheduleId: body.scheduleId !== undefined ? body.scheduleId : undefined,
        locationType: parsed.locationType !== undefined ? parsed.locationType : undefined,
        locationInfo: parsed.locationInfo !== undefined ? parsed.locationInfo : undefined,
        isActive: parsed.isActive !== undefined ? parsed.isActive : undefined,
        bufferBefore: parsed.bufferBefore !== undefined ? parsed.bufferBefore : undefined,
        bufferAfter: parsed.bufferAfter !== undefined ? parsed.bufferAfter : undefined,
        minimumNotice: parsed.minimumNotice !== undefined ? parsed.minimumNotice : undefined,
        maximumBookingWindow: parsed.maximumBookingWindow !== undefined ? parsed.maximumBookingWindow : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid event update payload' },
        { status: 400 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'An event with a similar slug already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event type' },
      { status: 500 }
    );
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
    const existing = await db.eventType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Event type not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    await db.eventType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Event type deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete event type' },
      { status: 500 }
    );
  }
}
