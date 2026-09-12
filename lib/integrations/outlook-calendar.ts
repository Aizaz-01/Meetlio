import { getValidAccessToken } from './token-manager';
import { ExternalEventItem } from './google-calendar';

export async function fetchOutlookBusyEvents(
  connectionId: string,
  timeMin: Date,
  timeMax: Date
): Promise<ExternalEventItem[]> {
  const token = await getValidAccessToken(connectionId);
  if (!token) return [];

  try {
    const url = `https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${timeMin.toISOString()}&endDateTime=${timeMax.toISOString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });

    if (!res.ok) {
      console.error('Microsoft Graph API fetch error:', res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data.value)) return [];

    return data.value
      .filter((item: any) => item.showAs !== 'free')
      .map((item: any) => ({
        externalId: item.id || `m_${Date.now()}`,
        title: item.subject || 'Busy (External Calendar)',
        startTime: new Date(item.start.dateTime + 'Z'),
        endTime: new Date(item.end.dateTime + 'Z'),
      }));
  } catch (err) {
    console.error('Failed to fetch Outlook Calendar busy events:', err);
    return [];
  }
}
