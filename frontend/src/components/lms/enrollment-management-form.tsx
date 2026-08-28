'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ListChecks, PlayCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveEnrollmentGuideAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EnrollmentGuide, EnrollmentPaymentMethod } from '@/types/lms';

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function methods(value: FormDataEntryValue | null): EnrollmentPaymentMethod[] {
  return lines(value).flatMap((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) return [];
    const name = line.slice(0, separator).trim();
    const accountNumber = line.slice(separator + 1).trim();
    return name && accountNumber ? [{ name, accountNumber }] : [];
  });
}

function Field({
  id,
  label,
  defaultValue,
  type = 'text',
  required = true,
}: {
  id: string;
  label: string;
  defaultValue: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}

export function EnrollmentManagementForm({ guide }: { guide: EnrollmentGuide }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const paymentMethods = guide.paymentMethods
    .map((method) => `${method.name}: ${method.accountNumber}`)
    .join('\n');

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextGuide: EnrollmentGuide = {
          guidelinesTitle: String(form.get('guidelinesTitle') ?? '').trim(),
          guidelinesSummary: String(form.get('guidelinesSummary') ?? '').trim(),
          guidelinesDescription: String(form.get('guidelinesDescription') ?? '').trim(),
          guidelines: lines(form.get('guidelines')),
          supportPhone: String(form.get('supportPhone') ?? '').trim(),
          enrollmentTitle: String(form.get('enrollmentTitle') ?? '').trim(),
          enrollmentSummary: String(form.get('enrollmentSummary') ?? '').trim(),
          enrollmentDescription: String(form.get('enrollmentDescription') ?? '').trim(),
          enrollmentSteps: lines(form.get('enrollmentSteps')),
          videoUrl: String(form.get('videoUrl') ?? '').trim(),
          paymentTitle: String(form.get('paymentTitle') ?? '').trim(),
          paymentSummary: String(form.get('paymentSummary') ?? '').trim(),
          paymentDescription: String(form.get('paymentDescription') ?? '').trim(),
          paymentMethods: methods(form.get('paymentMethods')),
        };

        startTransition(async () => {
          const result = await saveEnrollmentGuideAction(nextGuide);
          if (result.ok) {
            toast.success('Enrollment content updated');
            router.refresh();
          } else toast.error(result.error);
        });
      }}
    >
      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-raised)] sm:p-6">
        <div className="flex items-start gap-3 border-b border-border/80 pb-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pine-wash text-pine">
            <ListChecks className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-0.02em]">Enrollment guidelines</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controls the first enrollment help card and its detailed checklist.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="guidelinesTitle" label="Card title" defaultValue={guide.guidelinesTitle} />
          <Field id="supportPhone" label="Support phone" defaultValue={guide.supportPhone} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="guidelinesSummary">Card summary</Label>
            <Textarea id="guidelinesSummary" name="guidelinesSummary" defaultValue={guide.guidelinesSummary} rows={2} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="guidelinesDescription">Details introduction</Label>
            <Textarea id="guidelinesDescription" name="guidelinesDescription" defaultValue={guide.guidelinesDescription} rows={2} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="guidelines">Guidelines — one item per line</Label>
            <Textarea id="guidelines" name="guidelines" defaultValue={guide.guidelines.join('\n')} rows={9} required />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-raised)] sm:p-6">
        <div className="flex items-start gap-3 border-b border-border/80 pb-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pine-wash text-pine">
            <PlayCircle className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-0.02em]">How to enroll</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controls the walkthrough card, video, and ordered enrollment steps.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="enrollmentTitle" label="Card title" defaultValue={guide.enrollmentTitle} />
          <Field id="videoUrl" label="Embeddable video URL" defaultValue={guide.videoUrl} type="url" required={false} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="enrollmentSummary">Card summary</Label>
            <Textarea id="enrollmentSummary" name="enrollmentSummary" defaultValue={guide.enrollmentSummary} rows={2} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="enrollmentDescription">Details introduction</Label>
            <Textarea id="enrollmentDescription" name="enrollmentDescription" defaultValue={guide.enrollmentDescription} rows={2} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="enrollmentSteps">Walkthrough steps — one item per line</Label>
            <Textarea id="enrollmentSteps" name="enrollmentSteps" defaultValue={guide.enrollmentSteps.join('\n')} rows={6} required />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-raised)] sm:p-6">
        <div className="flex items-start gap-3 border-b border-border/80 pb-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pine-wash text-pine">
            <CreditCard className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-0.02em]">Payment methods</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controls the payment card and the account details students see.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="paymentTitle" label="Card title" defaultValue={guide.paymentTitle} />
          <div className="space-y-2">
            <Label htmlFor="paymentMethods">Methods — name: account number</Label>
            <Textarea id="paymentMethods" name="paymentMethods" defaultValue={paymentMethods} rows={4} placeholder="bKash: 01XXXXXXXXXX" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="paymentSummary">Card summary</Label>
            <Textarea id="paymentSummary" name="paymentSummary" defaultValue={guide.paymentSummary} rows={2} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="paymentDescription">Details introduction</Label>
            <Textarea id="paymentDescription" name="paymentDescription" defaultValue={guide.paymentDescription} rows={2} required />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          <Save className="size-4" aria-hidden />
          {pending ? 'Saving enrollment content…' : 'Save enrollment content'}
        </Button>
      </div>
    </form>
  );
}
