import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { PostForm } from '@/components/lms/post-form';
import { getPostById } from '@/lib/api/posts';
import { requireRole } from '@/lib/auth';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  await requireRole('admin', 'content_manager');
  const { postId } = await params;

  const post = await getPostById(postId);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/blog-admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        All posts
      </Link>

      <div className="mt-4 mb-7 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
          {post.title}
        </h1>
        {post.publishedAt && (
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-sm text-pine underline-offset-4 hover:underline"
          >
            View public page
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        )}
      </div>

      <PostForm post={post} />
    </div>
  );
}
