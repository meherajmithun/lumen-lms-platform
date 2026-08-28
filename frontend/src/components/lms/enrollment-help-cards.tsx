'use client';

import { CreditCard, PlayCircle, ScrollText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { VideoEmbed } from '@/components/lms/video-embed';
import type { EnrollmentGuide } from '@/types/lms';

function Card({ icon: Icon, title, text, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger className="rounded-2xl border border-border/80 bg-card p-5 text-left shadow-[var(--shadow-raised)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-pine/45 hover:shadow-[var(--shadow-float)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Icon className="size-5 text-pine" aria-hidden />
        <span className="mt-3 block font-semibold">{title}</span>
        <span className="mt-2 block text-sm text-muted-foreground">{text}</span>
        <span className="mt-3 block text-xs font-semibold text-pine">Open details →</span>
      </DialogTrigger>
      {children}
    </Dialog>
  );
}

export function EnrollmentHelpCards({ guide }: { guide: EnrollmentGuide }) {
  const supportPhoneHref = `tel:${guide.supportPhone.replace(/[^\d+]/g, '')}`;

  return (
    <section className="my-10 grid gap-5 md:grid-cols-3">
      <Card icon={ScrollText} title={guide.guidelinesTitle} text={guide.guidelinesSummary}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{guide.guidelinesTitle}</DialogTitle>
            <DialogDescription>{guide.guidelinesDescription}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 pl-5 text-sm leading-relaxed">
            {guide.guidelines.map((item) => <li key={item} className="list-disc">{item}</li>)}
            <li className="list-disc">
              Still have questions? Call us at{' '}
              <a className="font-semibold text-pine underline" href={supportPhoneHref}>
                {guide.supportPhone}
              </a>.
            </li>
          </ul>
        </DialogContent>
      </Card>

      <Card icon={PlayCircle} title={guide.enrollmentTitle} text={guide.enrollmentSummary}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{guide.enrollmentTitle}</DialogTitle>
            <DialogDescription>{guide.enrollmentDescription}</DialogDescription>
          </DialogHeader>
          {guide.videoUrl ? (
            <VideoEmbed url={guide.videoUrl} title={`${guide.enrollmentTitle} video tutorial`} />
          ) : (
            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              The Content Manager will add the enrollment video tutorial here soon.
            </p>
          )}
          <ol className="space-y-3 pl-5 text-sm">
            {guide.enrollmentSteps.map((step) => (
              <li key={step} className="list-decimal">{step}</li>
            ))}
          </ol>
        </DialogContent>
      </Card>

      <Card icon={CreditCard} title={guide.paymentTitle} text={guide.paymentSummary}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{guide.paymentTitle}</DialogTitle>
            <DialogDescription>{guide.paymentDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {guide.paymentMethods.map((method) => (
              <div key={`${method.name}-${method.accountNumber}`} className="flex justify-between gap-4 rounded-lg bg-muted p-3">
                <span>{method.name}</span>
                <strong>{method.accountNumber}</strong>
              </div>
            ))}
          </div>
        </DialogContent>
      </Card>
    </section>
  );
}
