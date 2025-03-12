'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FacebookTestPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Facebook Test Page</h2>
                <p className="text-muted-foreground">
                    This is a test page to debug navigation issues
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Navigation Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">This is a simple test page to verify if the navigation is working correctly.</p>
                    <p className="mb-4">Current path should be: /settings/facebook/test-page</p>
                    <Button onClick={() => {
                        console.log('Current pathname:', window.location.pathname);
                        alert('Current pathname: ' + window.location.pathname);
                    }}>
                        Show Current Path
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 