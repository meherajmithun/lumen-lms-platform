'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** A plain, always-visible sign-out control for the account page. */
export function SignOutButton({
  className,
  variant = 'outline',
}: {
  className?: string;
  variant?: 'outline' | 'ghost';
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant={variant}
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const response = await fetch('/api/auth/logout', { method: 'POST' });
          if (!response.ok) {
            toast.error("Couldn't sign you out. Please try again.");
            return;
          }
          toast.success('Signed out');
          router.push('/');
          router.refresh();
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-4" aria-hidden />
      )}
      Sign out
    </Button>
  );
}
