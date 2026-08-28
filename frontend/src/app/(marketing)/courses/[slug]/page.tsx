import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BadgeCheck,
  BookOpen,
  CircleCheck,
  Clock3,
  FileQuestion,
  FileText,
  Gauge,
  InfinityIcon,
  Library,
  Lock,
  UsersRound,
  Video,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EnrollButton } from '@/components/lms/enroll-button';
import { ComboOfferDialog } from '@/components/lms/combo-offer-dialog';
import { getCourseSyllabus, getPublishedCourses } from '@/lib/api/courses';
import { getComboOffer, getMyEnrollmentsOptional } from '@/lib/api/enrollments';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { discountedPrice, formatCourseDuration, formatCoursePrice } from '@/lib/course-pricing';
import type { Level } from '@/types/lms';

const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export async function generateStaticParams() {
  // See the blog route: a build must not depend on the backend being up.
  try {
    const courses = await getPublishedCourses();
    return courses.map((course) => ({ slug: course.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseSyllabus(slug);
  if (!course) return { title: 'Course not found' };
  return {
    title: course.title,
    description: course.description ?? undefined,
    openGraph: {
      title: course.title,
      description: course.description ?? undefined,
      images: course.coverImageUrl ? [course.coverImageUrl] : undefined,
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseSyllabus(slug);
  if (!course) notFound();
  const comboOffer = await getComboOffer().catch(() => null);

  const user = await getCurrentUser();

  // Enhancement only: decides whether the button says "Enroll" or "Continue".
  // A failure here must not take the page down for everyone else.
  let enrolled = false;
  let sessionExpired = false;
  if (user && can.enroll(user.role)) {
    const enrollments = await getMyEnrollmentsOptional();
    if (enrollments === null) sessionExpired = true;
    else enrolled = enrollments.some((e) => e.course?.documentId === course.documentId);
  }

  const lessons = course.syllabus ?? [];
  const videoLessons = lessons.filter((lesson) => lesson.contentType === 'video');
  const readingLessons = lessons.filter((lesson) => lesson.contentType === 'text');
  const videoMinutes = videoLessons.reduce((total, lesson) => total + (lesson.durationMinutes ?? 0), 0);
  const originalPrice = Number(course.price ?? 0);
  const discount = Number(course.discountPercent ?? 0);
  const finalPrice = discountedPrice(originalPrice, discount);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-pine">
            {LEVEL_LABEL[course.level]}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {course.title}
          </h1>
          {course.instructor?.username && (
            <p className="mt-2 text-sm text-muted-foreground">
              Taught by {course.instructor.username}
            </p>
          )}
          {course.description && (
            <p className="prose-lesson mt-6 text-foreground">{course.description}</p>
          )}

          <section className="mt-10" aria-labelledby="course-stats-title">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-pine">Course stats</p>
            <h2 id="course-stats-title" className="mt-1 font-heading text-2xl font-semibold tracking-tight">
              Course Insights
            </h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Students enrolled', value: String(course.enrollmentCount ?? 0), icon: UsersRound },
                { label: 'Course duration', value: formatCourseDuration(course.totalDurationMinutes ?? 0), icon: Clock3 },
                { label: 'Course access', value: 'Lifetime', icon: InfinityIcon },
                { label: 'Lessons', value: String(lessons.length), icon: Library },
                { label: 'Course status', value: lessons.length > 0 ? 'Ready' : 'Coming soon', icon: BadgeCheck },
                { label: 'Video lessons', value: `${videoLessons.length} · ${formatCourseDuration(videoMinutes)}`, icon: Video },
                { label: 'Reading lessons', value: String(readingLessons.length), icon: FileText },
                { label: 'Quizzes', value: String(course.quizCount), icon: FileQuestion },
                { label: 'Level', value: LEVEL_LABEL[course.level], icon: Gauge },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-pine-wash text-pine">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {label}
                  </dt>
                  <dd className="mt-3 font-heading text-lg font-semibold tracking-tight tabular">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <h2 className="mt-10 font-heading text-lg font-semibold tracking-tight">
            What you&apos;ll work through
          </h2>
          <ol className="mt-4 divide-y divide-border rounded-xl border border-border">
            {lessons.map((lesson, index) => (
              <li key={lesson.documentId} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{lesson.title}</span>
                {enrolled ? (
                  <CircleCheck className="size-4 shrink-0 text-pine/50" aria-hidden />
                ) : (
                  <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Enroll to open" />
                )}
              </li>
            ))}
            {lessons.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                Lessons are still being written.
              </li>
            )}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-20">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[16/9] bg-muted">
              {course.coverImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={course.coverImageUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <BookOpen className="size-7 text-muted-foreground" aria-hidden />
                </div>
              )}
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-baseline gap-2 border-b border-border pb-4 tabular">
                <span className="font-heading text-2xl font-semibold">{formatCoursePrice(finalPrice)}</span>
                {discount > 0 && originalPrice > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">{formatCoursePrice(originalPrice)}</span>
                    <span className="rounded bg-pine-wash px-2 py-0.5 text-xs font-bold text-pine">{discount}% OFF</span>
                  </>
                )}
              </div>
              {comboOffer && <ComboOfferDialog offer={comboOffer} />}
              {!user && (
                <Link
                  href={`/login?next=/courses/${course.slug}`}
                  className={buttonVariants({ size: 'lg', className: 'w-full' })}
                >
                  Sign in to enroll
                </Link>
              )}

              {sessionExpired && (
                <Link
                  href={`/login?next=/courses/${course.slug}`}
                  className={buttonVariants({ size: 'lg', className: 'w-full' })}
                >
                  Sign in again to enroll
                </Link>
              )}

              {user && !sessionExpired && can.enroll(user.role) && (
                enrolled ? (
                  <Link
                    href={`/learn/${course.slug}`}
                    className={buttonVariants({ size: 'lg', className: 'w-full' })}
                  >
                    Continue learning
                  </Link>
                ) : (
                  <EnrollButton courseId={course.documentId} slug={course.slug} />
                )
              )}

              {user && !can.enroll(user.role) && (
                <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  <FileQuestion className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Enrolling is for student accounts. You can still read the outline.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
