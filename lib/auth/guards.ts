import { redirect } from 'next/navigation';
import { getCurrentUser, SessionUser } from './session';

/**
 * Ensures a request is authenticated. Redirects to /login if unauthenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Ensures a request is unauthenticated. Redirects to /dashboard if logged in.
 */
export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }
}
