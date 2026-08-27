'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Immediate feedback while a server-rendered destination is loading. */
export function NavigationIndicator() {
  const pathname = usePathname();
  const [destinationPath, setDestinationPath] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      setDestinationPath(destination.pathname);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!destinationPath || destinationPath === pathname) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-pine-wash" role="progressbar" aria-label="Loading page">
      <div className="h-full w-1/2 animate-pulse rounded-full bg-pine" />
    </div>
  );
}
