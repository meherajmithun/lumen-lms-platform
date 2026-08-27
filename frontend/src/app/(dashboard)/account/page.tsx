import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, CircleCheck, GraduationCap, Newspaper, PenSquare, Users } from 'lucide-react';
import { PageHeader } from '@/components/lms/page-header';
import { RoleBadge } from '@/components/lms/role-badge';
import { SignOutButton } from '@/components/lms/sign-out-button';
import { requireUser } from '@/lib/auth';
import { getMyEnrollments } from '@/lib/api/enrollments';
import { getMyAttempts } from '@/lib/api/quizzes';
import { getManagedCourses } from '@/lib/api/courses';
import { getManagedPosts } from '@/lib/api/posts';
import { getPlatformStats } from '@/lib/api/users';
import { getMyLearningHistory } from '@/lib/api/learning-time';
import { LearningConsistencyChart } from '@/components/lms/learning-consistency-chart';
import { ProfileEditor } from '@/components/lms/profile-editor';
import { getMyProfile } from '@/lib/api/users';
import { ROLES } from '@/types/lms';

export const metadata: Metadata = { title: 'Your profile' };

function Stat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-2.5 font-heading text-2xl font-semibold tracking-tight tabular">{value}</p>
    </>
  );
  const className =
    'rounded-xl border border-border bg-card p-4 transition-colors' + (href ? ' hover:border-pine/40' : '');
  return href ? <Link href={href} className={className}>{inner}</Link> : <div className={className}>{inner}</div>;
}

/**
 * Each role sees what it actually has. A student's profile is about their
 * learning; an instructor's is about what they teach. Anything a role cannot
 * reach is simply not fetched — no empty panels for permissions you don't hold.
 */
export default async function AccountPage() {
  const user = await requireUser();
  const profile = await getMyProfile().catch(() => ({ ...user, bio: '', avatarUrl: '' }));

  const isStudent = user.role === ROLES.STUDENT;
  const isAuthor =
    user.role === ROLES.INSTRUCTOR ||
    user.role === ROLES.CONTENT_MANAGER ||
    user.role === ROLES.ADMIN;
  const isBlogAuthor = user.role === ROLES.CONTENT_MANAGER || user.role === ROLES.ADMIN;

  const [enrollments, attempts, courses, posts, stats, learningHistory] = await Promise.all([
    isStudent
      ? getMyEnrollments().then((rows) => rows.filter((row) => row.course !== null)).catch(() => [])
      : Promise.resolve([]),
    isStudent ? getMyAttempts().catch(() => []) : Promise.resolve([]),
    isAuthor ? getManagedCourses(user.role === ROLES.INSTRUCTOR).catch(() => []) : Promise.resolve([]),
    isBlogAuthor
      ? getManagedPosts(user.role === ROLES.CONTENT_MANAGER).catch(() => [])
      : Promise.resolve([]),
    user.role === ROLES.ADMIN ? getPlatformStats().catch(() => null) : Promise.resolve(null),
    isStudent ? getMyLearningHistory(14).catch(() => null) : Promise.resolve(null),
  ]);

  const lessonsDone = enrollments.reduce((sum, e) => sum + e.progress.completed, 0);
  const finished = enrollments.filter((e) => e.progress.percent === 100).length;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Account" title="Your profile" />

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span aria-hidden className="flex size-14 shrink-0 overflow-hidden items-center justify-center rounded-full bg-pine-wash font-heading text-lg font-semibold text-pine">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
            ) : profile.username.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-semibold tracking-tight">{profile.username}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <RoleBadge role={user.role} className="mt-2" />
            {profile.bio && <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm text-muted-foreground">{profile.bio}</p>}
          </div>
          <ProfileEditor profile={profile} />
        </div>

        <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Account ID</dt>
            <dd className="mt-0.5 tabular">{user.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">What this role can do</dt>
            <dd className="mt-0.5 text-muted-foreground">
              {user.role === ROLES.ADMIN && 'Everything, including managing people and their roles.'}
              {user.role === ROLES.CONTENT_MANAGER && 'All courses and the blog. Not people.'}
              {user.role === ROLES.INSTRUCTOR && 'Your own courses, their lessons and quizzes.'}
              {user.role === ROLES.STUDENT && 'Enroll, work through lessons, take quizzes.'}
            </dd>
          </div>
        </dl>
      </section>

      {isStudent && learningHistory && (
        <div className="mt-6">
          <LearningConsistencyChart history={learningHistory} />
        </div>
      )}

      {isStudent && (
        <section className="mt-6">
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Your learning
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={BookOpen} label="Enrolled" value={enrollments.length} href="/my-courses" />
            <Stat icon={CircleCheck} label="Lessons done" value={lessonsDone} href="/my-courses" />
            <Stat icon={GraduationCap} label="Completed" value={finished} href="/my-courses" />
            <Stat
              icon={PenSquare}
              label="Best quiz"
              value={bestScore === null ? '—' : `${bestScore}%`}
              href="/results"
            />
          </div>
        </section>
      )}

      {isAuthor && (
        <section className="mt-6">
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Your teaching
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={BookOpen}
              label={user.role === ROLES.INSTRUCTOR ? 'Your courses' : 'All courses'}
              value={courses.length}
              href="/teach"
            />
            <Stat
              icon={CircleCheck}
              label="Published"
              value={courses.filter((c) => c.isPublished).length}
              href="/teach"
            />
            <Stat
              icon={Users}
              label="Enrolments"
              value={courses.reduce((sum, c) => sum + (c.enrollments?.length ?? 0), 0)}
              href="/teach"
            />
            {isBlogAuthor && (
              <Stat icon={Newspaper} label="Blog posts" value={posts.length} href="/blog-admin" />
            )}
          </div>
        </section>
      )}

      {stats && (
        <section className="mt-6">
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Platform
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="People" value={stats.totalUsers} href="/admin/users" />
            <Stat icon={BookOpen} label="Courses" value={stats.totalCourses} href="/teach" />
            <Stat icon={GraduationCap} label="Enrolments" value={stats.totalEnrollments} href="/teach" />
            <Stat icon={Newspaper} label="Posts" value={stats.totalPosts} href="/blog-admin" />
          </div>
        </section>
      )}

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-5">
        <div>
          <p className="text-sm font-medium">Signed in as {user.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Signing out clears your session on this device.
          </p>
        </div>
        <SignOutButton />
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Need a different role? Only an admin can change it —{' '}
        {user.role === ROLES.ADMIN ? (
          <Link href="/admin/users" className="text-pine underline underline-offset-4">
            manage people
          </Link>
        ) : (
          'ask one to update your account.'
        )}
      </p>
    </div>
  );
}
