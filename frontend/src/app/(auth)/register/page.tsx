import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/lms/auth-form';

export const metadata: Metadata = { title: 'Create an account' };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Free, and takes about a minute.
      </p>

      <Suspense fallback={<div className="h-96" />}>
        <AuthForm mode="register" />
      </Suspense>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-pine underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
