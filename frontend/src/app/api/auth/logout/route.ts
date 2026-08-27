import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { destroySession } from '@/lib/session';

export async function POST() {
  await destroySession();
  // Drop any rendered output cached for the signed-in user.
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
