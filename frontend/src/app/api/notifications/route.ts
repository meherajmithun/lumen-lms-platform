import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getMyEnrollmentApplications } from '@/lib/api/enrollments';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') return NextResponse.json({ data: [] });
  try {
    const rows = await getMyEnrollmentApplications();
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ data: [] }, { status: 503 });
  }
}
