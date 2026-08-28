import { PageHeader } from '@/components/lms/page-header';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Contact | Lumen' };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <div className="rounded-3xl border border-border/80 bg-card px-6 py-12 text-center shadow-[var(--shadow-raised)] sm:px-12 sm:py-16">
        <PageHeader
          eyebrow="Contact us"
          title="How can we help?"
          description="Questions about enrollment, payment, or course access? Call our support team."
          variant="marketing"
          align="center"
          className="mb-8 sm:mb-10"
        />
        <a href="tel:+8801996546509" className={buttonVariants({ size: 'xl' })}>
          Call 01XXXXXXXXXX
        </a>
      </div>
    </main>
  );
}
