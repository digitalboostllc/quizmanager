'use client';

import { SettingsLayout } from "@/components/settings/settings-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
    const SkeletonItem = () => (
        <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
        </div>
    );

    return (
        <SettingsLayout
            title="Notifications"
            description="Manage how and when you receive notifications from the application"
        >
            <div className="space-y-6">
                {/* Notification Channels Card Skeleton */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-6 w-48" />
                        </div>
                        <Skeleton className="h-4 w-64 mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </CardContent>
                </Card>

                {/* Notification Types Card Skeleton */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-6 w-48" />
                        </div>
                        <Skeleton className="h-4 w-64 mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </CardContent>
                </Card>

                {/* Save Button Skeleton */}
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </SettingsLayout>
    );
} 