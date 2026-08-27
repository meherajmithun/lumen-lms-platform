import { Users } from 'lucide-react';
import { EmptyState } from './empty-state';
import { LessonSpine } from './lesson-spine';
import type { StudentProgressRow } from '@/types/lms';

/**
 * "View student progress" from the permission matrix. An instructor sees this
 * only for courses they own — Strapi's owns-course policy decides that, not this
 * component.
 */
export function StudentRoster({ rows }: { rows: StudentProgressRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nobody has enrolled yet"
        description="Once students enroll, their progress through your lessons shows up here."
      />
    );
  }

  const sorted = rows.slice().sort((a, b) => b.percent - a.percent);

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {sorted.map((row) => (
        <li key={row.student.id} className="flex items-center gap-4 px-4 py-3.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pine-wash text-[11px] font-semibold text-pine">
            {row.student.username.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{row.student.username}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.student.email}</span>
          </span>
          <span className="hidden w-32 shrink-0 sm:block">
            <LessonSpine total={row.total} completed={row.completed} />
          </span>
          <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular">
            <span className="font-medium text-foreground">
              {row.completed}/{row.total}
            </span>{' '}
            · {row.percent}%
          </span>
        </li>
      ))}
    </ul>
  );
}
