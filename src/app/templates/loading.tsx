import { Skeleton } from "@/components/ui/skeleton";
import { QuizCardSkeleton } from "@/components/ui/skeletons";
import { Sparkles } from "lucide-react";

export default function Loading() {
    return (
        <div className="container py-8 space-y-8">
            {/* Page header with skeleton for title */}
            <div className="space-y-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Template Library
                </div>
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Search and filter bar skeleton */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 bg-accent/5 p-4 rounded-lg border border-border/50">
                <div className="relative md:col-span-5">
                    <Skeleton className="h-10 w-full" />
                </div>

                <div className="md:col-span-3">
                    <Skeleton className="h-10 w-full" />
                </div>

                <div className="md:col-span-4 flex justify-end">
                    <Skeleton className="h-10 w-32 md:w-48" />
                </div>
            </div>

            {/* Template cards grid */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {Array(8).fill(0).map((_, i) => (
                    <QuizCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
} 