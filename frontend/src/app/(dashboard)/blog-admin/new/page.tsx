import type { Metadata } from 'next';
import { PageHeader } from '@/components/lms/page-header';
import { PostForm } from '@/components/lms/post-form';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'New post' };

export default async function NewPostPage() {
  await requireRole('admin', 'content_manager');
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Writing"
        title="New post"
        description="Saved as a draft. Nothing is public until you publish it."
      />
      <PostForm />
    </div>
  );
}
