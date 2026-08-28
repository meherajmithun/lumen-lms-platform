'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { enrollInCourse, submitEnrollmentApplication, uploadPaymentProof } from '@/lib/api/enrollments';
import { toUserMessage } from '@/lib/strapi';

/**
 * Every action follows the same five steps: guard, validate, call, revalidate,
 * return a safe message. The guard is first and is not optional — a Server Action
 * is its own public endpoint, so protecting the page that renders the form is not
 * enough. Strapi checks the same rule again regardless.
 */
export async function enrollAction(courseId: string, slug: string) {
  await requireRole('student');

  if (!courseId) return { ok: false as const, error: 'Missing course' };

  try {
    await enrollInCourse(courseId);
    revalidatePath('/my-courses');
    revalidatePath('/courses');
    revalidatePath(`/courses/${slug}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}

const PAYMENT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']);
const MAX_PAYMENT_IMAGE_BYTES = 5 * 1024 * 1024;

export async function submitEnrollmentApplicationAction(form: FormData, courseIds: string[]) {
  await requireRole('student');
  const image = form.get('paymentProof');
  if (!(image instanceof File) || image.size === 0) return { ok: false as const, error: 'Upload your payment picture.' };
  if (!PAYMENT_IMAGE_TYPES.has(image.type)) return { ok: false as const, error: 'Choose a JPG, PNG, WebP, GIF, AVIF, HEIC, or HEIF image.' };
  if (image.size > MAX_PAYMENT_IMAGE_BYTES) return { ok: false as const, error: 'Payment pictures must be 5 MB or smaller.' };
  try {
    const paymentProofUrl = await uploadPaymentProof(image);
    await submitEnrollmentApplication({
      courseIds,
      name: form.get('name'), email: form.get('email'), phone: form.get('phone'),
      discord: form.get('discord'), institution: form.get('institution'),
      paymentMethod: form.get('paymentMethod'), paymentProofUrl,
    });
    revalidatePath('/enrollment-requests');
    return { ok: true as const };
  }
  catch (error) { return { ok: false as const, error: toUserMessage(error) }; }
}
