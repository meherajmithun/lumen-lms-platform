import 'server-only';
import { cookies } from 'next/headers';
import type { SessionUser } from '@/types/lms';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  TOKEN_COOKIE_NAME,
  hasUsableStrapiToken,
  signSession,
  verifySessionCookie,
} from './session-token';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

/**
 * Stores two httpOnly cookies:
 *   lms_token   - the Strapi JWT, forwarded server-to-server on every API call
 *   lms_session - our own signed copy of { id, username, email, role }
 *
 * The second exists so the Edge middleware can route by role without a network
 * call. It is signed so it cannot be forged, but it is only ever used for
 * navigation. Authorisation is always re-derived by Strapi from the JWT, so a
 * role that changes mid-session can show a user a link they will then be refused
 * — which is the correct trade-off, not a bug.
 */
export async function createSession(jwt: string, user: SessionUser): Promise<void> {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE_NAME, jwt, cookieOptions);
  jar.set(SESSION_COOKIE_NAME, await signSession(user), cookieOptions);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE_NAME);
  jar.delete(SESSION_COOKIE_NAME);
}

export async function updateSessionUser(user: SessionUser): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, await signSession(user), cookieOptions);
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  if (!hasUsableStrapiToken(jar.get(TOKEN_COOKIE_NAME)?.value)) return null;
  return verifySessionCookie(jar.get(SESSION_COOKIE_NAME)?.value);
}

export { SESSION_COOKIE_NAME, TOKEN_COOKIE_NAME };
