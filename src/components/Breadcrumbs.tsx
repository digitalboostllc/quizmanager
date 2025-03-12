'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        href="/settings"
        className="hover:text-foreground transition-colors"
      >
        Settings
      </Link>
      {segments.length > 1 && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground capitalize">
            {segments[1].replace(/-/g, ' ')}
          </span>
        </>
      )}
    </nav>
  );
} 