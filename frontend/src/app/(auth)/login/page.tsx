import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/lms/auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
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
