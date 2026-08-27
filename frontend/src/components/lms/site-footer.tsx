import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
        <p>Lumen — a learning platform built around sequence and progress.</p>
        <nav className="flex gap-5">
          <Link href="/courses" className="transition-colors hover:text-foreground">
            Courses
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
