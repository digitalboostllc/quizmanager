'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Simple Settings Page</h1>
                <p className="text-base text-muted-foreground">
                    A simplified page for debugging
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-medium">Debug Information</CardTitle>
                </CardHeader>
                <CardContent className="text-base">
                    <p>This is a simple settings page without any loading or hooks.</p>
                    <p className="mt-2">If this page loads but the others don't, the issue might be with the hooks or data fetching.</p>
                    <div className="mt-4 text-sm">
                        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                        <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 