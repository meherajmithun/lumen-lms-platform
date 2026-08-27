import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getPublishedPosts } from '@/lib/api/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notes on course design, progress tracking and how the platform works.',
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts().catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <PageHeader
        eyebrow="Writing"
        title="Blog"
        description="Only published posts appear here — drafts are never served to the public."
      />

      {posts.length > 0 ? (
        <div className="divide-y divide-border border-t border-border">
          {posts.map((post) => (
            <article key={post.documentId} className="py-7">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                <Link href={`/blog/${post.slug}`} className="hover:text-pine">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(post.publishedAt)}
                {post.author?.username && <> · {post.author.username}</>}
              </p>
              {post.excerpt && (
                <p className="prose-lesson mt-3 text-muted-foreground">{post.excerpt}</p>
              )}
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-medium text-pine underline-offset-4 hover:underline"
              >
                Read the post →
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="Nothing published yet"
          description="New posts will show up here as soon as they go live."
        />
      )}
    </div>
  );
}
