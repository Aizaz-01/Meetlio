import { db } from '@/lib/db/prisma';
import { decryptToken, encryptToken } from './token-encryption';

export async function getValidAccessToken(connectionId: string): Promise<string | null> {
  const connection = await db.calendarConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection || !connection.accessTokenEncrypted) return null;

  const decryptedAccess = decryptToken(connection.accessTokenEncrypted);
  const decryptedRefresh = connection.refreshTokenEncrypted
    ? decryptToken(connection.refreshTokenEncrypted)
    : null;

  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minute safety buffer

  // Check if access token is still valid
  if (connection.expiresAt && connection.expiresAt.getTime() - bufferMs > now.getTime()) {
    return decryptedAccess;
  }

  // Attempt refresh if refresh token exists
  if (!decryptedRefresh) {
    if (connection.expiresAt && connection.expiresAt.getTime() <= now.getTime()) {
      await db.calendarConnection.update({
        where: { id: connectionId },
        data: { status: 'ERROR', syncError: 'Access token expired and no refresh token available.' },
      });
      return null;
    }
    return decryptedAccess;
  }

  try {
    if (connection.provider === 'GOOGLE') {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: decryptedRefresh,
          grant_type: 'refresh_token',
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);
        await db.calendarConnection.update({
          where: { id: connectionId },
          data: {
            accessTokenEncrypted: encryptToken(data.access_token),
            expiresAt: newExpiry,
            status: 'CONNECTED',
            syncError: null,
          },
        });
        return data.access_token;
      }
    } else if (connection.provider === 'OUTLOOK') {
      const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || '',
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
          refresh_token: decryptedRefresh,
          grant_type: 'refresh_token',
          scope: 'offline_access https://graph.microsoft.com/Calendars.Read',
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);
        await db.calendarConnection.update({
          where: { id: connectionId },
          data: {
            accessTokenEncrypted: encryptToken(data.access_token),
            ...(data.refresh_token ? { refreshTokenEncrypted: encryptToken(data.refresh_token) } : {}),
            expiresAt: newExpiry,
            status: 'CONNECTED',
            syncError: null,
          },
        });
        return data.access_token;
      }
    }
  } catch (err: any) {
    console.error(`Token Refresh Failed for ${connection.provider}:`, err);
    await db.calendarConnection.update({
      where: { id: connectionId },
      data: { status: 'ERROR', syncError: 'Failed to refresh OAuth token' },
    });
  }

  return null;
}
