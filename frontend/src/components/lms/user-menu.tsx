'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RoleBadge } from './role-badge';
import { homeFor } from '@/lib/permissions';
import type { SessionUser } from '@/types/lms';

/**
 * The account menu.
 *
 * The trigger shows the person's name, not just an avatar circle: an unlabelled
 * initials bubble gives no clue that sign-out lives behind it, which is exactly
 * how people end up unable to log out.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const initials = user.username.slice(0, 2).toUpperCase() || 'U';
  const firstName = user.username.split(' ')[0] || user.username;

  function signOut() {
    start(async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        toast.error("Couldn't sign you out. Please try again.");
        return;
      }
      toast.success('Signed out');
      router.push('/');
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2 px-1.5" aria-label={`Account menu for ${user.username}`}>
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pine-wash text-[10px] font-semibold text-pine"
            >
              {initials}
            </span>
            <span className="hidden max-w-28 truncate sm:inline">{firstName}</span>
            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        {/* Base UI maps DropdownMenuLabel to Menu.GroupLabel, which throws unless a
            Menu.Group is its parent — hence the wrapper. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium">{user.username}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            <RoleBadge role={user.role} className="mt-2" />
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href={homeFor(user.role)} />}>
          <LayoutDashboard className="size-4" aria-hidden />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account" />}>
          <UserIcon className="size-4" aria-hidden />
          Your profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={signOut} disabled={pending}>
          <LogOut className="size-4" aria-hidden />
          {pending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
