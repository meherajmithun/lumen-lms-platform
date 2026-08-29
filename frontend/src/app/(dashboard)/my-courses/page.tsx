import type { Metadata } from 'next';
import Link from 'next/link';
import { BookMarked, CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { CourseCard, CourseGrid } from '@/components/lms/course-card';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getMyEnrollments } from '@/lib/api/enrollments';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'My courses' };

type CourseView = 'enrolled' | 'lessons' | 'completed';

const views: Array<{ value: CourseView; label: string }> = [
  { value: 'enrolled', label: 'Enrolled courses' },
  { value: 'lessons', label: 'Completed lessons' },
  { value: 'completed', label: 'Completed courses' },
];

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireRole('student');
  const { view: requestedView } = await searchParams;
  const view: CourseView = views.some(({ value }) => value === requestedView)
    ? (requestedView as CourseView)
    : 'enrolled';
  const enrollmentRows = await getMyEnrollments();
  const enrollments = enrollmentRows.filter(
    (enrollment): enrollment is typeof enrollment & { course: NonNullable<typeof enrollment.course> } =>
      enrollment.course !== null
  );

  const finished = enrollments.filter((e) => e.progress.percent === 100);
  const completedLessonCount = enrollments.reduce((total, enrollment) => total + enrollment.completedLessons.length, 0);

  const pageCopy = {
    enrolled: {
      title: 'Enrolled courses',
      description: "Every course you're enrolled in, with exactly where you stopped.",
    },
    lessons: {
      title: 'Completed lessons',
      description: 'A record of the lessons you have finished, grouped by course.',
    },
    completed: {
      title: 'Completed courses',
      description: 'Courses where you have finished every lesson.',
    },
  }[view];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Learning"
        title={pageCopy.title}
        description={pageCopy.description}
      />

      <nav aria-label="Learning views" className="mb-8 flex flex-wrap gap-2">
        {views.map((item) => (
          <Link
            key={item.value}
            href={`/my-courses?view=${item.value}`}
            aria-current={view === item.value ? 'page' : undefined}
            className={buttonVariants({ variant: view === item.value ? 'default' : 'outline', size: 'sm' })}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="You haven't enrolled in anything yet"
          description="Browse the catalogue and pick a course to start."
          action={
            <Link href="/courses" className={buttonVariants()}>
              Browse courses
            </Link>
          }
        />
      ) : view === 'lessons' ? (
        completedLessonCount > 0 ? (
          <div className="space-y-5">
            {enrollments.filter((enrollment) => enrollment.completedLessons.length > 0).map((enrollment) => (
              <section key={enrollment.documentId} className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-raised)]">
                <div className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-4">
                  <h2 className="font-heading font-semibold tracking-tight">{enrollment.course.title}</h2>
                  <span className="shrink-0 text-xs tabular text-muted-foreground">
                    {enrollment.completedLessons.length} completed
                  </span>
                </div>
                <ul className="divide-y divide-border/70">
                  {enrollment.completedLessons.map((lesson) => (
                    <li key={lesson.documentId}>
                      <Link
                        href={`/learn/${enrollment.course.slug}/lessons/${lesson.documentId}`}
                        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <CheckCircle2 className="size-4 shrink-0 text-pine" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {lesson.contentType === 'video' ? 'Video' : 'Reading'}
                          {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="No completed lessons yet"
            description="Lessons you finish will appear here."
          />
        )
      ) : view === 'completed' ? (
        finished.length > 0 ? (
          <CourseGrid>
            {finished.map((enrollment) => (
              <CourseCard key={enrollment.documentId} course={enrollment.course} href={`/learn/${enrollment.course.slug}`} progress={enrollment.progress} />
            ))}
          </CourseGrid>
        ) : (
          <EmptyState icon={BookMarked} title="No completed courses yet" description="Courses appear here after you finish every lesson." />
        )
      ) : (
        <CourseGrid>
          {enrollments.map((enrollment) => (
            <CourseCard key={enrollment.documentId} course={enrollment.course} href={`/learn/${enrollment.course.slug}`} progress={enrollment.progress} />
          ))}
        </CourseGrid>
      )}
    </div>
  );
}
