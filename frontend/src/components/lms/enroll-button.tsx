'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { enrollAction } from '@/app/actions/enrollment';

export function EnrollButton({
  courseId,
  slug,
  label = 'Enroll',
}: {
  courseId: string;
  slug: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await enrollAction(courseId, slug);
          if (result.ok) {
            toast.success('Enrolled', { description: 'It’s in My Courses now.' });
            router.push(`/learn/${slug}`);
            router.refresh();
          } else {
            toast.error(result.error);
          }
        })
      }
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {label}
    </Button>
  );
}
