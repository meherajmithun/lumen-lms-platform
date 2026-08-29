'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, Newspaper, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotificationItem } from '@/types/lms';

export function NotificationMenu() {
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const initialized = useRef(false);
  const knownIds = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const response = await fetch('/api/notifications', { cache: 'no-store' });
    if (!response.ok) return;
    const body = await response.json() as { data?: NotificationItem[] };
    const next = body.data ?? [];

    if (initialized.current) {
      for (const notification of next) {
        if (knownIds.current.has(notification.documentId)) continue;
        const method = notification.type === 'payment_rejected' ? toast.error : toast.success;
        method(notification.title, { description: notification.message });
      }
    } else {
      initialized.current = true;
    }

    knownIds.current = new Set(next.map((notification) => notification.documentId));
    setRows(next);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const unread = useMemo(() => rows.filter((row) => !row.readAt).length, [rows]);

  function markSeen(open: boolean) {
    if (!open || unread === 0) return;
    const readAt = new Date().toISOString();
    setRows((current) => current.map((row) => ({ ...row, readAt: row.readAt ?? readAt })));
    void fetch('/api/notifications', { method: 'PUT' }).then((response) => {
      if (!response.ok) void load();
    });
  }

  function notificationIcon(notification: NotificationItem) {
    if (notification.type === 'payment_approved') {
      return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pine" aria-hidden />;
    }
    if (notification.type === 'payment_rejected') {
      return <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />;
    }
    return <Newspaper className="mt-0.5 size-4 shrink-0 text-pine" aria-hidden />;
  }

  return (
    <DropdownMenu onOpenChange={markSeen}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative" />}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex size-2 rounded-full bg-destructive" aria-hidden />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unread > 0 && <span className="text-xs font-normal text-muted-foreground">{unread} new</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Bell className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium">No notifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Important updates will appear here.</p>
          </div>
        ) : (
          rows.map((notification) => (
            <DropdownMenuItem
              key={notification.documentId}
              render={<Link href={notification.href} />}
              className="items-start gap-2 py-2.5"
            >
              {notificationIcon(notification)}
              <span className="min-w-0">
                <span className="block font-medium">{notification.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{notification.message}</span>
              </span>
              {!notification.readAt && (
                <span className="mt-1.5 ml-auto size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
