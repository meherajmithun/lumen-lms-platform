import { NextResponse } from 'next/server';
import { strapiFetch, StrapiError } from '@/lib/strapi';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const response = await strapiFetch('/learning-sessions/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ data: body }),
    });
    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof StrapiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Tracking failed' }, { status });
  }
}
