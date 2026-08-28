import Link from 'next/link';
import {
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  GraduationCap,
  Home,
  Mail,
  Menu,
  MessageSquareQuote,
  Newspaper,
  UsersRound,
  UserPlus,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { getCurrentUser } from '@/lib/auth';
import { homeFor } from '@/lib/permissions';
import { ROLES } from '@/types/lms';
import { cn } from '@/lib/utils';
import { NotificationMenu } from './notification-menu';

export async function SiteHeader() {
  const user = await getCurrentUser();
  const showMarketingNav = !user || user.role === ROLES.STUDENT;

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-card/92 text-foreground shadow-[0_10px_36px_-26px_rgb(7_47_37_/_0.42)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/82 dark:shadow-[0_14px_44px_-28px_rgb(0_0_0_/_0.9)]">
      <div className="mx-auto grid h-[4.5rem] max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:gap-4 sm:px-5">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 font-heading text-base font-bold tracking-[-0.025em] sm:text-lg"
          aria-label="Lumen home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-pine text-primary-foreground shadow-[var(--shadow-raised)] transition-transform duration-200 group-hover:-rotate-3">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          Lumen
        </Link>

        <nav
          className={cn(
            'min-w-0 items-center justify-center justify-self-end gap-0.5 text-[0.82rem] font-medium text-muted-foreground md:gap-1 lg:justify-self-center',
            showMarketingNav ? 'flex' : 'hidden'
          )}
          aria-label="Main navigation"
        >
          <Link href="/courses" className="hidden rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Courses
          </Link>
          <Link href="/pricing" className="hidden rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Pricing
          </Link>
          <Link
            href="/enroll"
            className="hidden rounded-lg px-3 py-2 font-semibold text-pine transition-colors hover:bg-pine-wash lg:block"
          >
            Enroll
          </Link>
          <Link href="/instructors" className="hidden rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Instructors
          </Link>
          <Link href="/blog" className="hidden rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Blog
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open navigation menu"
              className="flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:h-auto lg:w-auto lg:gap-1 lg:px-3 lg:py-2"
            >
              <Menu className="size-5 lg:hidden" aria-hidden />
              <span className="hidden lg:inline">More</span>
              <ChevronDown className="hidden size-3.5 lg:block" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="lg:hidden" render={<Link href="/courses" />}>
                <BookOpen aria-hidden />
                Courses
              </DropdownMenuItem>
              <DropdownMenuItem className="lg:hidden" render={<Link href="/pricing" />}>
                <CircleDollarSign aria-hidden />
                Pricing
              </DropdownMenuItem>
              <DropdownMenuItem className="lg:hidden" render={<Link href="/enroll" />}>
                <UserPlus aria-hidden />
                Enroll
              </DropdownMenuItem>
              <DropdownMenuItem className="lg:hidden" render={<Link href="/instructors" />}>
                <UsersRound aria-hidden />
                Instructors
              </DropdownMenuItem>
              <DropdownMenuItem className="lg:hidden" render={<Link href="/blog" />}>
                <Newspaper aria-hidden />
                Blog
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/" />}>
                <Home aria-hidden />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/stories" />}>
                <MessageSquareQuote aria-hidden /> Stories
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/contact" />}>
                <Mail aria-hidden /> Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div
          className={cn(
            'min-w-0 items-center justify-self-end gap-1.5 border-l border-border/80 pl-2.5 sm:pl-4',
            'flex'
          )}
        >
          <span className={showMarketingNav ? 'hidden lg:inline-flex' : 'inline-flex'}><ThemeToggle /></span>
          {user ? (
            <>
              {user.role === ROLES.STUDENT && <NotificationMenu />}
              <Link href={homeFor(user.role)} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden lg:inline-flex')}>
                Dashboard
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden lg:inline-flex')}>
                Sign in
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'sm' })}>
                Join Lumen
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
