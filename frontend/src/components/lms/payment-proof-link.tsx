import { ImageIcon } from 'lucide-react';

export function PaymentProofLink({ url, name }: { url?: string; name: string }) {
  if (!url) return <span className="text-destructive">No payment picture</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:border-pine/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Payment proof from ${name}`} className="size-16 rounded-md object-cover" />
      <span className="flex items-center gap-1.5 text-sm font-medium text-pine"><ImageIcon className="size-4" aria-hidden /> View payment picture</span>
    </a>
  );
}
