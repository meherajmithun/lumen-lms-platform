import { cn } from '@/lib/utils';
import { ROLE_LABELS, type Role } from '@/types/lms';

/**
 * Colour never carries the meaning alone — the role is always spelled out, so
 * the badge stays readable without colour vision.
 */
const TONES: Record<Role, string> = {
  admin: 'bg-destructive/10 text-destructive',
  content_manager: 'bg-chart-5/15 text-chart-5',
  instructor: 'bg-clay-wash text-clay',
  student: 'bg-pine-wash text-pine',
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
