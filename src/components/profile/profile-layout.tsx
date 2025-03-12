'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Home, KeyRound, Loader2, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

// ======================================================================
// TEMPORARY: AUTHENTICATION DISABLED FOR DEVELOPMENT
// This should match the setting in middleware.ts and useAuth.ts
// ======================================================================
const DISABLE_AUTH = true;

interface ProfileLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
}

export function ProfileLayout({ children, title, description }: ProfileLayoutProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Skip authentication check if auth is disabled
    if (!DISABLE_AUTH) {
        // Redirect to login if not authenticated
        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/auth/login');
            }
        }, [isLoading, isAuthenticated, router]);

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
    }

    const navItems = [
        {
            href: '/profile',
            label: 'Profile Overview',
            icon: <User className="h-4 w-4 mr-2" />,
            active: pathname === '/profile'
        },
        {
            href: '/profile/edit',
            label: 'Edit Profile',
            icon: <Settings className="h-4 w-4 mr-2" />,
            active: pathname === '/profile/edit'
        },
        {
            href: '/profile/change-password',
            label: 'Change Password',
            icon: <KeyRound className="h-4 w-4 mr-2" />,
            active: pathname === '/profile/change-password'
        }
    ];

    return (
        <div className="container py-10">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Link href="/" className="hover:text-foreground transition-colors">
                    <Home className="h-3.5 w-3.5 inline-block mr-1" />
                    Home
                </Link>
                <span className="mx-2">/</span>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                    Profile
                </Link>
                {pathname !== '/profile' && (
                    <>
                        <span className="mx-2">/</span>
                        <span className="text-foreground">
                            {pathname === '/profile/edit' ? 'Edit' : 'Change Password'}
                        </span>
                    </>
                )}
            </div>

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
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