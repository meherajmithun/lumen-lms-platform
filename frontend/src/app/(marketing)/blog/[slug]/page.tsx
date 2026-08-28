import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPublishedPostBySlug, getPublishedPosts } from '@/lib/api/posts';

export async function generateStaticParams() {
  // Pre-rendering is an optimisation, not a requirement. If the backend is
  // unreachable at build time the build should still succeed and these pages
  // render on demand, rather than failing the whole deployment.
  try {
    const posts = await getPublishedPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  /**
   * This calls the anonymous, public endpoint. Strapi hard-forces status=published
   * for any caller that is not a blog author, so a draft's URL 404s here even if
   * someone knows the slug.
   */
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All posts
      </Link>

      <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,3.9rem)] font-bold leading-[1.08] tracking-[-0.05em] text-balance">
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatDate(post.publishedAt)}
        {post.author?.username && <> · {post.author.username}</>}
      </p>

      {post.coverImageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-7 aspect-[16/9] w-full rounded-xl object-cover"
        />
      )}

      {/* Rendered as plain paragraphs rather than raw HTML — nothing from the
          editor is injected into the page as markup. */}
      <div className="prose-lesson mt-10">
        {post.body.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
