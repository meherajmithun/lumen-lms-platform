'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<'student' | 'instructor'>('student');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload =
      mode === 'login'
        ? { identifier: form.get('email'), password: form.get('password') }
        : {
            username: form.get('username'),
            email: form.get('email'),
            password: form.get('password'),
            role,
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(body.error ?? 'Something went wrong. Please try again.');
      setPending(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {mode === 'register' && (
        <div className="space-y-2">
          <Label htmlFor="username">Your name</Label>
          <Input id="username" name="username" autoComplete="name" required minLength={2} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'register' ? 8 : undefined}
          aria-describedby={mode === 'register' ? 'password-hint' : undefined}
        />
        {mode === 'register' && (
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters, with a letter and a number.
          </p>
        )}
      </div>

      {mode === 'register' && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">I&apos;m joining to</legend>
          <RadioGroup
            value={role}
            onValueChange={(value) => setRole(value as 'student' | 'instructor')}
            className="grid gap-2"
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/60 has-[:checked]:border-pine has-[:checked]:bg-pine-wash">
              <RadioGroupItem value="student" id="role-student" className="mt-0.5" />
              <span className="text-sm">
                <span className="block font-medium">Take courses</span>
                <span className="text-muted-foreground">Enroll, work through lessons, take quizzes.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/60 has-[:checked]:border-pine has-[:checked]:bg-pine-wash">
              <RadioGroupItem value="instructor" id="role-instructor" className="mt-0.5" />
              <span className="text-sm">
                <span className="block font-medium">Teach courses</span>
                <span className="text-muted-foreground">Build your own courses, lessons and quizzes.</span>
              </span>
            </label>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Content Manager and Admin roles are assigned by an administrator.
          </p>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
    </form>
  );
}
