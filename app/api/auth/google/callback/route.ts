import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/integrations/token-encryption';
import { syncUserCalendarConnection } from '@/lib/integrations/calendar-sync';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieState = request.headers.get('cookie')
    ?.split(';')
    .find((c) => c.trim().startsWith('meetlio_oauth_state='))
    ?.split('=')[1];

  if (error || !code || !state || state !== cookieState) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=oauth_invalid_state', request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=google_not_configured', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=token_exchange_failed', request.url)
      );
    }

    // Fetch user profile identity
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    const providerEmail = profileData.email || user.email;
    const externalAccountId = profileData.id || `g_${Date.now()}`;
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Upsert CalendarConnection
    const connection = await db.calendarConnection.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: 'GOOGLE',
        },
      },
      update: {
        externalAccountId,
        providerAccountEmail: providerEmail,
        calendarId: 'primary',
        accessTokenEncrypted: encryptToken(tokenData.access_token),
        ...(tokenData.refresh_token ? { refreshTokenEncrypted: encryptToken(tokenData.refresh_token) } : {}),
        expiresAt,
        status: 'CONNECTED',
        syncError: null,
      },
      create: {
        userId: user.id,
        provider: 'GOOGLE',
        externalAccountId,
        providerAccountEmail: providerEmail,
        calendarId: 'primary',
        accessTokenEncrypted: encryptToken(tokenData.access_token),
        refreshTokenEncrypted: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
        expiresAt,
        status: 'CONNECTED',
      },
    });

    // Trigger initial calendar sync asynchronously
    syncUserCalendarConnection(connection.id).catch(() => {});

    const response = NextResponse.redirect(
      new URL('/dashboard/integrations?status=google_connected', request.url)
    );

    response.cookies.delete('meetlio_oauth_state');
    return response;
  } catch (err) {
    console.error('Google OAuth Callback Error:', err);
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=google_callback_exception', request.url)
    );
  }
}
