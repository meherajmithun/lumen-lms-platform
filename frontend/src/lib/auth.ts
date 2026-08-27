import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Role, SessionUser } from '@/types/lms';
import { readSession } from './session';

/**
 * Cached per request, so twelve components asking "who is this?" verify the
 * cookie once rather than twelve times.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => readSession());

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * Call at the top of every protected page AND every Server Action.
 *
 * A Server Action is a public HTTP endpoint of its own — guarding only the page
 * that renders the form leaves the action itself callable. This is the frontend
 * half of "enforce on the backend, not just by hiding buttons"; Strapi enforces
 * the same rules again regardless of what happens here.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/403');
  return user;
}
