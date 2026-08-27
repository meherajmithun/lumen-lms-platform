import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getManagedCourses } from '@/lib/api/courses';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/types/lms';

export const metadata: Metadata = { title: 'Courses' };

export default async function TeachPage() {
  const user = await requireRole('admin', 'content_manager', 'instructor');

  // An instructor is scoped to their own courses; Admin and Content Manager see
  // the whole library. Strapi applies the same narrowing server-side.
  const mine = user.role === ROLES.INSTRUCTOR;
  const courses = await getManagedCourses(mine);

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
  );
}
