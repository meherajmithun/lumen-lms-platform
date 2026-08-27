'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function EnrollButton({
  slug,
  label = 'Enroll',
}: {
  courseId: string;
  slug: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => router.push(`/enroll?course=${encodeURIComponent(slug)}`)}
    >
      {label}
    </Button>
  );
}
