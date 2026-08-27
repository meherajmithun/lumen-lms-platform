import type { MetadataRoute } from 'next';
import { getPublishedCourses } from '@/lib/api/courses';
import { getPublishedPosts } from '@/lib/api/posts';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only public, published content belongs in a sitemap.
  const [courses, posts] = await Promise.all([
    getPublishedCourses().catch(() => []),
    getPublishedPosts().catch(() => []),
  ]);

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/courses`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.8 },
    ...courses
      .filter((c) => c.isPublished)
      .map((c) => ({ url: `${base}/courses/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
