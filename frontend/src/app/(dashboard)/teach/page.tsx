import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, ClipboardList, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getManagedCourses } from '@/lib/api/courses';
import { getEnrollmentApplications } from '@/lib/api/enrollments';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/types/lms';

export const metadata: Metadata = { title: 'Courses' };

export default async function TeachPage() {
  const user = await requireRole('admin', 'content_manager', 'instructor');

  // An instructor is scoped to their own courses; Admin and Content Manager see
  // the whole library. Strapi applies the same narrowing server-side.
  const mine = user.role === ROLES.INSTRUCTOR;
  const [courses, enrollmentApplications] = await Promise.all([
    getManagedCourses(mine),
    user.role === ROLES.CONTENT_MANAGER ? getEnrollmentApplications() : Promise.resolve([]),
  ]);
  const pendingEnrollmentRequests = enrollmentApplications.filter((application) => application.status === 'pending').length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Teaching"
        title={mine ? 'My courses' : 'All courses'}
        description={
          mine
            ? 'Courses you own. You can edit their lessons and quizzes.'
            : 'Every course on the platform.'
        }
        action={
          <Link href="/teach/courses/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            New course
          </Link>
        }
      />

      {user.role === ROLES.CONTENT_MANAGER && (
        <Link
          href="/enrollment-requests"
          className="group mb-6 flex items-center gap-4 rounded-2xl border border-t-2 border-t-[var(--chart-3)] bg-card p-5 shadow-[var(--shadow-raised)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--chart-3)_14%,transparent)] text-[var(--chart-3)]">
            <ClipboardList className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Enrollment requests</span>
            <span className="mt-1 block font-heading text-2xl font-semibold tabular">{pendingEnrollmentRequests}</span>
            <span className="block text-xs text-muted-foreground">Awaiting payment review</span>
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}

      <div id="course-list" className="scroll-mt-24">
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create your first course, then add lessons and a quiz to it."
            action={
              <Link href="/teach/courses/new" className={buttonVariants()}>
                Create a course
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {courses.map((course) => (
              <li key={course.documentId}>
                <Link
                  href={`/teach/courses/${course.documentId}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{course.title}</span>
                      <span
                        className={
                          course.isPublished
                            ? 'shrink-0 rounded-full bg-pine-wash px-2 py-0.5 text-[11px] font-medium text-pine'
                            : 'shrink-0 rounded-full bg-clay-wash px-2 py-0.5 text-[11px] font-medium text-clay'
                        }
                      >
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground tabular">
                      {course.lessons?.length ?? 0} lessons ·{' '}
                      {course.enrollments?.length ?? 0} enrolled
                      {!mine && course.instructor?.username && <> · {course.instructor.username}</>}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">Edit →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
