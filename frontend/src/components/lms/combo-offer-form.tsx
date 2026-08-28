'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { saveComboOfferAction } from '@/app/actions/admin';
import type { ComboOffer } from '@/types/lms';

export function ComboOfferForm({ offer }: { offer: ComboOffer }) {
  const [active, setActive] = useState(offer.isActive);
  const [pending, start] = useTransition();
  const tierText = offer.tiers.map((tier) => `${tier.courseCount}:${tier.discountAmount}`).join('\n');
  return (
    <form className="mb-6 rounded-xl border bg-card p-5" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const tiers = String(form.get('tiers') ?? '').split(/\r?\n/).map((line) => {
        const [courseCount, discountAmount] = line.split(':').map(Number);
        return { courseCount, discountAmount };
      });
      start(async () => {
        const result = await saveComboOfferAction({ title: String(form.get('title')), description: String(form.get('description')), tiers, loyaltyDiscount: Number(form.get('loyaltyDiscount')), isActive: active });
        if (result.ok) toast.success('Combo offer updated'); else toast.error(result.error);
      });
    }}>
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Combo discount</h2><p className="mt-1 text-xs text-muted-foreground">Only Content Managers can change these public discount tiers.</p></div><Switch checked={active} onCheckedChange={setActive} aria-label="Enable combo offer" /></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="combo-title">Offer title</Label><Input id="combo-title" name="title" defaultValue={offer.title} required /></div><div className="space-y-2"><Label htmlFor="loyalty-discount">Loyalty discount (BDT)</Label><Input id="loyalty-discount" name="loyaltyDiscount" type="number" min="0" defaultValue={offer.loyaltyDiscount} required /></div><div className="space-y-2"><Label htmlFor="combo-tiers">Tiers: courses:discount</Label><Textarea id="combo-tiers" name="tiers" defaultValue={tierText} rows={3} placeholder={'2:500\n3:1000'} required /></div></div>
      <div className="mt-4 space-y-2"><Label htmlFor="combo-description">Description</Label><Textarea id="combo-description" name="description" defaultValue={offer.description} rows={2} required /></div>
      <Button className="mt-4" disabled={pending}>{pending ? 'Saving…' : 'Save combo offer'}</Button>
    </form>
  );
}
