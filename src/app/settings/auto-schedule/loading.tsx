'use client';

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function AutoScheduleLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-5 w-80" />
            </div>
            <Separator />
            <div className="space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
} 