import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { loginSchema } from '@/lib/validation/auth';
import type { Role } from '@/types/lms';

const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';

/**
 * Exchanges credentials for an httpOnly session.
 *
 * The Strapi JWT is set as a cookie the browser cannot read. Note the second
 * request: a Strapi JWT payload carries only { id, iat, exp } — no role — so the
 * role has to be fetched before we can route by it. Assuming the role is in the
 * token is a common and silently broken shortcut.
 */
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter your email and password' }, { status: 400 });
  }

  const authResponse = await fetch(`${BASE}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
    cache: 'no-store',
  });

  if (!authResponse.ok) {
    return NextResponse.json({ error: 'That email and password do not match.' }, { status: 401 });
  }

  const { jwt } = (await authResponse.json()) as { jwt: string };

  const meResponse = await fetch(`${BASE}/api/users/me?populate=role`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: 'no-store',
  });
  if (!meResponse.ok) {
    return NextResponse.json({ error: 'Could not load your account.' }, { status: 500 });
  }

  const me = (await meResponse.json()) as {
    id: number;
    username: string;
    email: string;
    role?: { type?: string };
  };

  await createSession(jwt, {
    id: me.id,
    username: me.username,
    email: me.email,
    role: (me.role?.type ?? 'student') as Role,
  });

  return NextResponse.json({ role: me.role?.type ?? 'student' });
}
