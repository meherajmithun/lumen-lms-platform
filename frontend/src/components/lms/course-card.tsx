import Link from 'next/link';
import { BookOpen, CircleCheck, UsersRound } from 'lucide-react';
import { LessonSpine } from './lesson-spine';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { discountedPrice, formatCourseDuration, formatCoursePrice } from '@/lib/course-pricing';
import type { Course, CourseProgress, Level } from '@/types/lms';

const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function CourseCard({
  course,
  href,
  progress,
  footer,
  enrolled = false,
}: {
  course: Course;
  href: string;
  progress?: CourseProgress;
  footer?: React.ReactNode;
  enrolled?: boolean;
}) {
  const lessonCount = progress?.total ?? course.lessonCount ?? course.lessons?.length ?? 0;
  const originalPrice = Number(course.price ?? 0);
  const discount = Number(course.discountPercent ?? 0);
  const finalPrice = discountedPrice(originalPrice, discount);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-pine/40">
      <Link href={href} className="block focus-visible:outline-none">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {course.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={course.coverImageUrl}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <BookOpen className="size-7 text-muted-foreground" aria-hidden />
            </div>
          )}
          {!course.isPublished && (
            <span className="absolute left-3 top-3 rounded-full bg-clay-wash px-2 py-0.5 text-xs font-medium text-clay">
              Draft
            </span>
          )}
          {enrolled && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-pine px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <CircleCheck className="size-3.5" aria-hidden /> Enrolled
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {LEVEL_LABEL[course.level]}
            </p>
            <div className="flex shrink-0 items-center gap-1.5 tabular">
              <p className="text-sm font-semibold text-pine">{formatCoursePrice(finalPrice)}</p>
              {discount > 0 && originalPrice > 0 && (
                <p className="text-[11px] text-muted-foreground line-through">
                  {formatCoursePrice(originalPrice)}
                </p>
              )}
              {discount > 0 && originalPrice > 0 && (
                <span className="rounded bg-pine-wash px-1.5 py-0.5 text-[10px] font-bold uppercase text-pine">
                  {discount}% off
                </span>
              )}
            </div>
          </div>
          <h3 className="mt-1 font-heading text-base font-semibold leading-snug tracking-tight">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:underline">
              {course.title}
            </Link>
          </h3>
          {course.instructor?.username && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar size="sm" aria-hidden>
                {course.instructor.avatarUrl && (
                  <AvatarImage src={course.instructor.avatarUrl} alt="" />
                )}
                <AvatarFallback className="bg-pine-wash font-semibold text-pine">
                  {course.instructor.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="truncate text-xs font-medium text-muted-foreground">
                {course.instructor.username}
              </p>
            </div>
          )}
          {course.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          )}
        </div>

        {progress ? (
          <div className="space-y-1.5">
            <LessonSpine total={progress.total} completed={progress.completed} />
            <p className="text-xs text-muted-foreground tabular">
              <span className="font-medium text-foreground">
                {progress.completed} of {progress.total}
              </span>{' '}
              lessons · {progress.percent}%
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular">
            <p>
              {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
              {course.totalDurationMinutes !== undefined && (
                <> · {formatCourseDuration(course.totalDurationMinutes)}</>
              )}
            </p>
            <p className="flex items-center gap-1">
              <UsersRound className="size-3.5" aria-hidden />
              {course.enrollmentCount ?? 0} {(course.enrollmentCount ?? 0) === 1 ? 'student' : 'students'} enrolled
            </p>
          </div>
        )}

        {footer}
      </div>
    </article>
  );
}

export function CourseGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>{children}</div>
  );
}
