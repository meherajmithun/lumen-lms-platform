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

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950 text-zinc-100 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-base font-semibold tracking-tight transition-opacity hover:opacity-80 sm:text-lg"
          aria-label="Lumen home"
        >
          <GraduationCap className="size-6 text-emerald-400" aria-hidden />
          Lumen
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm text-zinc-300 md:ml-8 md:gap-2" aria-label="Main navigation">
          <Link href="/courses" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-white/10 hover:text-white sm:block">
            Courses
          </Link>
          <Link href="/pricing" className="hidden rounded-md px-3 py-2 transition-colors hover:bg-white/10 hover:text-white sm:block">
            Pricing
          </Link>
          <Link
            href="/register"
            className="hidden rounded-md px-3 py-2 font-semibold italic text-white transition-colors hover:bg-white/10 sm:block"
          >
            Enroll
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 rounded-md px-2 py-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:px-3"
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

        <div className="hidden items-center gap-1 border-l border-white/15 pl-3 md:flex [&_button]:text-zinc-200 [&_button:hover]:bg-white/10 [&_a]:text-zinc-200 [&_a:hover]:bg-white/10">
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
