import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { getGoogleOAuthStatus, getOutlookOAuthStatus } from '@/lib/integrations/env';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const connections = await db.calendarConnection.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        externalAccountId: true,
        providerAccountEmail: true,
        status: true,
        lastSyncedAt: true,
        syncError: true,
        createdAt: true,
      },
    });

    const googleConnection = connections.find((c) => c.provider === 'GOOGLE') || null;
    const outlookConnection = connections.find((c) => c.provider === 'OUTLOOK') || null;

    const googleEnv = getGoogleOAuthStatus();
    const outlookEnv = getOutlookOAuthStatus();

    const googleData = googleConnection
      ? {
          id: googleConnection.id,
          connected: true,
          status: googleConnection.status,
          providerAccountEmail: googleConnection.providerAccountEmail || googleConnection.externalAccountId,
          lastSyncedAt: googleConnection.lastSyncedAt,
          syncError: googleConnection.syncError,
        }
      : {
          connected: false,
          status: googleEnv.status,
          isConfigured: googleEnv.isConfigured,
        };

    const outlookData = outlookConnection
      ? {
          id: outlookConnection.id,
          connected: true,
          status: outlookConnection.status,
          providerAccountEmail: outlookConnection.providerAccountEmail || outlookConnection.externalAccountId,
          lastSyncedAt: outlookConnection.lastSyncedAt,
          syncError: outlookConnection.syncError,
        }
      : {
          connected: false,
          status: outlookEnv.status,
          isConfigured: outlookEnv.isConfigured,
        };

    return NextResponse.json({
      success: true,
      data: {
        google: googleData,
        outlook: outlookData,
        rawConnections: connections,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch calendar connections' },
      { status: 500 }
    );
  }
}
