'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function FacebookSettingsLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-5 w-96" />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <div className="flex justify-between items-center mt-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                        <div className="space-y-4 pt-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <div className="flex justify-end space-x-2 pt-4">
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 