"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

// CSS for grid background pattern, matching the quizzes page
const gridBgStyle = {
    backgroundSize: '40px 40px',
    backgroundImage: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)',
    backgroundPosition: 'center center'
};

interface SettingsCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
}

export function SettingsCard({
    title,
    description,
    icon,
    children,
}: SettingsCardProps) {
    return (
        <Card>
            <div className="relative bg-primary/5 px-6 py-4 border-b">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="relative flex items-center gap-3">
                    {icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-sm">
                            {icon}
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-xl">{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                </div>
            </div>
            <CardContent className="p-6">{children}</CardContent>
        </Card>
    );
}

export function SettingItem({
    icon,
    title,
    description,
    children,
}: {
    icon?: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg p-4 border">
            <div className="flex items-start gap-3">
                {icon && <div className="mt-0.5 bg-primary/10 p-2 rounded-full">{icon}</div>}
                <div className="space-y-0.5">
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                </div>
            </div>
            <div>{children}</div>
        </div>
    );
} 