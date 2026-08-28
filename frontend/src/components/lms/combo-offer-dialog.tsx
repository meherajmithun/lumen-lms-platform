'use client';

import { Gift, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCoursePrice } from '@/lib/course-pricing';
import type { ComboOffer } from '@/types/lms';

export function ComboOfferDialog({ offer }: { offer: ComboOffer }) {
  if (!offer.isActive || offer.tiers.length === 0) return null;
  const maximum = Math.max(...offer.tiers.map((tier) => tier.discountAmount));
  return (
    <Dialog>
      <div className="space-y-1 border-t border-border pt-4">
        <DialogTrigger render={<Button variant="ghost" className="h-auto w-full justify-start px-0 py-1 text-sm text-pine" />}>
          <Gift className="size-4" aria-hidden /> Save up to {formatCoursePrice(maximum)} with a combo →
        </DialogTrigger>
        <DialogTrigger render={<Button variant="ghost" className="h-auto w-full justify-start px-0 py-1 text-sm text-clay" />}>
          <Percent className="size-4" aria-hidden /> View all discounts →
        </DialogTrigger>
      </div>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-pine">{offer.title}</DialogTitle>
          <DialogDescription className="text-left text-base leading-relaxed">{offer.description}</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="px-4 py-3">Number of courses</th><th className="px-4 py-3">Discount</th></tr></thead>
            <tbody className="divide-y divide-border">
              <tr><td className="px-4 py-3">1 course</td><td className="px-4 py-3 font-semibold text-pine">BDT 0</td></tr>
              {offer.tiers.map((tier) => <tr key={tier.courseCount}><td className="px-4 py-3">{tier.courseCount} courses</td><td className="px-4 py-3 font-semibold text-pine">{formatCoursePrice(tier.discountAmount)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
