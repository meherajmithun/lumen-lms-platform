'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, CircleCheck, FileQuestion, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { LessonSpine } from './lesson-spine';
import { VideoEmbed } from './video-embed';
import { markLessonComplete, markLessonIncomplete } from '@/app/actions/progress';
import { cn } from '@/lib/utils';
import type { CourseProgress, Lesson } from '@/types/lms';

type Props = {
  slug: string;
  courseTitle: string;
  lesson: Lesson;
  lessons: Array<Pick<Lesson, 'documentId' | 'title'>>;
  completedIds: string[];
  progress: CourseProgress;
  quizId?: string;
};

export function LessonPlayer({
  slug,
  courseTitle,
  lesson,
  lessons,
  completedIds,
  progress,
  quizId,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [outlineOpen, setOutlineOpen] = useState(false);

  /**
   * The tick and the spine move immediately, then reconcile with what the server
   * actually stored. If the request fails the optimistic state is dropped and a
   * toast explains why.
   */
  const [optimistic, setOptimistic] = useOptimistic(
    { done: completedIds, progress },
    (state, next: { done: string[]; progress: CourseProgress }) => next
  );

  const index = lessons.findIndex((l) => l.documentId === lesson.documentId);
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const isComplete = optimistic.done.includes(lesson.documentId);

  function toggle() {
    const total = optimistic.progress.total;
    const completed = isComplete
      ? Math.max(0, optimistic.progress.completed - 1)
      : Math.min(total, optimistic.progress.completed + 1);

    start(async () => {
      setOptimistic({
        done: isComplete
          ? optimistic.done.filter((id) => id !== lesson.documentId)
          : [...optimistic.done, lesson.documentId],
        progress: {
          ...optimistic.progress,
          completed,
          percent: total === 0 ? 0 : Math.round((completed / total) * 100),
        },
      });

      const result = isComplete
        ? await markLessonIncomplete(lesson.documentId, slug)
        : await markLessonComplete(lesson.documentId, slug);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/learn/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {courseTitle}
        </Link>
        <div className="flex min-w-48 flex-1 items-center gap-3 sm:max-w-xs">
          <LessonSpine
            total={optimistic.progress.total}
            completed={optimistic.progress.completed}
            currentIndex={index}
            states={lessons.map((l) => optimistic.done.includes(l.documentId))}
          />
          <span className="shrink-0 text-xs text-muted-foreground tabular">
            {optimistic.progress.percent}%
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Button
            variant="outline"
            size="sm"
            className="mb-3 w-full lg:hidden"
            onClick={() => setOutlineOpen((v) => !v)}
            aria-expanded={outlineOpen}
          >
            {outlineOpen ? 'Hide' : 'Show'} lessons ({index + 1} of {lessons.length})
          </Button>

          <ol className={cn('space-y-0.5', !outlineOpen && 'hidden lg:block')}>
            {lessons.map((item, i) => {
              const done = optimistic.done.includes(item.documentId);
              const current = item.documentId === lesson.documentId;
              return (
                <li key={item.documentId}>
                  <Link
                    href={`/learn/${slug}/lessons/${item.documentId}`}
                    aria-current={current ? 'step' : undefined}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      current
                        ? 'bg-clay-wash font-medium text-clay'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {done ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-pine" aria-label="Complete" />
                    ) : (
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px] tabular">
                        {i + 1}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>

          {quizId && (
            <Link
              href={`/learn/${slug}/quiz/${quizId}`}
              className="mt-3 flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:border-clay/50 hover:text-foreground"
            >
              <FileQuestion className="size-4 shrink-0" aria-hidden />
              Take the quiz
            </Link>
          )}
        </aside>

        <article className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground tabular">
            Lesson {index + 1} of {lessons.length}
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {lesson.title}
          </h1>

          <div className="mt-7">
            {lesson.contentType === 'video' && lesson.videoUrl ? (
              <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
            ) : (
              <div className="prose-lesson">
                {(lesson.body ?? '').split('\n\n').map((block, i) =>
                  block.startsWith('## ') ? (
                    <h2 key={i}>{block.replace(/^##\s+/, '')}</h2>
                  ) : block.startsWith('- ') ? (
                    <ul key={i}>
                      {block.split('\n').map((line, j) => (
                        <li key={j}>{line.replace(/^-\s+/, '')}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{block}</p>
                  )
                )}
              </div>
            )}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button onClick={toggle} disabled={pending} variant={isComplete ? 'outline' : 'default'}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )}
              {isComplete ? 'Completed' : 'Mark as complete'}
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {previous && (
                <Link
                  href={`/learn/${slug}/lessons/${previous.documentId}`}
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </Link>
              )}
              {next ? (
                <Link
                  href={`/learn/${slug}/lessons/${next.documentId}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Next lesson
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : quizId ? (
                <Link href={`/learn/${slug}/quiz/${quizId}`} className={buttonVariants({ size: 'sm' })}>
                  Take the quiz
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>

          <p aria-live="polite" className="sr-only">
            {optimistic.progress.completed} of {optimistic.progress.total} lessons complete,{' '}
            {optimistic.progress.percent} percent.
          </p>
        </article>
      </div>
    </div>
  );
}
