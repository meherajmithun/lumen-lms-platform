/**
 * No loading.tsx anywhere under (marketing).
 *
 * A loading boundary flushes a 200 shell before the page resolves, which means a
 * later notFound() can only arrive as a streamed client navigation — the response
 * status stays 200. Public detail pages have to answer a missing or unpublished
 * slug with a real 404, so these routes deliberately have no Suspense boundary
 * above them. They are ISR-cached and fast enough not to need one.
 */
import { SiteHeader } from '@/components/lms/site-header';
import { SiteFooter } from '@/components/lms/site-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
