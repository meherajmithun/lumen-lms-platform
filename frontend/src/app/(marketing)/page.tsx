import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { CourseCard, CourseGrid } from '@/components/lms/course-card';
import { LessonSpine } from '@/components/lms/lesson-spine';
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
      {/* The hero is the product's own idea: a course is a sequence, and you can
          see exactly where you are in it. */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-pine">
              Learn in sequence
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">
              You always know exactly where you stopped.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Courses here are ordered lessons, not a pile of videos. Finish one, mark it done,
              and the spine fills in. Quizzes are graded the moment you submit.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/courses" className={buttonVariants({ size: 'lg' })}>
                Browse courses
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Create an account
              </Link>
            </div>
          </div>

          {/* A worked example of the spine, at rest. */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="font-heading text-sm font-semibold">Foundations of Web Development</p>
            <div className="mt-4 space-y-3">
              <LessonSpine total={4} completed={3} currentIndex={3} />
              <p className="text-xs text-muted-foreground tabular">
                <span className="font-medium text-foreground">3 of 4</span> lessons · 75%
              </p>
            </div>
            <ol className="mt-6 space-y-2.5 text-sm">
              {[
                ['How the web actually works', true],
                ['Structuring a page with HTML', true],
                ['Styling with CSS', true],
                ['Your first deployed page', false],
              ].map(([label, done], i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className={
                      done
                        ? 'flex size-5 shrink-0 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-primary-foreground'
                        : 'flex size-5 shrink-0 items-center justify-center rounded-full border border-clay text-[10px] font-bold text-clay'
                    }
                    aria-hidden
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={done ? 'text-muted-foreground line-through' : 'font-medium'}>
                    {label as string}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight">Courses to start with</h2>
          <Link href="/courses" className="text-sm font-medium text-pine underline-offset-4 hover:underline">
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
      </section>

      {posts.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="font-heading text-xl font-semibold tracking-tight">From the blog</h2>
              <Link href="/blog" className="text-sm font-medium text-pine underline-offset-4 hover:underline">
                Read more
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <Link
                  key={post.documentId}
                  href={`/blog/${post.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-pine/40"
                >
                  <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">
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
