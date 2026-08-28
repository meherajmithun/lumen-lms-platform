import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';
import { CourseCard, CourseGrid } from '@/components/lms/course-card';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPublishedCourses } from '@/lib/api/courses';
import { getMyEnrollmentsOptional } from '@/lib/api/enrollments';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/types/lms';
import { cn } from '@/lib/utils';
import type { Level } from '@/types/lms';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Browse every published course and enroll in the ones you want to take.',
};

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

type CoursesSearchParams = Promise<{ q?: string; level?: string }>;

export default async function CoursesPage({ searchParams }: { searchParams: CoursesSearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 80) ?? '';
  const level = LEVELS.includes(params.level as Level) ? (params.level as Level) : '';
  const currentUser = await getCurrentUser();
  const [publishedCourses, enrollmentRows] = await Promise.all([
    getPublishedCourses().catch(() => []),
    currentUser?.role === ROLES.STUDENT ? getMyEnrollmentsOptional() : Promise.resolve([]),
  ]);
  const allCourses = publishedCourses.filter((c) => c.isPublished);
  const enrolledCourseIds = new Set((enrollmentRows ?? []).flatMap((row) => row.course ? [row.course.documentId] : []));
  const normalizedQuery = query.toLocaleLowerCase();
  const courses = allCourses.filter((course) => {
    const matchesLevel = !level || course.level === level;
    const searchableText = `${course.title} ${course.description ?? ''} ${course.instructor?.username ?? ''}`
      .toLocaleLowerCase();
    return matchesLevel && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
  const isFiltered = Boolean(query || level);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <PageHeader
        eyebrow="Catalogue"
        title="Courses"
        description="Every course is a set of ordered lessons with a quiz at the end."
        variant="marketing"
      />

      <form
        action="/courses"
        className="mb-10 grid gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[var(--shadow-raised)] sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:p-5"
        role="search"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            key={query}
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search title, topic, or instructor"
            aria-label="Search courses"
            className="pl-9"
            maxLength={80}
          />
        </div>
        <select
          name="level"
          defaultValue={level}
          aria-label="Filter by level"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <Button type="submit">Find courses</Button>
      </form>

      {isFiltered && courses.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p aria-live="polite">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
          </p>
          <Link href="/courses" className="font-medium text-pine hover:underline">
            Clear filters
          </Link>
        </div>
      )}

      {courses.length > 0 ? (
        <CourseGrid>
          {courses.map((course) => (
            <CourseCard key={course.documentId} course={course} href={`/courses/${course.slug}`} enrolled={enrolledCourseIds.has(course.documentId)} />
          ))}
        </CourseGrid>
      ) : (
        <EmptyState
          icon={isFiltered ? Search : BookOpen}
          title={isFiltered ? 'No matching courses' : 'No courses published yet'}
          description={
            isFiltered
              ? 'Try a different search term or remove the level filter.'
              : 'Once an instructor publishes a course it will appear here.'
          }
          action={
            isFiltered ? (
              <Link href="/courses" className={cn(buttonVariants({ variant: 'outline' }))}>
                Clear filters
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
