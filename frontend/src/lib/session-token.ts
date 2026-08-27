import { decodeJwt, SignJWT, jwtVerify } from 'jose';
import type { Role, SessionUser } from '@/types/lms';

/**
 * Signing and verifying the session cookie, with no dependency on next/headers.
 *
 * Kept separate from session.ts so the Edge middleware can verify a session
 * without pulling in the cookie store, which is not available to it.
 */
export const SESSION_COOKIE_NAME = 'lms_session';
export const TOKEN_COOKIE_NAME = 'lms_token';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionCookie(value: string | undefined): Promise<SessionUser | null> {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, secret());
    const { id, username, email, role } = payload as Record<string, unknown>;
    if (typeof id !== 'number' || typeof role !== 'string') return null;
    return { id, username: String(username ?? ''), email: String(email ?? ''), role: role as Role };
  } catch {
    return null;
  }
}

/**
 * A session is usable only while its Strapi JWT exists and has not expired.
 *
 * This is an optimistic navigation check, not authorisation: Strapi still
 * verifies the token's signature on every API request. Reading `exp` here keeps
 * a stale `lms_session` cookie from admitting a user after `lms_token` has gone
 * missing or expired.
 */
export function hasUsableStrapiToken(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const { exp } = decodeJwt(value);
    return typeof exp === 'number' && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
