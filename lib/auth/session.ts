import { cookies } from 'next/headers';
import { db } from '@/lib/db/prisma';
import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'meetlio_session';
const SESSION_DURATION_DAYS = 7;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  username: string;
  timezone: string;
  bio?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  defaultMinNotice?: number;
  defaultMaxWindow?: number;
}

/**
 * Creates a server session in PostgreSQL for the given user ID and sets an HttpOnly cookie.
 * THROWS an error if database creation fails.
 */
export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Must persist to PostgreSQL. Do NOT swallow database errors.
  await db.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return sessionToken;
}

/**
 * Helper to set session cookie when session record is created inside an atomic transaction.
 */
export async function setSessionCookie(sessionToken: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Gets the authenticated user associated with the current request cookie.
 * Automatically clears stale or invalid session cookies to prevent redirect loops.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            timezone: true,
            bio: true,
            avatarUrl: true,
            passwordHash: true,
            defaultMinNotice: true,
            defaultMaxWindow: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clear invalid/expired cookie
      try {
        cookieStore.set(SESSION_COOKIE_NAME, '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          expires: new Date(0),
          path: '/',
        });
      } catch {}
      return null;
    }

    return session.user;
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    return null;
  }
}

/**
 * Destroys the current session and clears the HttpOnly cookie.
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await db.session.delete({ where: { sessionToken: token } }).catch(() => {});
    }

    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
}
