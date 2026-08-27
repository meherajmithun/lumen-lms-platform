'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EnrollmentApplication } from '@/types/lms';

const STORAGE_KEY = 'lumen:seen-enrollment-notifications';
const signature = (row: EnrollmentApplication) => `${row.documentId}:${row.status}`;

export function NotificationMenu() {
  const [rows, setRows] = useState<EnrollmentApplication[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const previous = useRef<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    const response = await fetch('/api/notifications', { cache: 'no-store' });
    if (!response.ok) return;
    const body = await response.json() as { data?: EnrollmentApplication[] };
    const next = body.data ?? [];
    for (const row of next) {
      const oldStatus = previous.current.get(row.documentId);
      if (oldStatus === 'pending' && row.status !== 'pending') {
        toast[row.status === 'approved' ? 'success' : 'error'](
          `Enrollment ${row.status}`,
          { description: row.courseSummary.map((course) => course.title).join(', ') }
        );
      }
    }
    previous.current = new Map(next.map((row) => [row.documentId, row.status]));
    setRows(next);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      try { setSeen(new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[])); } catch { /* ignore invalid storage */ }
      void load();
    }, 0);
    const timer = window.setInterval(() => void load(), 10_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  const decisions = useMemo(() => rows.filter((row) => row.status !== 'pending'), [rows]);
  const unread = decisions.filter((row) => !seen.has(signature(row))).length;

  function markSeen(open: boolean) {
    if (!open) return;
    const next = new Set(seen);
    decisions.forEach((row) => next.add(signature(row)));
    setSeen(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }

  if (rows.length === 0) {
    return <Button variant="ghost" size="icon-sm" aria-label="Notifications"><Bell className="size-4" aria-hidden /></Button>;
  }

  return (
    <DropdownMenu onOpenChange={markSeen}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative" />}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-destructive" aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup><DropdownMenuLabel>Notifications</DropdownMenuLabel></DropdownMenuGroup>
        {rows.map((row) => (
          <DropdownMenuItem key={row.documentId} disabled className="items-start gap-2 py-2.5 opacity-100">
            {row.status === 'approved' ? <CheckCircle2 className="mt-0.5 text-pine" /> : row.status === 'rejected' ? <XCircle className="mt-0.5 text-destructive" /> : <Bell className="mt-0.5 text-muted-foreground" />}
            <span className="min-w-0">
              <span className="block font-medium capitalize">Enrollment {row.status}</span>
              <span className="block truncate text-xs text-muted-foreground">{row.courseSummary.map((course) => course.title).join(', ')}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
