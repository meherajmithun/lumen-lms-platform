import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { registerSchema } from '@/lib/validation/auth';
import type { Role } from '@/types/lms';

const BASE = process.env.STRAPI_URL ?? 'http://localhost:1337';

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' },
      { status: 400 }
    );
  }

  // Strapi re-checks the requested role against its own whitelist, so this
  // request cannot create an admin even if the payload is tampered with.
  const { role, ...registration } = parsed.data;
  const response = await fetch(
    `${BASE}/api/register-with-role?role=${encodeURIComponent(role)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    return NextResponse.json(
      { error: body.error?.message ?? 'Could not create that account.' },
      { status: response.status }
    );
  }

  const { jwt, user } = (await response.json()) as {
    jwt: string;
    user: { id: number; username: string; email: string; role?: { type?: string } };
  };

  if (parsed.data.role === 'instructor') {
    return NextResponse.json({ role: 'instructor', pendingApproval: true });
  }

  await createSession(jwt, {
    id: user.id,
    username: user.username,
    email: user.email,
    role: (user.role?.type ?? parsed.data.role) as Role,
  });

  return NextResponse.json({ role: user.role?.type ?? parsed.data.role });
}
