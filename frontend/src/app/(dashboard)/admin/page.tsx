import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight, BookOpen, CheckCircle2, FileText, GraduationCap, Mail, Newspaper, Users,
} from 'lucide-react';
import { PageHeader } from '@/components/lms/page-header';
import { getPlatformStats } from '@/lib/api/users';
import { requireRole } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, ROLES, type Role } from '@/types/lms';

export const metadata: Metadata = { title: 'Overview' };

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint?: string;
  href?: string;
  tone: 'pine' | 'clay' | 'blue' | 'plum';
  active?: boolean;
}) {
  const tones = {
    pine: 'border-t-pine bg-pine-wash text-pine',
    clay: 'border-t-clay bg-clay-wash text-clay',
    blue: 'border-t-[var(--chart-3)] bg-[color-mix(in_oklch,var(--chart-3)_14%,transparent)] text-[var(--chart-3)]',
    plum: 'border-t-[var(--chart-5)] bg-[color-mix(in_oklch,var(--chart-5)_14%,transparent)] text-[var(--chart-5)]',
  }[tone];

  return (
    <div className={cn(
      'group relative h-full w-full overflow-hidden rounded-2xl border border-t-2 border-border bg-card p-5 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]',
      tones.split(' ')[0],
      active && 'ring-2 ring-pine/20'
    )}>
      {href && (
        <Link
          href={href}
          aria-label={`Open ${label}`}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className={cn('flex size-8 items-center justify-center rounded-xl', tones.split(' ').slice(1).join(' '))}>
            <Icon className="size-4" aria-hidden />
          </span>
        <span className="text-xs font-medium uppercase tracking-[0.1em]">{label}</span>
        </span>
        {href && <ArrowUpRight className="size-4 text-muted-foreground/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />}
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-tight tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">{eyebrow}</p>
        <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tabular text-muted-foreground">
        {count} total
      </span>
    </div>
  );
}

/**
 * Users per role, drawn as proportional bars.
 *
 * The bar length carries the comparison and the number is always printed beside
 * it, so the chart never depends on colour alone to be readable.
 */
function RoleBreakdown({ usersByRole }: { usersByRole: Partial<Record<Role, number>> }) {
  const rows = Object.values(ROLES).map((role) => ({
    role,
    count: usersByRole[role] ?? 0,
  }));
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="h-full rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-sm font-semibold tracking-tight">People by role</h2>
      <ul className="mt-4 space-y-3">
        {rows.map(({ role, count }) => (
          <li key={role} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3">
            <span className="truncate text-sm">{ROLE_LABELS[role]}</span>
            <span className="h-2 overflow-hidden rounded-full bg-spine-empty">
              <span
                className="block h-full rounded-full bg-pine"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-sm font-medium tabular">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireRole('admin');
  const { view } = await searchParams;
  const detailView = view === 'enrollments' ? 'enrollments' : view === 'lessons' ? 'lessons' : null;
  const stats = await getPlatformStats(detailView !== null);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Admin"
        title="Platform overview"
        description="Everything on the platform at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="People" value={stats.totalUsers} href="/admin/users" hint="Manage roles" tone="pine" />
        <StatCard icon={BookOpen} label="Courses" value={stats.totalCourses} href="/teach" tone="clay" />
        <StatCard icon={FileText} label="Lessons" value={stats.totalLessons} href="/admin?view=lessons#platform-details" tone="blue" active={detailView === 'lessons'} />
        <StatCard icon={GraduationCap} label="Enrollments" value={stats.totalEnrollments} href="/admin?view=enrollments#platform-details" tone="plum" active={detailView === 'enrollments'} />
      </div>

      {detailView && (
        <section id="platform-details" className="mt-6 scroll-mt-24 rounded-3xl border border-border/80 bg-card/70 p-5 shadow-[var(--shadow-raised)] sm:p-7">
          {detailView === 'lessons' ? (
            <>
              <SectionHeading eyebrow="Course library" title="Lessons by course" count={stats.totalLessons} />
              <div className="grid gap-4 lg:grid-cols-2">
                {stats.courseDetails.map((course) => (
                  <article key={course.documentId} className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                    <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-[color-mix(in_oklch,var(--chart-3)_8%,transparent)] px-5 py-4">
                      <h3 className="font-heading font-semibold tracking-tight">{course.title}</h3>
                      <span className="shrink-0 text-xs tabular text-muted-foreground">{course.lessons.length} lessons</span>
                    </div>
                    {course.lessons.length > 0 ? (
                      <ol className="divide-y divide-border/60">
                        {course.lessons.map((lesson, index) => (
                          <li key={lesson.documentId} className="flex items-center gap-3 px-5 py-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--chart-3)_14%,transparent)] text-[11px] font-semibold text-[var(--chart-3)] tabular">
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {lesson.contentType === 'video' ? 'Video' : 'Reading'}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="px-5 py-5 text-sm text-muted-foreground">No lessons added yet.</p>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionHeading eyebrow="Learning community" title="Students enrolled by course" count={stats.totalEnrollments} />
              <div className="grid gap-4 lg:grid-cols-2">
                {stats.courseDetails.map((course) => {
                  const enrollments = course.enrollments.filter((enrollment) => enrollment.student !== null);
                  return (
                    <article key={course.documentId} className="overflow-hidden rounded-2xl border border-border/80 bg-card">
                      <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-[color-mix(in_oklch,var(--chart-5)_8%,transparent)] px-5 py-4">
                        <h3 className="font-heading font-semibold tracking-tight">{course.title}</h3>
                        <span className="shrink-0 text-xs tabular text-muted-foreground">{enrollments.length} enrolled</span>
                      </div>
                      {enrollments.length > 0 ? (
                        <ul className="divide-y divide-border/60">
                          {enrollments.map((enrollment) => {
                            const student = enrollment.student!;
                            return (
                              <li key={enrollment.documentId} className="flex items-center gap-3 px-5 py-3">
                                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--chart-5)_14%,transparent)] text-[11px] font-semibold text-[var(--chart-5)]">
                                  {student.username.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">{student.username}</span>
                                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                    <Mail className="size-3" aria-hidden /> {student.email}
                                  </span>
                                </span>
                                <CheckCircle2 className="size-4 shrink-0 text-pine" aria-label="Enrolled" />
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="px-5 py-5 text-sm text-muted-foreground">No students enrolled yet.</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <RoleBreakdown usersByRole={stats.usersByRole} />
        </div>
        <StatCard
          icon={Newspaper}
          label="Blog posts"
          value={stats.totalPosts}
          hint={`${stats.publishedPosts} published · ${stats.draftPosts} draft`}
          href="/blog-admin"
          tone="clay"
        />
      </div>
    </div>
  );
}
