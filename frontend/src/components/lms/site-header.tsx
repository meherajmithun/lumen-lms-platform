import Link from 'next/link';
import {
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  GraduationCap,
  Home,
  Mail,
  MessageSquareQuote,
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
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
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
            'col-start-2 items-center justify-center gap-1 text-sm text-muted-foreground md:gap-2',
            showMarketingNav ? 'flex' : 'hidden'
          )}
          aria-label="Main navigation"
        >
          <Link href="/courses" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground sm:block">
            Courses
          </Link>
          <Link href="/pricing" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground sm:block">
            Pricing
          </Link>
          <Link
            href="/enroll"
            className="hidden rounded-md px-3 py-2 font-semibold italic text-foreground transition-colors hover:bg-muted sm:block"
          >
            Enroll
          </Link>
          <Link href="/instructors" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground sm:block">
            Instructors
          </Link>
          <Link href="/blog" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground sm:block">
            Blog
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 rounded-md px-2 py-2 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3"
            >
              More
              <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="sm:hidden" render={<Link href="/courses" />}>
                <BookOpen aria-hidden />
                Courses
              </DropdownMenuItem>
              <DropdownMenuItem className="sm:hidden" render={<Link href="/pricing" />}>
                <CircleDollarSign aria-hidden />
                Pricing
              </DropdownMenuItem>
              <DropdownMenuItem className="sm:hidden" render={<Link href="/enroll" />}>
                <UserPlus aria-hidden />
                Enroll
              </DropdownMenuItem>
              <DropdownMenuItem className="sm:hidden" render={<Link href="/instructors" />}>
                <UsersRound aria-hidden />
                Instructors
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
            'col-start-3 items-center justify-self-end gap-1 border-l border-border pl-4',
            showMarketingNav ? 'hidden lg:flex' : 'flex'
          )}
        >
          <ThemeToggle />
          {user ? (
            <>
              {user.role === ROLES.STUDENT && <NotificationMenu />}
              <Link href={homeFor(user.role)} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Dashboard
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
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
