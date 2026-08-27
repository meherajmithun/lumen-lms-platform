'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * No mounted-state guard here.
 *
 * The usual pattern reads resolvedTheme during render, which is unknown on the
 * server and so needs an effect to avoid a hydration mismatch. Instead both icons
 * are rendered and CSS picks one, which is correct on the first paint with no
 * state at all. resolvedTheme is only read inside the click handler, by which
 * point we are certainly on the client.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Switch between light and dark theme"
    >
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="hidden size-4 dark:block" aria-hidden />
    </Button>
  );
}
