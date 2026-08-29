import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, ClipboardList, MessageSquareQuote, Newspaper } from 'lucide-react';
import { PageHeader } from '@/components/lms/page-header';
import { requireRole } from '@/lib/auth';
import { getManagedCourses } from '@/lib/api/courses';
import { getEnrollmentApplications } from '@/lib/api/enrollments';
import { getManagedPosts } from '@/lib/api/posts';
import { getStoryRequests } from '@/lib/api/stories';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Content overview' };

const cards = [
  { key: 'courses', label: 'Courses', hint: 'Manage course content', href: '/teach', icon: BookOpen, tone: 'var(--chart-3)' },
  { key: 'enrollments', label: 'Enrollment requests', hint: 'Awaiting payment review', href: '/enrollment-requests', icon: ClipboardList, tone: 'var(--chart-5)' },
  { key: 'stories', label: 'Story requests', hint: 'Awaiting moderation', href: '/story-requests', icon: MessageSquareQuote, tone: 'var(--chart-4)' },
  { key: 'posts', label: 'Blog posts', hint: 'Published and drafts', href: '/blog-admin', icon: Newspaper, tone: 'var(--chart-2)' },
] as const;

export default async function ContentManagerOverviewPage() {
  await requireRole('content_manager');
  const [courses, enrollments, stories, posts] = await Promise.all([
    getManagedCourses(false),
    getEnrollmentApplications(),
    getStoryRequests(),
    getManagedPosts(),
  ]);
  const values = {
    courses: courses.length,
    enrollments: enrollments.filter((row) => row.status === 'pending').length,
    stories: stories.filter((row) => row.status === 'pending').length,
    posts: posts.length,
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Content Manager"
        title="Content overview"
        description="Courses, requests, and publishing activity at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ key, label, hint, href, icon: Icon, tone }) => (
          <Link
            key={key}
            href={href}
            className={cn('group rounded-2xl border border-t-2 bg-card p-5 shadow-[var(--shadow-raised)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]')}
            style={{ borderTopColor: tone }}
          >
            <span className="flex items-start justify-between gap-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-4 block text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
            <strong className="mt-1 block font-heading text-3xl font-semibold tabular">{values[key]}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
