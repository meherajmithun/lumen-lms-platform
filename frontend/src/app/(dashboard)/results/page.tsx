import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getMyAttempts } from '@/lib/api/quizzes';
import { requireRole } from '@/lib/auth';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'My results' };

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default async function ResultsPage() {
  await requireRole('student');
  const attempts = await getMyAttempts();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Quizzes"
        title="My results"
        description="Every attempt you've submitted, newest first."
      />

      {attempts.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No quiz attempts yet"
          description="Finish a course's lessons and take its quiz — your score is saved here."
          action={
            <Link href="/my-courses" className={buttonVariants()}>
              Go to my courses
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-raised)]">
          {attempts.map((attempt) => (
            <li key={attempt.documentId} className="flex items-center gap-4 px-4 py-3.5">
              <span
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular',
                  attempt.passed ? 'bg-pine-wash text-pine' : 'bg-clay-wash text-clay'
                )}
              >
                {attempt.score}%
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{attempt.quiz?.title ?? 'Quiz'}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {attempt.quiz?.course?.title}
                  {attempt.quiz?.course?.title && ' · '}
                  {formatDate(attempt.submittedAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium tabular">
                  {attempt.correctCount}/{attempt.totalQuestions}
                </p>
                <p className={cn('text-xs', attempt.passed ? 'text-pine' : 'text-muted-foreground')}>
                  {attempt.passed ? 'Passed' : 'Not passed'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
