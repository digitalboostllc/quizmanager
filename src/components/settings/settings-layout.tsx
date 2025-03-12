'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SettingsLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
}

export function SettingsLayout({ children, title, description }: SettingsLayoutProps) {
    const pathname = usePathname() || '';

    // Extract section name for breadcrumb
    const getSectionName = () => {
        if (pathname === '/settings') return null;
        const section = pathname.split('/').pop();
        if (!section) return null;
        return section.charAt(0).toUpperCase() + section.slice(1);
    }

    const sectionName = getSectionName();

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                    Application Preferences
                </div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>

            {/* Main Content */}
            <div>
                {children}
            </div>
        </div>
    );
} 