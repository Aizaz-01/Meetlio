import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

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
    const body = await request.json();
    const { optionId } = body;

    const poll = await db.meetingPoll.findUnique({
      where: { id },
      include: {
        options: {
          include: { votes: true },
        },
      },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 });
    }

    if (poll.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const selectedOption = poll.options.find((o) => o.id === optionId);
    if (!selectedOption) {
      return NextResponse.json({ success: false, error: 'Selected option not found' }, { status: 404 });
    }

    // Find default event type or fallback
    const defaultEventType = await db.eventType.findFirst({
      where: { userId: user.id },
    });

    if (!defaultEventType) {
      return NextResponse.json({ success: false, error: 'No event type available to bind booking' }, { status: 400 });
    }

    const firstVoter = selectedOption.votes[0] || { voterName: 'Group Attendees', voterEmail: user.email };

    // Finalize poll & create real booking
    const [updatedPoll, booking] = await db.$transaction([
      db.meetingPoll.update({
        where: { id },
        data: {
          isFinalized: true,
          finalizedSlot: selectedOption.id,
        },
      }),
      db.booking.create({
        data: {
          userId: user.id,
          eventTypeId: defaultEventType.id,
          guestName: firstVoter.voterName,
          guestEmail: firstVoter.voterEmail,
          startTime: selectedOption.startTime,
          endTime: selectedOption.endTime,
          status: 'CONFIRMED',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Meeting poll finalized and booking scheduled!',
      data: {
        poll: updatedPoll,
        booking,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to finalize meeting poll' },
      { status: 500 }
    );
  }
}
