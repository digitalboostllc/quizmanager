'use client';

import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    Bug,
    Calendar,
    ClipboardList,
    Cog,
    Facebook,
    Home,
    PanelLeft,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

// CSS for grid background pattern, matching the quizzes page
const gridBgStyle = {
    backgroundSize: '40px 40px',
    backgroundImage: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)',
    backgroundPosition: 'center center'
};

type NavItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    badge?: string;
};

const navItems: NavItem[] = [
    {
        href: '/dashboard/settings',
        label: 'General',
        icon: <Cog className="h-5 w-5" />,
        description: 'Customize your account settings and preferences',
        badge: 'General Settings'
    },
    {
        href: '/dashboard/settings/facebook',
        label: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        description: 'Connect and manage your Facebook integration',
        badge: 'Integration'
    },
    {
        href: '/dashboard/settings/calendar',
        label: 'Calendar',
        icon: <Calendar className="h-5 w-5" />,
        description: 'Configure your calendar preferences',
        badge: 'Schedule'
    },
    {
        href: '/dashboard/settings/auto-schedule',
        label: 'Auto-Schedule',
        icon: <ClipboardList className="h-5 w-5" />,
        description: 'Set up automatic scheduling for your quizzes',
        badge: 'Automation'
    },
    {
        href: '/dashboard/settings/notifications',
        label: 'Notifications',
        icon: <Bell className="h-5 w-5" />,
        description: 'Manage your notification preferences',
        badge: 'Alerts'
    },
];

// Only show debug in development
if (process.env.NODE_ENV === 'development') {
    navItems.push({
        href: '/dashboard/settings/debug',
        label: 'Debug',
        icon: <Bug className="h-5 w-5" />,
        description: 'Developer tools and debug information',
        badge: 'Developer'
    });
}

// Function to extract section name from pathname
function getSectionName(pathname: string): string {
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];

    // If we're on the main settings page
    if (lastPart === 'settings') {
        return 'General';
    }

    // Otherwise capitalize the section name
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const sectionName = getSectionName(pathname);
    const [activeSection, setActiveSection] = useState(sectionName);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Set mounted state after component mounts to prevent hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    // Find the current active section details
    const activeNavItem = navItems.find(item =>
        item.href === pathname ||
        (pathname.includes(item.href) && item.href !== '/dashboard/settings') ||
        (pathname === '/dashboard/settings' && item.label === 'General')
    );

    if (!mounted) {
        return <div className="animate-pulse min-h-screen bg-background/40"></div>;
    }

    return (
        <div>
            {/* Mobile Navigation Toggle */}
            <div className="flex items-center justify-between mb-6 md:hidden">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                        <Home className="h-4 w-4" />
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium">Settings</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMobileNav(!showMobileNav)}
                    className="relative"
                    aria-label="Toggle settings navigation"
                >
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation</span>
                </Button>
            </div>

            {/* Header with grid background pattern, matching quizzes page */}
            <div className="relative rounded-xl overflow-hidden mb-8 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col justify-between gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                                {activeNavItem?.badge && (
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-1">
                                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                        {activeNavItem.badge}
                                    </div>
                                )}
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                    {sectionName}
                                </h1>
                                <p className="text-base text-muted-foreground">
                                    {activeNavItem?.description || `Manage your ${sectionName.toLowerCase()} settings and preferences`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Settings Navigation - Sidebar on desktop, slide-in on mobile */}
                <AnimatePresence>
                    {(showMobileNav || !pathname.includes('/mobile')) && (
                        <motion.div
                            className={`${showMobileNav ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:static md:z-auto md:bg-transparent md:backdrop-blur-none' : 'hidden md:block'}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.div
                                className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-background p-6 shadow-lg md:static md:inset-auto md:w-auto md:max-w-none md:bg-transparent md:p-0 md:shadow-none ${showMobileNav ? 'block' : 'hidden md:block'}`}
                                initial={{ x: -100, opacity: 0.5 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -100, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="md:hidden flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-medium">Settings</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowMobileNav(false)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <PanelLeft className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (pathname.startsWith(item.href) && item.href !== '/dashboard/settings') ||
                                            (pathname === '/dashboard/settings' && item.label === 'General');

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setShowMobileNav(false)}
                                                className={`group flex items-start gap-3 rounded-lg p-3 transition-all ${isActive
                                                    ? 'bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm'
                                                    : 'hover:bg-muted/50'
                                                    }`}
                                            >
                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-foreground'
                                                    }`}>
                                                    {item.icon}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className={`text-base font-medium leading-none ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                        {item.label}
                                                    </div>
                                                    <div className="line-clamp-2 text-sm text-muted-foreground">
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="md:col-span-3">
                    {children}
                </div>
            </div>
        </div>
    );
} 