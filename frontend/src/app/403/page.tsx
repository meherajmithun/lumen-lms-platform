import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { homeFor } from '@/lib/permissions';
import { ROLE_LABELS } from '@/types/lms';

export default async function ForbiddenPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <ShieldOff className="size-9 text-clay" aria-hidden />
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
        That page isn&apos;t open to your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {user
          ? `You're signed in as ${ROLE_LABELS[user.role]}, which doesn't include this page.`
          : 'Sign in to continue.'}
      </p>
      <Link
        href={user ? homeFor(user.role) : '/login'}
        className={buttonVariants({ size: 'lg', className: 'mt-6' })}
      >
        {user ? 'Back to your dashboard' : 'Sign in'}
      </Link>
    </main>
  );
}
