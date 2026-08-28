import Link from 'next/link';
import { BadgePercent, BookOpen, Clock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EnrollButton } from '@/components/lms/enroll-button';
import { PageHeader } from '@/components/lms/page-header';
import { getPublishedCourses } from '@/lib/api/courses';
import { getMyEnrollmentsOptional } from '@/lib/api/enrollments';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { discountedPrice, formatCourseDuration, formatCoursePrice } from '@/lib/course-pricing';

export const metadata = {
  title: 'Pricing | Lumen',
  description: 'Compare Lumen courses, prices, discounts, and durations.',
};

export default async function PricingPage() {
  const [courses, user] = await Promise.all([
    getPublishedCourses().catch(() => []),
    getCurrentUser(),
  ]);
  const enrollments = user && can.enroll(user.role) ? await getMyEnrollmentsOptional() : [];
  const enrolledIds = new Set(
    (enrollments ?? []).flatMap((row) => row.course ? [row.course.documentId] : [])
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:py-20">
      <PageHeader
        eyebrow="Course pricing"
        title="Choose what you want to learn next."
        description="Compare course prices, current discounts, and total learning time."
        variant="marketing"
        align="center"
      />

      {courses.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.filter((course) => course.isPublished).map((course) => {
            const originalPrice = Number(course.price ?? 0);
            const discount = Number(course.discountPercent ?? 0);
            const finalPrice = discountedPrice(originalPrice, discount);
            const enrolled = enrolledIds.has(course.documentId);

            return (
              <article key={course.documentId} className="flex min-h-80 flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-pine/35 hover:shadow-[var(--shadow-float)]">
                <div className="flex min-h-12 items-start justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em]">{course.title}</h2>
                  {discount > 0 && originalPrice > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-md bg-pine-wash px-2 py-1 text-xs font-bold text-pine">
                      <BadgePercent className="size-3.5" aria-hidden />
                      {discount}% OFF
                    </span>
                  )}
                </div>

                <div className="mt-7 flex items-baseline gap-2 tabular">
                  <p className="font-display text-4xl font-bold tracking-[-0.045em]">{formatCoursePrice(finalPrice)}</p>
                  {discount > 0 && originalPrice > 0 && (
                    <p className="text-sm text-muted-foreground line-through">{formatCoursePrice(originalPrice)}</p>
                  )}
                </div>

                <div className="mt-7 border-t border-border pt-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-4" aria-hidden /> Duration
                    </span>
                    <span className="font-medium tabular">
                      {formatCourseDuration(course.totalDurationMinutes ?? 0)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="size-4" aria-hidden /> Lessons
                    </span>
                    <span className="font-medium tabular">{course.lessonCount ?? 0}</span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 pt-7">
                  <Link href={`/courses/${course.slug}`} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                    View course
                  </Link>
                  {!user ? (
                    <Link href="/login?next=/pricing" className={buttonVariants({ size: 'lg' })}>
                      Enroll now
                    </Link>
                  ) : can.enroll(user.role) ? (
                    enrolled ? (
                      <Link href={`/learn/${course.slug}`} className={buttonVariants({ size: 'lg' })}>
                        Continue
                      </Link>
                    ) : (
                      <EnrollButton courseId={course.documentId} slug={course.slug} label="Enroll now" />
                    )
                  ) : (
                    <Link href={`/courses/${course.slug}`} className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                      View details
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-12 text-center text-sm text-muted-foreground">No courses are available yet.</p>
      )}
    </section>
  );
}
