import { db } from '@/lib/db/prisma';
import { fetchGoogleBusyEvents } from './google-calendar';
import { fetchOutlookBusyEvents } from './outlook-calendar';

export async function syncUserCalendarConnection(connectionId: string): Promise<{
  success: boolean;
  syncedEventsCount: number;
  error?: string;
}> {
  const connection = await db.calendarConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return { success: false, syncedEventsCount: 0, error: 'Connection not found' };
  }

  const now = new Date();
  const timeMin = new Date(now.getTime() - 7 * 86400000); // 7 days in past
  const timeMax = new Date(now.getTime() + 60 * 86400000); // 60 days ahead

  try {
    let events: Array<{ externalId: string; title: string; startTime: Date; endTime: Date }> = [];

    if (connection.provider === 'GOOGLE') {
      events = await fetchGoogleBusyEvents(connectionId, timeMin, timeMax);
    } else if (connection.provider === 'OUTLOOK') {
      events = await fetchOutlookBusyEvents(connectionId, timeMin, timeMax);
    }

    // Replace external events in database inside transaction
    await db.$transaction([
      db.externalCalendarEvent.deleteMany({
        where: { connectionId: connection.id },
      }),
      ...(events.length > 0
        ? [
            db.externalCalendarEvent.createMany({
              data: events.map((e) => ({
                userId: connection.userId,
                connectionId: connection.id,
                provider: connection.provider,
                externalId: e.externalId,
                title: e.title,
                startTime: e.startTime,
                endTime: e.endTime,
              })),
            }),
          ]
        : []),
      db.calendarConnection.update({
        where: { id: connection.id },
        data: {
          lastSyncedAt: new Date(),
          status: 'CONNECTED',
          syncError: null,
        },
      }),
    ]);

    return {
      success: true,
      syncedEventsCount: events.length,
    };
  } catch (err: any) {
    console.error('Calendar Synchronization Failed:', err);
    await db.calendarConnection.update({
      where: { id: connection.id },
      data: {
        syncError: err.message || 'Sync failed',
        status: 'ERROR',
      },
    });
    return { success: false, syncedEventsCount: 0, error: err.message || 'Sync failed' };
  }
}
