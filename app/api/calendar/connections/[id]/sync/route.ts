import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { syncUserCalendarConnection } from '@/lib/integrations/calendar-sync';

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
    const connection = await db.calendarConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json({ success: false, error: 'Calendar connection not found' }, { status: 404 });
    }

    if (connection.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const result = await syncUserCalendarConnection(connection.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to sync calendar' },
        { status: 500 }
      );
    }

    const updated = await db.calendarConnection.findUnique({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Calendar re-synced successfully',
      data: {
        id: updated?.id,
        provider: updated?.provider,
        providerAccountEmail: updated?.providerAccountEmail,
        syncedEventsCount: result.syncedEventsCount,
        lastSyncedAt: updated?.lastSyncedAt,
        status: updated?.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}
