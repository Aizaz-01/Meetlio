import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
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
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'Event type not found' }, { status: 404 });
    }

    if (eventType.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: eventType.questions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch event questions' },
      { status: 500 }
    );
  }
}

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
    const eventType = await db.eventType.findUnique({
      where: { id },
    });

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'Event type not found' }, { status: 404 });
    }

    if (eventType.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();
    const { label, type, options, isRequired, order } = body;

    if (!label || typeof label !== 'string' || !label.trim()) {
      return NextResponse.json({ success: false, error: 'Question label is required' }, { status: 400 });
    }

    const validTypes = ['SHORT_TEXT', 'LONG_TEXT', 'PHONE', 'SINGLE_SELECT', 'MULTI_SELECT'];
    const questionType = validTypes.includes(type) ? type : 'SHORT_TEXT';

    const question = await db.eventBookingQuestion.create({
      data: {
        eventTypeId: id,
        label: label.trim(),
        type: questionType,
        options: Array.isArray(options) ? options : [],
        isRequired: Boolean(isRequired),
        order: Number(order) || 0,
      },
    });

    return NextResponse.json(
      { success: true, data: question },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create booking question' },
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
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('questionId');

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

    if (questionId) {
      await db.eventBookingQuestion.delete({
        where: { id: questionId },
      });
    } else {
      await db.eventBookingQuestion.deleteMany({
        where: { eventTypeId: id },
      });
    }

    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete booking question' },
      { status: 500 }
    );
  }
}
