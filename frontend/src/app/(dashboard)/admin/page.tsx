import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileText, GraduationCap, Newspaper, Users } from 'lucide-react';
import { PageHeader } from '@/components/lms/page-header';
import { getPlatformStats } from '@/lib/api/users';
import { requireRole } from '@/lib/auth';
import { ROLE_LABELS, ROLES, type Role } from '@/types/lms';

export const metadata: Metadata = { title: 'Overview' };

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint?: string;
  href?: string;
}) {
  return (
    <div className="group relative h-full w-full rounded-xl border border-border bg-card p-5 transition-colors hover:border-pine/40">
      {href && (
        <Link
          href={href}
          aria-label={`Open ${label}`}
          className="absolute inset-0 z-10 rounded-xl"
        />
      )}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-tight tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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

export default async function AdminOverviewPage() {
  await requireRole('admin');
  const stats = await getPlatformStats();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Admin"
        title="Platform overview"
        description="Everything on the platform at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="People" value={stats.totalUsers} href="/admin/users" hint="Manage roles" />
        <StatCard icon={BookOpen} label="Courses" value={stats.totalCourses} href="/teach" />
        <StatCard icon={FileText} label="Lessons" value={stats.totalLessons} href="/teach" />
        <StatCard icon={GraduationCap} label="Enrollments" value={stats.totalEnrollments} href="/teach" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="lg:row-span-2">
          <RoleBreakdown usersByRole={stats.usersByRole} />
        </div>
        <StatCard
          icon={Newspaper}
          label="Blog posts"
          value={stats.totalPosts}
          hint={`${stats.publishedPosts} published · ${stats.draftPosts} draft`}
          href="/blog-admin"
        />
        <StatCard
          icon={FileText}
          label="Quiz attempts"
          value={stats.totalQuizAttempts}
          hint={`across ${stats.totalQuizzes} quizzes`}
          href="/teach"
        />
      </div>
    </div>
  );
}
