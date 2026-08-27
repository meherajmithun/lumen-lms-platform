import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-heading text-5xl font-semibold tracking-tight text-pine tabular">404</p>
      <h1 className="mt-3 font-heading text-xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The link may be out of date, or the page may never have been published.
      </p>
      <Link href="/" className={buttonVariants({ className: 'mt-6' })}>
        Go to the homepage
      </Link>
    </main>
  );
}
