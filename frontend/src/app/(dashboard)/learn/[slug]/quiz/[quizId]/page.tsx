import { notFound } from 'next/navigation';
import { QuizRunner } from '@/components/lms/quiz-runner';
import { getQuizToTake } from '@/lib/api/quizzes';
import { requireRole } from '@/lib/auth';

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ slug: string; quizId: string }>;
}) {
  await requireRole('student');
  const { slug, quizId } = await params;

  /**
   * This is the student-facing endpoint. Strapi rebuilds the payload without
   * correctOptionId, so the answer key never reaches the browser — open DevTools
   * on this page and the response has no answers in it.
   */
  const quiz = await getQuizToTake(quizId);
  if (!quiz) notFound();

  return <QuizRunner quiz={quiz} slug={slug} />;
}
