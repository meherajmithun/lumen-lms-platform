'use client';

import { CreditCard, PlayCircle, ScrollText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const guidelines = [
  'Make sure you are logged in to the email account where you would like to receive access to the course materials.',
  'Fill out the enrollment form using your correct information.',
  'Select the course you wish to enroll in.',
  'Choose your preferred payment method. Currently, we accept bKash, Nagad, and Rocket.',
  'Complete the payment using the instructions and payment number provided in the enrollment form.',
  'After making the payment, collect your Transaction ID and enter it correctly in the form.',
  'Review your information carefully and submit the enrollment form.',
  'Once confirmed, you will receive access to the course materials. Confirmation may take up to 48 hours.',
  'If you have questions or need assistance, contact us at any time.',
];

function Card({ icon: Icon, title, text, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-pine/50 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Icon className="size-5 text-pine" aria-hidden />
        <span className="mt-3 block font-semibold">{title}</span>
        <span className="mt-2 block text-sm text-muted-foreground">{text}</span>
        <span className="mt-3 block text-xs font-semibold text-pine">Open details →</span>
      </DialogTrigger>
      {children}
    </Dialog>
  );
}

export function EnrollmentHelpCards({ videoUrl }: { videoUrl?: string }) {
  return (
    <section className="my-10 grid gap-5 md:grid-cols-3">
      <Card icon={ScrollText} title="Enrollment guidelines" text="Select courses, pay the exact calculated total, and submit one application.">
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>How to Enroll</DialogTitle><DialogDescription>Follow these steps carefully.</DialogDescription></DialogHeader>
          <ul className="space-y-3 pl-5 text-sm leading-relaxed">
            {guidelines.map((item) => <li key={item} className="list-disc">{item}</li>)}
            <li className="list-disc">Still have questions? Call us at{' '}
              <a className="font-semibold text-pine underline" href="tel:+8801996546509">01XXXXXXXXXX</a>.
            </li>
            <li className="list-disc">Thank you for choosing us. We look forward to having you in our course!</li>
          </ul>
        </DialogContent>
      </Card>

      <Card icon={PlayCircle} title="How to enroll" text="Open the step-by-step enrollment walkthrough.">
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>How to enroll</DialogTitle><DialogDescription>Course selection and payment walkthrough.</DialogDescription></DialogHeader>
          {videoUrl ? <iframe src={videoUrl} title="How to enroll video tutorial" className="aspect-video w-full rounded-lg border" allowFullScreen /> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">The Content Manager will add the payment video tutorial here soon.</p>}
          <ol className="space-y-3 pl-5 text-sm"><li className="list-decimal">Select one or more courses.</li><li className="list-decimal">Pay the calculated total.</li><li className="list-decimal">Enter the transaction ID and submit.</li><li className="list-decimal">Wait up to 48 hours for Content Manager approval.</li></ol>
        </DialogContent>
      </Card>

      <Card icon={CreditCard} title="Payment methods" text="bKash, Rocket, or Nagad: 01XXXXXXXXXX (personal account).">
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Payment methods</DialogTitle><DialogDescription>Send Money or Cash In using a personal account.</DialogDescription></DialogHeader>
          <div className="space-y-3 text-sm">{['bKash', 'Rocket', 'Nagad'].map(method => <div key={method} className="flex justify-between rounded-lg bg-muted p-3"><span>{method}</span><strong>01XXXXXXXXXX</strong></div>)}</div>
        </DialogContent>
      </Card>
    </section>
  );
}
