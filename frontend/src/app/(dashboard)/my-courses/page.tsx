import type { Metadata } from 'next';
import Link from 'next/link';
import { BookMarked } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { CourseCard, CourseGrid } from '@/components/lms/course-card';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getMyEnrollments } from '@/lib/api/enrollments';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'My courses' };

export default async function MyCoursesPage() {
  await requireRole('student');
  const enrollmentRows = await getMyEnrollments();
  const enrollments = enrollmentRows.filter(
    (enrollment): enrollment is typeof enrollment & { course: NonNullable<typeof enrollment.course> } =>
      enrollment.course !== null
  );

  const inProgress = enrollments.filter((e) => e.progress.percent < 100);
  const finished = enrollments.filter((e) => e.progress.percent === 100);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Learning"
        title="My courses"
        description="Everything you're enrolled in, with exactly where you stopped."
      />

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
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-5 flex items-center gap-3 font-heading text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground before:h-px before:w-7 before:bg-pine">
              In progress
            </h2>
            {inProgress.length > 0 ? (
              <CourseGrid>
                {inProgress.map((enrollment) => (
                  <CourseCard
                    key={enrollment.documentId}
                    course={enrollment.course}
                    href={`/learn/${enrollment.course.slug}`}
                    progress={enrollment.progress}
                  />
                ))}
              </CourseGrid>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing in progress — everything you started is finished.
              </p>
            )}
          </section>

          {finished.length > 0 && (
            <section>
              <h2 className="mb-5 flex items-center gap-3 font-heading text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground before:h-px before:w-7 before:bg-pine">
                Completed
              </h2>
              <CourseGrid>
                {finished.map((enrollment) => (
                  <CourseCard
                    key={enrollment.documentId}
                    course={enrollment.course}
                    href={`/learn/${enrollment.course.slug}`}
                    progress={enrollment.progress}
                  />
                ))}
              </CourseGrid>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
