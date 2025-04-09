'use client';

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function QuizCardSkeleton() {
    return (
        <Card className="overflow-hidden h-full flex flex-col border border-border/40 bg-background/50 animate-pulse">
            <div className="aspect-square bg-muted/60 relative">
                {/* Status badge skeleton */}
                <Skeleton className="absolute top-3 right-3 h-5 w-16 rounded-full" />
            </div>

            <CardContent className="flex-1 p-5 bg-muted/20">
                {/* Title and description skeletons */}
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1.5" />
                <Skeleton className="h-4 w-4/5 mb-3" />

                {/* Date and metadata skeletons */}
                <div className="flex items-center justify-between mt-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-12" />
                </div>

                {/* Type badge skeleton - moved to content area to match card */}
                <div className="mt-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </CardContent>

            <CardFooter className="px-5 py-4 border-t border-border/30 flex justify-between gap-2 bg-secondary/5">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
            </CardFooter>
        </Card>
    );
} 