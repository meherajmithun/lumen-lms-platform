import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/lms/auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-4xl font-bold leading-tight tracking-[-0.045em]">Sign in</h1>
      <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
        Pick up where you left off.
      </p>

      <Suspense fallback={<div className="h-64" />}>
        <AuthForm mode="login" />
      </Suspense>

      <p className="mt-6 text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/register" className="font-medium text-pine underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
