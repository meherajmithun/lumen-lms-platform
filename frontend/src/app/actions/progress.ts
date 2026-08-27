'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { completeLesson, uncompleteLesson } from '@/lib/api/lessons';
import { toUserMessage } from '@/lib/strapi';
import type { CourseProgress } from '@/types/lms';

type Result =
  | { ok: true; progress: CourseProgress }
  | { ok: false; error: string };

/**
 * Marking a lesson complete.
 *
 * Idempotent on the server, so the optimistic tick in the UI can never disagree
 * with the stored state: pressing it twice returns the same percentage rather
 * than double-counting.
 */
export async function markLessonComplete(lessonId: string, slug: string): Promise<Result> {
  await requireRole('student');
  if (!lessonId) return { ok: false, error: 'Missing lesson' };

  try {
    const { progress } = await completeLesson(lessonId);
    revalidatePath(`/learn/${slug}`, 'layout');
    revalidatePath('/my-courses');
    return { ok: true, progress };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}

export async function markLessonIncomplete(lessonId: string, slug: string): Promise<Result> {
  await requireRole('student');
  if (!lessonId) return { ok: false, error: 'Missing lesson' };

  try {
    const { progress } = await uncompleteLesson(lessonId);
    revalidatePath(`/learn/${slug}`, 'layout');
    revalidatePath('/my-courses');
    return { ok: true, progress };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}
