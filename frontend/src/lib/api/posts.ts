import 'server-only';
import { strapiFetch } from '@/lib/strapi';
import type { Paginated, Post } from '@/types/lms';

/** Public blog. Anonymous, cached — Strapi only ever returns published entries here. */
export async function getPublishedPosts(): Promise<Post[]> {
  const res = await strapiFetch<Paginated<Post>>(
    '/posts?populate[author][fields][0]=username&sort=publishedAt:desc&pagination[pageSize]=50',
    { auth: false, tags: ['posts'], revalidate: 60 }
  );
  return res.data ?? [];
}

export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const res = await strapiFetch<Paginated<Post>>(
    `/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[author][fields][0]=username`,
    { auth: false, tags: ['posts', `post:${slug}`], revalidate: 60 }
  );
  return res.data?.[0] ?? null;
}

/** Authoring view — includes drafts, and only for Admin/Content Manager. */
export async function getManagedPosts(scopeMine: boolean): Promise<Post[]> {
  const res = await strapiFetch<Paginated<Post>>(
    `/posts?status=draft&populate[author][fields][0]=username&sort=updatedAt:desc&pagination[pageSize]=100${
      scopeMine ? '&scope=mine' : ''
    }`
  );
  return res.data ?? [];
}

export async function getPostById(documentId: string): Promise<Post | null> {
  const res = await strapiFetch<{ data: Post }>(
    `/posts/${documentId}?status=draft&populate[author][fields][0]=username`
  );
  return res.data ?? null;
}

export async function createPost(data: Record<string, unknown>): Promise<Post> {
  const res = await strapiFetch<{ data: Post }>('/posts', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return res.data;
}

export async function updatePost(documentId: string, data: Record<string, unknown>): Promise<void> {
  await strapiFetch(`/posts/${documentId}`, { method: 'PUT', body: JSON.stringify({ data }) });
}

export async function deletePost(documentId: string): Promise<void> {
  await strapiFetch(`/posts/${documentId}`, { method: 'DELETE' });
}

export async function publishPost(documentId: string): Promise<void> {
  await strapiFetch(`/posts/${documentId}/publish`, { method: 'POST' });
}

export async function unpublishPost(documentId: string): Promise<void> {
  await strapiFetch(`/posts/${documentId}/unpublish`, { method: 'POST' });
}
