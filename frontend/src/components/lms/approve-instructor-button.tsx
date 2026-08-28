'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { approveInstructorAction, rejectInstructorAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';

export function InstructorReviewButtons({ userId }: { userId: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function review(decision: 'approve' | 'reject') {
    startTransition(async () => {
        const result = decision === 'approve'
          ? await approveInstructorAction(userId)
          : await rejectInstructorAction(userId);
        if (result.ok) {
          toast.success(`Instructor ${decision === 'approve' ? 'approved' : 'rejected'}`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => review('approve')}>
        {pending ? 'Reviewing…' : 'Approve'}
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => review('reject')}>
        Reject
      </Button>
    </div>
  );
}
