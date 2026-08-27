import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { getCurrentUser } from '@/lib/auth';
import { homeFor } from '@/lib/permissions';

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2 font-heading text-sm font-semibold">
          <GraduationCap className="size-5 text-pine" aria-hidden />
          Lumen
        </Link>

        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/courses" className="transition-colors hover:text-foreground">
            Courses
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
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
