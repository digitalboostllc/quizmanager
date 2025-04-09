"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

// Card skeleton with consistent styling for our design system
export function CardSkeleton({ className }: SkeletonProps) {
    return (
        <Card className={cn("border border-border/50 shadow-sm overflow-hidden", className)}>
            <CardHeader className="pb-2 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-24 rounded-md" />
            </CardFooter>
        </Card>
    );
}

// Quiz card skeleton
export function QuizCardSkeleton({ className, view = "grid" }: SkeletonProps & { view?: "grid" | "list" }) {
    if (view === "list") {
        return (
            <Card className={cn("border border-border/50 shadow-sm overflow-hidden", className)}>
                <CardContent className="p-4 flex items-center">
                    <div className="h-16 w-16 bg-muted animate-pulse rounded mr-4" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center mt-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-background/50", className)}>
            <div className="aspect-square relative bg-secondary/30 animate-pulse">
                <div className="absolute top-3 left-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-background/80 flex items-center justify-center">
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>
            </div>
            <CardContent className="p-5 flex-1">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                        <Skeleton className="h-3.5 w-1/3" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-3.5 rounded-full" />
                        <Skeleton className="h-3.5 w-2/3" />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="px-5 py-4 border-t border-border/30 flex justify-between items-center bg-secondary/5">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-8 rounded" />
            </CardFooter>
        </Card>
    );
}

// Table row skeleton
export function TableRowSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("flex items-center justify-between p-4 border-b", className)}>
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
        </div>
    );
}

// Stats card skeleton
export function StatCardSkeleton({ className }: SkeletonProps) {
    return (
        <Card className={cn("border border-border/50 shadow-sm", className)}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Calendar event skeleton
export function CalendarEventSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("flex items-start gap-3 p-3 rounded-lg bg-accent/5", className)}>
            <Skeleton className="h-full w-2 rounded-full" />
            <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

// Form skeleton
export function FormSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-28 rounded-md" />
            </div>
        </div>
    );
}

// Dashboard skeleton with grid layout
export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <CardSkeleton className="h-[500px]" />
                </div>
                <div>
                    <div className="space-y-6">
                        <CardSkeleton className="h-[240px]" />
                        <CardSkeleton className="h-[240px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// List skeleton
export function ListSkeleton({ count = 5, className }: { count?: number } & SkeletonProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {Array(count).fill(0).map((_, i) => (
                <TableRowSkeleton key={i} />
            ))}
        </div>
    );
}

// Shimmer effect component that can be applied to any skeleton
export function ShimmerEffect({ className }: SkeletonProps) {
    return (
        <div className={cn("animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent absolute inset-0", className)} />
    );
} 