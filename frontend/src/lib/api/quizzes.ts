import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type { Paginated, Quiz, QuizAttempt, QuizResult } from '@/types/lms';

/** Student view — the response contains no answer key. */
export async function getQuizToTake(documentId: string): Promise<Quiz | null> {
  const res = await strapiFetch<{ data: Quiz }>(`/quizzes/${documentId}/take`);
  return res.data ?? null;
}

/** Owner view — the only endpoint that returns correctOptionId. */
export async function getQuizToManage(documentId: string): Promise<Quiz | null> {
  const res = await strapiFetch<{ data: Quiz }>(`/quizzes/${documentId}/manage`);
  return res.data ?? null;
}

export async function getCourseQuizzes(courseDocumentId: string): Promise<Quiz[]> {
  const res = await strapiFetch<Paginated<Quiz>>(
    `/quizzes?filters[course][documentId][$eq]=${courseDocumentId}&populate[questions][fields][0]=documentId`
  );
  return res.data ?? [];
}

export async function submitQuiz(
  documentId: string,
  answers: Array<{ questionId: string; selectedOptionId: string | null }>
): Promise<QuizResult> {
  const res = await strapiFetch<{ data: QuizResult }>(`/quizzes/${documentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
  return res.data;
}

export async function getMyAttempts(): Promise<QuizAttempt[]> {
  const res = await strapiFetch<{ data: QuizAttempt[] }>('/quiz-attempts/mine');
  return res.data ?? [];
}

export async function createQuiz(data: Record<string, unknown>): Promise<Quiz> {
  const res = await strapiFetch<{ data: Quiz }>('/quizzes', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return res.data;
}

export async function createQuestion(data: Record<string, unknown>): Promise<void> {
  await strapiFetch('/questions', { method: 'POST', body: JSON.stringify({ data }) });
}

export async function updateQuestion(documentId: string, data: Record<string, unknown>): Promise<void> {
  await strapiFetch(`/questions/${documentId}`, { method: 'PUT', body: JSON.stringify({ data }) });
}

export async function deleteQuestion(documentId: string): Promise<void> {
  await strapiFetch(`/questions/${documentId}`, { method: 'DELETE' });
}
