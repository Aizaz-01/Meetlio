import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const poll = await db.meetingPoll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            votes: {
              select: { voterName: true, voterEmail: true },
            },
          },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: 'Meeting poll not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: poll });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch meeting poll' },
      { status: 500 }
    );
  }
}
