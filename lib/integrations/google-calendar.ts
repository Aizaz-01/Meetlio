import { getValidAccessToken } from './token-manager';

export interface ExternalEventItem {
  externalId: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

export async function fetchGoogleBusyEvents(
  connectionId: string,
  timeMin: Date,
  timeMax: Date
): Promise<ExternalEventItem[]> {
  const token = await getValidAccessToken(connectionId);
  if (!token) return [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error('Google Calendar API fetch error:', res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.items)) return [];

    return data.items
      .filter((item: any) => item.start && item.end && item.status !== 'cancelled')
      .map((item: any) => ({
        externalId: item.id || `g_${Date.now()}`,
        title: item.summary || 'Busy (External Calendar)',
        startTime: new Date(item.start.dateTime || item.start.date),
        endTime: new Date(item.end.dateTime || item.end.date),
      }));
  } catch (err) {
    console.error('Failed to fetch Google Calendar busy events:', err);
    return [];
  }
}
