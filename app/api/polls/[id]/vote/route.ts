import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { optionId, voterName, voterEmail } = body;

    if (!optionId || !voterName || !voterEmail) {
      return NextResponse.json(
        { success: false, error: 'Option ID, voter name, and voter email are required' },
        { status: 400 }
      );
    }

    const poll = await db.meetingPoll.findUnique({
      where: { id },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: 'Meeting poll not found' }, { status: 404 });
    }

    if (poll.isFinalized) {
      return NextResponse.json({ success: false, error: 'This meeting poll is already finalized' }, { status: 400 });
    }

    const cleanEmail = voterEmail.toLowerCase().trim();

    // Vote duplicate protection
    const existingVote = await db.meetingPollVote.findUnique({
      where: {
        pollId_optionId_voterEmail: {
          pollId: id,
          optionId,
          voterEmail: cleanEmail,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json({ success: false, error: 'You have already voted for this option' }, { status: 400 });
    }

    const vote = await db.meetingPollVote.create({
      data: {
        pollId: id,
        optionId,
        voterName: voterName.trim(),
        voterEmail: cleanEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vote cast successfully',
      data: vote,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
