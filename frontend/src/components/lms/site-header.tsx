import Link from 'next/link';
import {
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  GraduationCap,
  Home,
  Newspaper,
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

export async function SiteHeader() {
  const user = await getCurrentUser();

  // Authoring roles use the dashboard sidebar. Showing a second, marketing-style
  // navigation bar while they preview public pages duplicates navigation and
  // makes the interface look like a student account.
  if (user && user.role !== ROLES.STUDENT) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-base font-semibold tracking-tight transition-opacity hover:opacity-80 sm:text-lg"
          aria-label="Lumen home"
        >
          <GraduationCap className="size-6 text-pine" aria-hidden />
          Lumen
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground md:ml-8 md:gap-2" aria-label="Main navigation">
          <Link href="/courses" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground sm:block">
            Courses
          </Link>
          <Link href="/pricing" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-foreground sm:block">
            Pricing
          </Link>
          <Link
            href="/register"
            className="hidden rounded-md px-3 py-2 font-semibold italic text-foreground transition-colors hover:bg-muted sm:block"
          >
            Enroll
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
              <DropdownMenuItem className="sm:hidden" render={<Link href="/register" />}>
                <UserPlus aria-hidden />
                Enroll
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/" />}>
                <Home aria-hidden />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/blog" />}>
                <Newspaper aria-hidden />
                Blog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden items-center gap-1 border-l border-border pl-3 md:flex">
          <ThemeToggle />
          {user ? (
            <>
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
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
