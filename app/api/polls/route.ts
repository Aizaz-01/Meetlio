import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const polls = await db.meetingPoll.findMany({
      where: { userId: user.id },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: polls });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch meeting polls' },
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
    const { title, description, duration, options } = body;

    if (!title || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Poll title and at least one time option are required' },
        { status: 400 }
      );
    }

    const poll = await db.meetingPoll.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description || null,
        duration: Number(duration) || 30,
        options: {
          createMany: {
            data: options.map((opt: any) => ({
              startTime: new Date(opt.startTime),
              endTime: new Date(opt.endTime),
            })),
          },
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ success: true, data: poll }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create meeting poll' },
      { status: 500 }
    );
  }
}
