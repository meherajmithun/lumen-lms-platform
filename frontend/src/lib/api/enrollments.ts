import 'server-only';
import { resolveStrapiMediaUrl, strapiFetch } from '@/lib/strapi';
import type { ComboOffer, Enrollment, EnrollmentGuide } from '@/types/lms';

export const DEFAULT_ENROLLMENT_GUIDE: EnrollmentGuide = {
  guidelinesTitle: 'Enrollment guidelines',
  guidelinesSummary: 'Select courses, pay the exact calculated total, and submit one application.',
  guidelinesDescription: 'Follow these steps carefully.',
  guidelines: [
    'Make sure you are logged in to the email account where you would like to receive access to the course materials.',
    'Fill out the enrollment form using your correct information.',
    'Select the course you wish to enroll in.',
    'Choose your preferred payment method. Currently, we accept bKash, Nagad, and Rocket.',
    'Complete the payment using the instructions and payment number provided in the enrollment form.',
    'After making the payment, collect your Transaction ID and enter it correctly in the form.',
    'Review your information carefully and submit the enrollment form.',
    'Once confirmed, you will receive access to the course materials. Confirmation may take up to 48 hours.',
    'If you have questions or need assistance, contact us at any time.',
  ],
  supportPhone: '01XXXXXXXXXX',
  enrollmentTitle: 'How to enroll',
  enrollmentSummary: 'Open the step-by-step enrollment walkthrough.',
  enrollmentDescription: 'Course selection and payment walkthrough.',
  enrollmentSteps: [
    'Select one or more courses.',
    'Pay the calculated total.',
    'Enter the transaction ID and submit.',
    'Wait up to 48 hours for Content Manager approval.',
  ],
  videoUrl: '',
  paymentTitle: 'Payment methods',
  paymentSummary: 'bKash, Rocket, or Nagad: 01XXXXXXXXXX (personal account).',
  paymentDescription: 'Send Money or Cash In using a personal account.',
  paymentMethods: [
    { name: 'bKash', accountNumber: '01XXXXXXXXXX' },
    { name: 'Rocket', accountNumber: '01XXXXXXXXXX' },
    { name: 'Nagad', accountNumber: '01XXXXXXXXXX' },
  ],
};

function normalizeGuide(value: Partial<EnrollmentGuide> | null): EnrollmentGuide {
  return {
    ...DEFAULT_ENROLLMENT_GUIDE,
    ...value,
    guidelines: Array.isArray(value?.guidelines)
      ? value.guidelines.filter((item): item is string => typeof item === 'string')
      : DEFAULT_ENROLLMENT_GUIDE.guidelines,
    enrollmentSteps: Array.isArray(value?.enrollmentSteps)
      ? value.enrollmentSteps.filter((item): item is string => typeof item === 'string')
      : DEFAULT_ENROLLMENT_GUIDE.enrollmentSteps,
    paymentMethods: Array.isArray(value?.paymentMethods)
      ? value.paymentMethods.filter(
          (item) => item && typeof item.name === 'string' && typeof item.accountNumber === 'string'
        )
      : DEFAULT_ENROLLMENT_GUIDE.paymentMethods,
  };
}

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

export async function uploadPaymentProof(file: File): Promise<string> {
  const form = new FormData();
  form.append('files', file, file.name);
  const uploaded = await strapiFetch<Array<{ url?: string }>>('/upload', { method: 'POST', body: form });
  const url = resolveStrapiMediaUrl(uploaded[0]?.url);
  if (!url) throw new Error('The payment image upload did not return a URL.');
  return url;
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
export async function getEnrollmentGuide(): Promise<EnrollmentGuide> {
  const response = await strapiFetch<{ data: Partial<EnrollmentGuide> | null }>('/enrollment-guide', {
    auth: false,
    tags: ['enrollment-guide'],
    revalidate: 0,
  });
  const guide = normalizeGuide(response.data);
  return {
    ...guide,
    videoUrl: resolveStrapiMediaUrl(guide.videoUrl) ?? guide.videoUrl,
  };
}

export async function saveEnrollmentGuide(data: Partial<EnrollmentGuide>): Promise<void> {
  await strapiFetch('/enrollment-guide', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
}
export async function getComboOffer(): Promise<ComboOffer | null> { const res = await strapiFetch<{ data: ComboOffer | null }>('/combo-offer', { auth: false, tags: ['combo-offer'], revalidate: 0 }); return res.data; }
export async function saveComboOffer(data: ComboOffer): Promise<void> { await strapiFetch('/combo-offer', { method: 'PUT', body: JSON.stringify({ data }) }); }
