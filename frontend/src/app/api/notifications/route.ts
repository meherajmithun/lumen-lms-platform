import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getMyNotifications, markAllNotificationsRead } from '@/lib/api/notifications';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ data: [] }, { status: 401 });
  try {
    const rows = await getMyNotifications();
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ data: [] }, { status: 503 });
  }
}

export async function PUT() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    await markAllNotificationsRead();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
