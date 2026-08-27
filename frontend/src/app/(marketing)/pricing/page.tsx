import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const included = [
  'Access to every published course',
  'Lesson progress that saves automatically',
  'Instant quiz results',
  'Learn on any device',
];

export const metadata = {
  title: 'Pricing | Lumen',
  description: 'Simple, transparent access to learning on Lumen.',
};

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">Pricing</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Start learning for free.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          One straightforward plan with the tools you need to keep learning consistently.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <p className="font-heading text-lg font-semibold">Lumen learner</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-heading text-4xl font-semibold">Free</span>
          <span className="pb-1 text-sm text-muted-foreground">to get started</span>
        </div>
        <ul className="mt-7 space-y-3 text-sm">
          {included.map((item) => (
            <li key={item} className="flex gap-3">
              <Check className="mt-0.5 size-4 shrink-0 text-pine" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link href="/register" className={`${buttonVariants({ size: 'lg' })} mt-8 w-full`}>
          Enroll now
        </Link>
      </div>
    </section>
  );
}
