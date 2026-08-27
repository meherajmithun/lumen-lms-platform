'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateUserRoleAction } from '@/app/actions/admin';
import { ROLE_LABELS, ROLES, type Role } from '@/types/lms';

export function RoleSelect({
  userId,
  username,
  currentRole,
  disabled,
  disabledReason,
}: {
  userId: number;
  username: string;
  currentRole: Role;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [next, setNext] = useState<Role | null>(null);

  if (disabled) {
    return (
      <span
        className="text-xs text-muted-foreground"
        title={disabledReason}
      >
        {ROLE_LABELS[currentRole]}
        {disabledReason && <span className="ml-1 opacity-70">· locked</span>}
      </span>
    );
  }

  return (
    <>
      <select
        value={currentRole}
        disabled={pending}
        onChange={(event) => setNext(event.target.value as Role)}
        aria-label={`Role for ${username}`}
        className="h-8 rounded-lg border border-input bg-background px-2 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
      >
        {Object.values(ROLES).map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>

      <AlertDialog open={next !== null} onOpenChange={(open) => !open && setNext(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change {username} to {next ? ROLE_LABELS[next] : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This changes what they can do immediately. They keep their account and their
              existing work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const role = next;
                if (!role) return;
                start(async () => {
                  const result = await updateUserRoleAction(userId, role);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success(`${username} is now ${ROLE_LABELS[role]}`);
                    router.refresh();
                  }
                  setNext(null);
                });
              }}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Change role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
