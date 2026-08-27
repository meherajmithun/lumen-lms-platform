import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in areas have nothing useful for a crawler and are behind auth anyway.
      disallow: ['/admin', '/teach', '/blog-admin', '/my-courses', '/learn', '/results', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
