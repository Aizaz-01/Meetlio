import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createEventTypeSchema } from '@/lib/validation/event.schema';
import { generateUniqueUserSlug } from '@/lib/scheduling/slug';
import { db } from '@/lib/db/prisma';
import { canCreateEventType } from '@/lib/billing/usage';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const eventTypes = await db.eventType.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: eventTypes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  // Server-side Plan Limit Check
  const limitCheck = await canCreateEventType(user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PLAN_LIMIT_REACHED',
          message: 'Maximum event types limit reached for your plan. Please upgrade to create more event types.',
          details: {
            resource: 'eventTypes',
            limit: limitCheck.limit,
            current: limitCheck.current,
          },
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createEventTypeSchema.parse(body);

    const slug = await generateUniqueUserSlug(user.id, parsed.slug || parsed.name);

    const newEvent = await db.eventType.create({
      data: {
        userId: user.id,
        name: parsed.name.trim(),
        slug,
        description: parsed.description || null,
        duration: parsed.duration,
        kind: body.kind || 'ONE_ON_ONE',
        maxAttendees: body.maxAttendees ? Number(body.maxAttendees) : 1,
        scheduleId: body.scheduleId || null,
        locationType: parsed.locationType,
        locationInfo: parsed.locationInfo || null,
        isActive: parsed.isActive ?? true,
        bufferBefore: parsed.bufferBefore ?? 0,
        bufferAfter: parsed.bufferAfter ?? 0,
        minimumNotice: parsed.minimumNotice ?? 120,
        maximumBookingWindow: parsed.maximumBookingWindow ?? 60,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newEvent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid event configuration payload' },
        { status: 400 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'An event with a similar name/slug already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred while creating event type.' },
      { status: 500 }
    );
  }
}
