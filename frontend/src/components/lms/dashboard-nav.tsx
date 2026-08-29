'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookMarked, BookOpen, ClipboardList, LayoutDashboard,
  MessageSquareQuote, Newspaper, PenSquare, SlidersHorizontal, User, UserPlus, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/lms';

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

/**
 * The sidebar is the permission matrix made visible: each role sees only the
 * sections its row allows. Strapi refuses the rest regardless of what is shown.
 */
const NAV: Record<Role, Item[]> = {
  admin: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'People', icon: Users },
    { href: '/admin/instructor-requests', label: 'Instructor requests', icon: UserPlus },
    { href: '/teach', label: 'Courses', icon: BookOpen },
    { href: '/blog-admin', label: 'Blog', icon: Newspaper },
  ],
  content_manager: [
    { href: '/teach', label: 'Courses', icon: BookOpen },
    { href: '/enrollment-requests', label: 'Enrollment requests', icon: ClipboardList },
    { href: '/enrollment-management', label: 'Enrollment Management', icon: SlidersHorizontal },
    { href: '/story-requests', label: 'Story requests', icon: MessageSquareQuote },
    { href: '/blog-admin', label: 'Blog', icon: Newspaper },
  ],
  instructor: [{ href: '/teach', label: 'My courses', icon: PenSquare }],
  student: [
    { href: '/my-courses', label: 'My courses', icon: BookMarked },
    { href: '/courses', label: 'Browse', icon: BookOpen },
    { href: '/results', label: 'Quiz results', icon: ClipboardList },
    { href: '/share-story', label: 'Share your story', icon: MessageSquareQuote },
  ],
};

/** Every role gets these, below their own section. */
const COMMON: Item[] = [{ href: '/account', label: 'Your profile', icon: User }];

export function DashboardNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  // Link handles viewport/hover prefetching. Eagerly prefetching every role
  // route here caused all authenticated data pages to hit Strapi together.
  const items = [...NAV[role], ...COMMON];

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-2 py-2 text-sm transition-[color,background-image,box-shadow,transform] duration-200 before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--sidebar-active-marker)] before:opacity-0',
              active
                ? '[background-image:var(--sidebar-active-gradient)] font-semibold text-[var(--sidebar-active-foreground)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_28px_-18px_#061827] before:opacity-100'
                : 'text-sidebar-foreground/70 hover:[background-image:var(--sidebar-hover-gradient)] hover:text-sidebar-foreground'
            )}
          >
            <span
              className={cn(
                'relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,box-shadow] duration-200',
                active
                  ? 'bg-[var(--sidebar-active-icon-bg)] text-[var(--sidebar-active-icon-foreground)] shadow-sm ring-1 ring-white/10'
                  : 'group-hover:bg-white/10 group-hover:text-[var(--sidebar-hover-icon)]'
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="relative z-[1]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
