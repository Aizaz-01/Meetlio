import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import crypto from 'crypto';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=google_not_configured', request.url)
    );
  }

  // Create cryptographically secure OAuth state
  const state = crypto.randomBytes(32).toString('hex');
  const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/calendar.readonly');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

  const response = NextResponse.redirect(authUrl);

  // Store state in secure HTTP-only cookie
  response.cookies.set('meetlio_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
