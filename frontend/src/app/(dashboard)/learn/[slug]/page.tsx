import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CircleCheck, FileQuestion, PlayCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { LessonSpine } from '@/components/lms/lesson-spine';
import { PageHeader } from '@/components/lms/page-header';
import { getCourseBySlugAuthed, getCourseProgress } from '@/lib/api/courses';
import { getMyEnrollments } from '@/lib/api/enrollments';
import { requireRole } from '@/lib/auth';

export default async function CourseOutlinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireRole('student');
  const { slug } = await params;

  const course = await getCourseBySlugAuthed(slug);
  if (!course) notFound();

  // Enrollment is verified here for a sensible redirect; Strapi refuses the
  // lesson data anyway if this check were somehow skipped.
  const enrollments = await getMyEnrollments();
  if (!enrollments.some((e) => e.course?.documentId === course.documentId)) {
    redirect(`/courses/${slug}`);
  }

  const progress = await getCourseProgress(course.documentId);
  const lessons = (course.lessons ?? []).slice().sort((a, b) => a.order - b.order);
  const done = new Set(progress.completedLessonIds);
  const nextLesson = lessons.find((l) => !done.has(l.documentId)) ?? lessons[0];
  const quiz = course.quizzes?.[0];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Course" title={course.title} description={course.description ?? undefined} />

      <div className="mb-8 rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-raised)] sm:p-6">
        <LessonSpine
          total={lessons.length}
          completed={progress.completed}
          states={lessons.map((l) => done.has(l.documentId))}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular">
            <span className="font-medium text-foreground">
              {progress.completed} of {progress.total}
            </span>{' '}
            lessons · {progress.percent}%
          </p>
          {nextLesson && (
            <Link
              href={`/learn/${slug}/lessons/${nextLesson.documentId}`}
              className={buttonVariants({ size: 'sm' })}
            >
              <PlayCircle className="size-4" aria-hidden />
              {progress.completed === 0 ? 'Start course' : 'Continue'}
            </Link>
          )}
        </div>
      </div>

      <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-raised)]">
        {lessons.map((lesson, index) => {
          const complete = done.has(lesson.documentId);
          return (
            <li key={lesson.documentId}>
              <Link
                href={`/learn/${slug}/lessons/${lesson.documentId}`}
                className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/60 sm:px-5"
              >
                {complete ? (
                  <CircleCheck className="size-5 shrink-0 text-pine" aria-label="Complete" />
                ) : (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-medium tabular">
                    {index + 1}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{lesson.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {lesson.contentType === 'video' ? 'Video' : 'Reading'}
                    {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {lessons.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            This course doesn&apos;t have any lessons yet.
          </li>
        )}
      </ol>

      {quiz && (
        <Link
          href={`/learn/${slug}/quiz/${quiz.documentId}`}
          className="mt-6 flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-5 py-5 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-pine/40 hover:shadow-[var(--shadow-float)]"
        >
          <FileQuestion className="size-5 shrink-0 text-clay" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{quiz.title}</span>
            <span className="text-xs text-muted-foreground">
              Graded as soon as you submit
            </span>
          </span>
          <span className="text-sm font-medium text-pine">Take it →</span>
        </Link>
      )}
    </div>
  );
}
