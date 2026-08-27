'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DashboardNav } from './dashboard-nav';
import { RoleBadge } from './role-badge';
import { ThemeToggle } from './theme-toggle';
import { SignOutButton } from './sign-out-button';
import type { SessionUser } from '@/types/lms';

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = user.username.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
          <Link href="/" className="mb-6 flex items-center gap-2 px-3 font-heading text-sm font-semibold">
            <GraduationCap className="size-5 text-pine" aria-hidden />
            Lumen
          </Link>
          <DashboardNav role={user.role} />
          <div className="mt-auto space-y-3 pt-4">
            <div className="flex items-center gap-2 px-3">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pine-wash text-[10px] font-semibold text-pine"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.username}</p>
                <RoleBadge role={user.role} className="mt-1" />
              </div>
            </div>
            <SignOutButton variant="ghost" className="w-full justify-start px-3" />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
                    <Menu className="size-4" aria-hidden />
                  </Button>
                }
              />
              <SheetContent side="left" className="flex w-64 flex-col p-4">
                <SheetTitle className="mb-5 flex items-center gap-2 font-heading text-sm font-semibold">
                  <GraduationCap className="size-5 text-pine" aria-hidden />
                  Lumen
                </SheetTitle>
                <DashboardNav role={user.role} onNavigate={() => setOpen(false)} />
                <div className="mt-auto space-y-3 pt-4">
                  <div className="flex items-center gap-2 px-3">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pine-wash text-[10px] font-semibold text-pine"
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.username}</p>
                      <RoleBadge role={user.role} className="mt-1" />
                    </div>
                  </div>
                  <SignOutButton variant="ghost" className="w-full justify-start px-3" />
                </div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
