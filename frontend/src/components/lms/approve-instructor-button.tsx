'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { approveInstructorAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';

export function ApproveInstructorButton({ userId }: { userId: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const result = await approveInstructorAction(userId);
        if (result.ok) {
          toast.success('Instructor approved');
          router.refresh();
        } else {
          toast.error(result.error);
        }
      })}
    >
      {pending ? 'Approving…' : 'Approve'}
    </Button>
  );
}
