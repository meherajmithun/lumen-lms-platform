'use server';

import { requireRole } from '@/lib/auth';
import { submitQuiz } from '@/lib/api/quizzes';
import { toUserMessage } from '@/lib/strapi';
import type { QuizResult } from '@/types/lms';

export async function submitQuizAction(
  quizId: string,
  answers: Array<{ questionId: string; selectedOptionId: string | null }>
): Promise<{ ok: true; result: QuizResult } | { ok: false; error: string }> {
  await requireRole('student');

  if (!quizId || !Array.isArray(answers)) {
    return { ok: false, error: 'That submission looked malformed. Please try again.' };
  }

  try {
    // Grading happens entirely on the server — this only forwards the choices.
    const result = await submitQuiz(quizId, answers);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}
