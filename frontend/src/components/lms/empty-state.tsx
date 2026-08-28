import { cn } from '@/lib/utils';

/** An empty screen is an invitation to act, so it always names the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center shadow-[var(--shadow-raised)]',
        className
      )}
    >
      {Icon && <Icon className="mb-3 size-7 text-muted-foreground" />}
      <p className="font-display text-xl font-bold tracking-[-0.025em]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
