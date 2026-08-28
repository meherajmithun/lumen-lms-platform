import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  variant = 'dashboard',
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'dashboard' | 'marketing';
  align?: 'left' | 'center';
  className?: string;
}) {
  const centered = align === 'center';

  return (
    <header
      className={cn(
        'flex flex-col gap-5',
        variant === 'marketing' ? 'mb-10 sm:mb-12' : 'mb-8 sm:flex-row sm:items-end sm:justify-between',
        centered && 'items-center text-center',
        className
      )}
    >
      <div className={cn('min-w-0', centered && 'mx-auto max-w-3xl')}>
        {eyebrow && (
          <p
            className={cn(
              'font-semibold uppercase text-pine',
              variant === 'marketing'
                ? 'mb-3 text-[0.7rem] tracking-[0.2em]'
                : 'mb-1.5 text-xs tracking-[0.12em]'
            )}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            'text-balance',
            variant === 'marketing'
              ? 'font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.06] tracking-[-0.045em]'
              : 'font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl'
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              'text-muted-foreground',
              variant === 'marketing'
                ? 'mt-4 max-w-2xl text-base leading-7 sm:text-lg'
                : 'mt-2 max-w-2xl text-sm leading-6'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
    </header>
  );
}
