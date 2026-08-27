import { cn } from '@/lib/utils';

type Props = {
  total: number;
  completed: number;
  /** Index of the lesson being viewed, so "you are here" is visible. */
  currentIndex?: number;
  /** Per-lesson completion, when known — otherwise the first `completed` fill. */
  states?: boolean[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
};

/**
 * The spine: one segment per lesson, not a continuous bar.
 *
 * Course progress in this product is genuinely discrete — three lessons of five,
 * not 60% of a continuum — so the control shows the real unit. A filled segment
 * is a finished lesson; the clay segment is where you are now.
 */
export function LessonSpine({
  total,
  completed,
  currentIndex,
  states,
  orientation = 'horizontal',
  className,
  label,
}: Props) {
  if (total <= 0) {
    return (
      <div
        className={cn('h-1.5 w-full rounded-full bg-spine-empty', className)}
        role="img"
        aria-label="No lessons yet"
      />
    );
  }

  const done = states ?? Array.from({ length: total }, (_, i) => i < completed);
  const percent = Math.round((completed / total) * 100);
  const vertical = orientation === 'vertical';

  return (
    <div
      className={cn('flex gap-[3px]', vertical ? 'flex-col h-full w-1.5' : 'flex-row w-full', className)}
      role="img"
      aria-label={label ?? `${completed} of ${total} lessons complete, ${percent}%`}
    >
      {done.map((isDone, i) => (
        <span
          key={i}
          className={cn(
            'block rounded-full transition-colors duration-300',
            vertical ? 'w-1.5 flex-1' : 'h-1.5 flex-1',
            isDone ? 'bg-pine' : 'bg-spine-empty',
            i === currentIndex && !isDone && 'bg-clay',
            i === currentIndex && isDone && 'bg-pine-strong'
          )}
        />
      ))}
    </div>
  );
}

/** The spine plus its reading, for cards and headers. */
export function ProgressReadout({
  completed,
  total,
  currentIndex,
  states,
  className,
}: Omit<Props, 'orientation' | 'label'>) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className={cn('space-y-1.5', className)}>
      <LessonSpine total={total} completed={completed} currentIndex={currentIndex} states={states} />
      <p className="text-xs text-muted-foreground tabular">
        {total === 0 ? (
          'No lessons yet'
        ) : (
          <>
            <span className="font-medium text-foreground">
              {completed} of {total}
            </span>{' '}
            lessons · {percent}%
          </>
        )}
      </p>
    </div>
  );
}
