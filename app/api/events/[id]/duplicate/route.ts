import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { canCreateEventType } from '@/lib/billing/usage';
import { recordAuditLog } from '@/lib/audit/service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. Fetch source event type
    const sourceEvent = await db.eventType.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!sourceEvent) {
      return NextResponse.json({ success: false, error: 'Source event type not found' }, { status: 404 });
    }

    if (sourceEvent.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    // 2. Server-side Plan Limit Enforcement
    const eventCheck = await canCreateEventType(user.id);
    if (!eventCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LIMIT_REACHED',
            message: 'Event type limit reached for your active subscription plan.',
            details: {
              resource: 'eventTypes',
              limit: eventCheck.limit,
              current: eventCheck.current,
            },
          },
        },
        { status: 403 }
      );
    }

    // 3. Generate unique duplicate slug and name
    const timestamp = Date.now().toString().slice(-4);
    const newName = `${sourceEvent.name} (Copy)`;
    const newSlug = `${sourceEvent.slug}-copy-${timestamp}`;

    // 4. Duplicate event in atomic transaction
    const duplicatedEvent = await db.$transaction(async (tx) => {
      const newEvt = await tx.eventType.create({
        data: {
          userId: user.id,
          name: newName,
          slug: newSlug,
          description: sourceEvent.description,
          duration: sourceEvent.duration,
          kind: sourceEvent.kind,
          maxAttendees: sourceEvent.maxAttendees,
          locationType: sourceEvent.locationType,
          locationInfo: sourceEvent.locationInfo,
          isActive: sourceEvent.isActive,
          isPrivate: sourceEvent.isPrivate,
          bufferBefore: sourceEvent.bufferBefore,
          bufferAfter: sourceEvent.bufferAfter,
          minimumNotice: sourceEvent.minimumNotice,
          maximumBookingWindow: sourceEvent.maximumBookingWindow,
          scheduleId: sourceEvent.scheduleId,
        },
      });

      // Clone custom questions
      if (sourceEvent.questions && sourceEvent.questions.length > 0) {
        await tx.eventBookingQuestion.createMany({
          data: sourceEvent.questions.map((q) => ({
            eventTypeId: newEvt.id,
            label: q.label,
            type: q.type,
            options: q.options,
            isRequired: q.isRequired,
            order: q.order,
          })),
        });
      }

      return newEvt;
    });

    recordAuditLog({
      userId: user.id,
      action: 'EVENT_CREATED',
      entityType: 'EVENT_TYPE',
      entityId: duplicatedEvent.id,
      metadata: { name: duplicatedEvent.name, slug: duplicatedEvent.slug, duplicatedFrom: sourceEvent.id },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        message: 'Event type duplicated successfully',
        data: duplicatedEvent,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to duplicate event type' },
      { status: 500 }
    );
  }
}
