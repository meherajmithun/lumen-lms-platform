import type { LearningHistory } from '@/types/lms';

function duration(seconds: number) {
  if (seconds <= 0) return '0 min';
  if (seconds < 60) return '<1 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function LearningConsistencyChart({ history }: { history: LearningHistory }) {
  const max = Math.max(1, ...history.data.map((day) => day.activeSeconds));
  const ticks = [max, Math.round(max / 2), 0];
  const formatDate = (date: string, long = false) => new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: long ? 'long' : 'short', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

  return (
    <section className="mb-10 rounded-xl border border-border bg-card p-5" aria-labelledby="consistency-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-pine">Consistency</p>
          <h2 id="consistency-title" className="mt-1 font-heading text-lg font-semibold tracking-tight">
            Learning time
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Active reading and video time over the last 14 days.</p>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          <span className="block font-heading text-2xl font-semibold text-foreground tabular">
            {duration(history.summary.totalSeconds)}
          </span>
          total learning time
        </p>
      </div>

      <div className="mt-6 grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2">
        <div className="relative h-40 text-[10px] text-muted-foreground" aria-hidden>
          {ticks.map((tick, index) => <span key={`${tick}-${index}`} className="absolute right-0 -translate-y-1/2 tabular" style={{ top: `${index * 50}%` }}>{duration(tick)}</span>)}
        </div>
        <div className="relative h-40 border-b border-border" role="list" aria-label="Daily learning time">
          {ticks.map((tick, index) => <div key={`${tick}-${index}`} aria-hidden className="absolute inset-x-0 border-t border-border/70" style={{ top: `${index * 50}%` }} />)}
          <div className="absolute inset-0 grid grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1.5 px-1 sm:gap-2">
            {history.data.map((day) => {
              const height = day.activeSeconds === 0 ? 3 : Math.max(8, (day.activeSeconds / max) * 100);
              const label = `${formatDate(day.date, true)}: ${duration(day.activeSeconds)} of active learning`;
              return <div key={day.date} className="group flex h-full min-w-0 flex-col justify-end" role="listitem"><div tabIndex={0} aria-label={label} title={label} className="relative w-full rounded-t-sm bg-pine/75 outline-none transition-colors hover:bg-pine focus-visible:ring-2 focus-visible:ring-ring" style={{ height: `${height}%` }} /></div>;
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 ml-[4.25rem] grid grid-cols-[repeat(14,minmax(0,1fr))] text-[10px] text-muted-foreground">
        {history.data.map((day, index) => (
          <span key={day.date} className={index % 2 === 0 ? 'text-center' : 'hidden text-center sm:block'}>
            {formatDate(day.date)}
          </span>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
        <div><dt className="text-xs text-muted-foreground">Active days</dt><dd className="mt-1 font-semibold tabular">{history.summary.activeDays}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Current streak</dt><dd className="mt-1 font-semibold tabular">{history.summary.currentStreak} days</dd></div>
        <div><dt className="text-xs text-muted-foreground">Longest streak</dt><dd className="mt-1 font-semibold tabular">{history.summary.longestStreak} days</dd></div>
      </dl>
    </section>
  );
}
