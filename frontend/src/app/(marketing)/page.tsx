import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { CourseCard, CourseGrid } from '@/components/lms/course-card';
import { getPublishedCourses } from '@/lib/api/courses';
import { getPublishedPosts } from '@/lib/api/posts';

export default async function HomePage() {
  const [courses, posts] = await Promise.all([
    getPublishedCourses().catch(() => []),
    getPublishedPosts().catch(() => []),
  ]);
  const featured = courses.filter((c) => c.isPublished).slice(0, 6);

  return (
    <>
      <section className="home-hero relative overflow-hidden bg-hero text-hero-foreground">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-48 -top-48 size-[38rem] rounded-full border border-hero-foreground/10" />
          <div className="absolute -right-24 -top-24 size-[26rem] rounded-full border border-hero-foreground/[0.07]" />
          <div className="absolute -bottom-64 -left-40 size-[34rem] rounded-full border border-hero-foreground/[0.07]" />
          <div className="absolute inset-y-0 left-[7%] w-px bg-hero-foreground/[0.07]" />
          <div className="absolute inset-y-0 right-[7%] w-px bg-hero-foreground/[0.07]" />
          <div className="absolute left-0 right-0 top-[58%] h-px bg-hero-foreground/[0.06]" />
          <div className="absolute right-[10%] top-[22%] hidden size-2 rounded-full bg-clay shadow-[0_0_0_8px_rgb(255_255_255_/_0.04)] lg:block" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-16 sm:pb-32 sm:pt-20 lg:pb-40 lg:pt-24">
          <div className="max-w-5xl">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-hero-muted">
              <span className="h-px w-8 bg-hero-muted" aria-hidden />
              Structured learning. Visible progress.
            </p>
            <h1 className="mt-6 max-w-5xl font-display text-[clamp(3.15rem,7.5vw,6.6rem)] font-bold leading-[0.98] tracking-[-0.065em] text-balance">
              Build skills with a{' '}
              <span className="text-hero-muted">clear path forward.</span>
            </h1>
            <div className="mt-9 grid gap-8 border-t border-hero-foreground/15 pt-8 lg:grid-cols-[minmax(0,39rem)_auto] lg:items-end lg:justify-between">
              <p className="max-w-2xl text-base leading-7 text-hero-muted sm:text-lg sm:leading-8">
                Learn through structured courses, complete lessons in order, test your knowledge
                with quizzes, and see your progress update as you move forward.
              </p>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/courses"
                  className={buttonVariants({
                    size: 'xl',
                    className:
                      'bg-hero-foreground text-hero shadow-[0_12px_30px_-16px_rgb(0_0_0_/_0.75)] hover:bg-white hover:text-hero',
                  })}
                >
                  Browse courses
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
            <div className="mt-14 flex items-center gap-2 sm:mt-16" aria-hidden>
              <span className="size-2 rounded-full bg-hero-foreground" />
              <span className="h-px flex-1 bg-hero-foreground/25" />
              <span className="size-2 rounded-full border border-hero-foreground/50" />
              <span className="h-px flex-1 bg-hero-foreground/25" />
              <span className="size-2 rounded-full border border-hero-foreground/50" />
              <span className="h-px flex-1 bg-hero-foreground/25" />
              <span className="size-2 rounded-full border border-hero-foreground/50" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-background px-5 pb-16 pt-16 shadow-[0_-24px_70px_-48px_rgb(0_0_0_/_0.8)] sm:pb-20 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-pine">
                Curated learning paths
              </p>
              <h2 className="font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                Courses to start with
              </h2>
            </div>
            <Link href="/courses" className="shrink-0 text-sm font-semibold text-pine underline-offset-4 hover:underline">
              See all
            </Link>
          </div>
          {featured.length > 0 ? (
            <CourseGrid>
              {featured.map((course) => (
                <CourseCard key={course.documentId} course={course} href={`/courses/${course.slug}`} />
              ))}
            </CourseGrid>
          ) : (
            <p className="text-sm text-muted-foreground">No courses have been published yet.</p>
          )}
        </div>
      </section>

      {posts.length > 0 && (
        <section className="border-t border-border/80 bg-secondary/55">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-bold tracking-[-0.035em] sm:text-4xl">From the blog</h2>
              <Link href="/blog" className="text-sm font-medium text-pine underline-offset-4 hover:underline">
                Read more
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <Link
                  key={post.documentId}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-pine/35 hover:shadow-[var(--shadow-float)]"
                >
                  <h3 className="font-display text-xl font-semibold leading-tight tracking-tight">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                  )}
                  <p className="mt-4 text-xs font-medium text-pine">Read →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
