import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import crypto from 'crypto';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/outlook/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=outlook_not_configured', request.url)
    );
  }

  const state = crypto.randomBytes(32).toString('hex');
  const scope = encodeURIComponent('openid profile User.Read Calendars.Read offline_access');

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=${scope}&state=${state}`;

  const response = NextResponse.redirect(authUrl);

  response.cookies.set('meetlio_outlook_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
