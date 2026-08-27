import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/lms/empty-state';
import { PageHeader } from '@/components/lms/page-header';
import { getManagedPosts } from '@/lib/api/posts';
import { requireRole } from '@/lib/auth';
import { ROLES, type Post } from '@/types/lms';

export const metadata: Metadata = { title: 'Blog' };

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function PostList({ posts, empty }: { posts: Post[]; empty: string }) {
  if (posts.length === 0) {
    return <EmptyState icon={Newspaper} title={empty} />;
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {posts.map((post) => (
        <li key={post.documentId}>
          <Link
            href={`/blog-admin/${post.documentId}`}
            className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{post.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {post.author?.username ?? 'Unknown author'} · updated {formatDate(post.updatedAt)}
              </span>
            </span>
            <span
              className={
                post.publishedAt
                  ? 'shrink-0 rounded-full bg-pine-wash px-2 py-0.5 text-[11px] font-medium text-pine'
                  : 'shrink-0 rounded-full bg-clay-wash px-2 py-0.5 text-[11px] font-medium text-clay'
              }
            >
              {post.publishedAt ? 'Published' : 'Draft'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function BlogAdminPage() {
  const user = await requireRole('admin', 'content_manager');

  // An Admin manages every post including other people's; a Content Manager
  // manages their own. Strapi's owns-post policy enforces the same split.
  const posts = await getManagedPosts(user.role === ROLES.CONTENT_MANAGER);

  const drafts = posts.filter((p) => !p.publishedAt);
  const published = posts.filter((p) => p.publishedAt);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Writing"
        title="Blog"
        description={
          user.role === ROLES.ADMIN
            ? 'Every post on the platform, including other authors’.'
            : 'Posts you have written.'
        }
        action={
          <Link href="/blog-admin/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            New post
          </Link>
        }
      />

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="drafts" className="mt-6">
          <PostList posts={drafts} empty="No drafts" />
        </TabsContent>
        <TabsContent value="published" className="mt-6">
          <PostList posts={published} empty="Nothing published yet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
