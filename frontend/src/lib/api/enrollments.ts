import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type { Enrollment } from '@/types/lms';
import type { ComboOffer } from '@/types/lms';

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const res = await strapiFetch<{ data: Enrollment[] }>('/enrollments/mine');
  return res.data ?? [];
}

/**
 * Enrollments for a page that must render whether or not the caller is signed in.
 *
 * The two session cookies can diverge: `lms_session` is ours and lasts 7 days,
 * while `lms_token` is Strapi's JWT and can expire or be revoked first. When that
 * happens the visitor still looks signed in to us, but Strapi answers 401. On a
 * public page that is not an error — it just means we cannot personalise the
 * call to action, so we fall back to the signed-out view rather than crashing.
 */
export async function getMyEnrollmentsOptional(): Promise<Enrollment[] | null> {
  try {
    return await getMyEnrollments();
  } catch {
    return null;
  }
}

export async function enrollInCourse(courseDocumentId: string): Promise<void> {
  await strapiFetch('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ data: { course: courseDocumentId } }),
  });
}

export async function submitEnrollmentApplication(data: Record<string, unknown>): Promise<void> {
  await strapiFetch('/enrollment-applications', { method: 'POST', body: JSON.stringify({ data }) });
}

export async function getEnrollmentApplications(): Promise<import('@/types/lms').EnrollmentApplication[]> {
  const res = await strapiFetch<{ data: import('@/types/lms').EnrollmentApplication[] }>('/enrollment-applications');
  return res.data ?? [];
}

export async function getMyEnrollmentApplications(): Promise<import('@/types/lms').EnrollmentApplication[]> {
  const res = await strapiFetch<{ data: import('@/types/lms').EnrollmentApplication[] }>('/enrollment-applications/mine');
  return res.data ?? [];
}

export async function reviewEnrollmentApplication(id: string, decision: 'approved' | 'rejected') {
  await strapiFetch(`/enrollment-applications/${id}/review`, { method: 'PUT', body: JSON.stringify({ data: { decision } }) });
}
export async function getEnrollmentGuide(): Promise<{ videoUrl: string } | null> { const res = await strapiFetch<{ data: { videoUrl: string } | null }>('/enrollment-guide', { auth: false, revalidate: 60 }); return res.data; }
export async function saveEnrollmentGuide(videoUrl: string) { await strapiFetch('/enrollment-guide', { method: 'PUT', body: JSON.stringify({ data: { videoUrl } }) }); }
export async function getComboOffer(): Promise<ComboOffer | null> { const res = await strapiFetch<{ data: ComboOffer | null }>('/combo-offer', { auth: false, revalidate: 0 }); return res.data; }
export async function saveComboOffer(data: ComboOffer): Promise<void> { await strapiFetch('/combo-offer', { method: 'PUT', body: JSON.stringify({ data }) }); }
