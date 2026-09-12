import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

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
    const connection = await db.calendarConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json({ success: false, error: 'Calendar connection not found' }, { status: 404 });
    }

    if (connection.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    // Delete connection and associated external events atomically
    await db.$transaction([
      db.externalCalendarEvent.deleteMany({
        where: { connectionId: connection.id },
      }),
      db.calendarConnection.delete({
        where: { id: connection.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
