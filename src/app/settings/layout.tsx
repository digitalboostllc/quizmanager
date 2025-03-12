'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Bug, Calendar, Clock, Facebook, Home, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  // DEVELOPMENT: Skip auth check and redirect if DISABLE_AUTH is set in useAuth
  // This will be handled automatically by the modified useAuth hook
  // No changes needed to the rest of the code

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // For debugging: log the current pathname whenever it changes
  useEffect(() => {
    console.log('Settings Layout - Current pathname:', pathname);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // A simpler path check for settings pages
  const navItems = [
    {
      href: '/settings',
      label: 'General Settings',
      icon: <Settings className="h-4 w-4 mr-2" />,
      active: pathname === '/settings'
    },
    {
      href: '/settings/facebook',
      label: 'Facebook',
      icon: <Facebook className="h-4 w-4 mr-2" />,
      active: pathname.includes('/settings/facebook')
    },
    {
      href: '/settings/calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4 mr-2" />,
      active: pathname.includes('/settings/calendar')
    },
    {
      href: '/settings/auto-schedule',
      label: 'Auto Schedule',
      icon: <Clock className="h-4 w-4 mr-2" />,
      active: pathname.includes('/settings/auto-schedule')
    },
    {
      href: '/settings/notifications',
      label: 'Notifications',
      icon: <Bell className="h-4 w-4 mr-2" />,
      active: pathname.includes('/settings/notifications')
    },
  ];

  // Add debug section only in development
  if (typeof window !== 'undefined' &&
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development') {
    navItems.push({
      href: '/settings/debug',
      label: 'Debug',
      icon: <Bug className="h-4 w-4 mr-2" />,
      active: pathname.includes('/settings/debug')
    });
  }

  // Extract section name for breadcrumb
  const getSectionName = () => {
    if (pathname === '/settings') return null;
    const section = pathname.split('/').pop();
    if (!section) return null;
    return section.charAt(0).toUpperCase() + section.slice(1);
  }

  const sectionName = getSectionName();

  return (
    <div className="container py-10">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5 inline-block mr-1" />
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/settings" className="hover:text-foreground transition-colors">
          Settings
        </Link>
        {sectionName && (
          <>
            <span className="mx-2">/</span>
            <span className="text-foreground capitalize">
              {sectionName}
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm overflow-hidden">
            <div className="p-2">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={item.active ? "secondary" : "ghost"}
                    className={`w-full justify-start ${item.active ? 'font-medium' : ''}`}
                    asChild
                  >
                    <Link href={item.href}>
                      {item.icon}
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
} 