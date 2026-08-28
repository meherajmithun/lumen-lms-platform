'use client';

import { useState } from 'react';
import { ChevronRight, Gift, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCoursePrice } from '@/lib/course-pricing';
import type { ComboOffer } from '@/types/lms';

export function ComboOfferDialog({ offer }: { offer: ComboOffer }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'combo' | 'loyalty'>('combo');
  const [showLoyalty, setShowLoyalty] = useState(false);
  if (!offer.isActive || offer.tiers.length === 0) return null;
  const maximum = Math.max(...offer.tiers.map((tier) => tier.discountAmount));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-1 border-t border-border pt-4">
        <Button variant="ghost" className="h-auto w-full justify-start px-0 py-1 text-sm text-pine" onClick={() => { setView('combo'); setOpen(true); }}>
          <Gift className="size-4" aria-hidden /> Save up to {formatCoursePrice(maximum)} with a combo →
        </Button>
        <Button variant="ghost" className="h-auto w-full justify-start px-0 py-1 text-sm text-clay" onClick={() => { setView('loyalty'); setShowLoyalty(false); setOpen(true); }}>
          <Percent className="size-4" aria-hidden /> View all discounts →
        </Button>
      </div>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {view === 'combo' ? (
          <>
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
          </>
        ) : offer.loyaltyDiscount > 0 ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl text-pine">Loyalty Discount</DialogTitle>
              <DialogDescription className="text-left">A special saving for returning Lumen students.</DialogDescription>
            </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start gap-2 px-4 py-3 text-left text-sm"
              aria-expanded={showLoyalty}
              onClick={() => setShowLoyalty((value) => !value)}
            >
              <span className="size-1.5 rounded-full bg-pine" aria-hidden />
              <span className="font-semibold text-pine">{formatCoursePrice(offer.loyaltyDiscount)}</span>
              <span className="text-muted-foreground">for Loyal Students</span>
              <ChevronRight className={`ml-auto size-4 transition-transform ${showLoyalty ? 'rotate-90' : ''}`} aria-hidden />
            </Button>
            {showLoyalty && (
              <div className="border-t border-border px-4 py-4 text-sm leading-relaxed">
                <h3 className="font-semibold">How It Works</h3>
                <p className="mt-2 text-muted-foreground">
                  If you are already enrolled in any of our courses, you will receive a loyalty discount of{' '}
                  <strong className="text-pine">{formatCoursePrice(offer.loyaltyDiscount)}</strong> on your next enrollment.
                </p>
              </div>
            )}
          </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
