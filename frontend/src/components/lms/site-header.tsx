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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-base font-semibold tracking-tight transition-opacity hover:opacity-80 sm:text-lg"
          aria-label="Lumen home"
        >
          <GraduationCap className="size-6 text-pine" aria-hidden />
          Lumen
        </Link>

        <nav
          className={cn(
            'min-w-0 items-center justify-center justify-self-end gap-1 text-sm text-muted-foreground md:gap-2 lg:justify-self-auto',
            showMarketingNav ? 'flex' : 'hidden'
          )}
          aria-label="Main navigation"
        >
          <Link href="/courses" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Courses
          </Link>
          <Link href="/pricing" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Pricing
          </Link>
          <Link
            href="/enroll"
            className="hidden rounded-md px-3 py-2 font-semibold italic text-foreground transition-colors hover:bg-muted lg:block"
          >
            Enroll
          </Link>
          <Link href="/instructors" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Instructors
          </Link>
          <Link href="/blog" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground lg:block">
            Blog
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open navigation menu"
              className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:h-auto lg:w-auto lg:gap-1 lg:px-3 lg:py-2"
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
            'min-w-0 items-center justify-self-end gap-1 border-l border-border pl-2 sm:pl-3',
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
