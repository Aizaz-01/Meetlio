import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('meetlio_session')?.value;

  // Protect /app and /dashboard routes
  const isAppRoute = pathname.startsWith('/app');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if ((isAppRoute || isDashboardRoute) && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect legacy /dashboard routes to /app equivalents
  if (isDashboardRoute && sessionCookie) {
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    if (pathname === '/dashboard/event-types') {
      return NextResponse.redirect(new URL('/app/scheduling', request.url));
    }
    if (pathname === '/dashboard/bookings') {
      return NextResponse.redirect(new URL('/app/meetings', request.url));
    }
    const targetPath = pathname.replace('/dashboard', '/app');
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/dashboard/:path*'],
};
