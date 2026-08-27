'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { enrollInCourse } from '@/lib/api/enrollments';
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
    revalidatePath(`/courses/${slug}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }
}
