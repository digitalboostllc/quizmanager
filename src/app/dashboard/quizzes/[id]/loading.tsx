import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/ui/skeletons";

export default function DashboardQuizLoading() {
    return (
        <div className="pt-6">
            {/* Header skeleton */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-6 w-32 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-[250px]" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Skeleton className="h-10 w-[130px] rounded-md" />
                                <Skeleton className="h-10 w-[130px] rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs skeleton */}
            <div className="space-y-8">
                <Skeleton className="h-10 w-[400px]" />

                <div className="grid grid-cols-12 gap-6">
                    {/* Main content - 8 columns */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-4 border-b">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-40" />
                                        <Skeleton className="h-5 w-32 rounded-full" />
                                    </div>
                                    <Skeleton className="h-9 w-full rounded-md" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <CardSkeleton className="aspect-video" />
                                    <Skeleton className="h-[300px] w-full rounded-md" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - 4 columns */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <CardTitle className="text-base">
                                        <Skeleton className="h-5 w-32" />
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4 space-y-4">
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center">
                                            <div className="w-32 flex items-center gap-2">
                                                <Skeleton className="h-7 w-7 rounded-md" />
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                            <Skeleton className="h-4 flex-1" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className="h-px w-full" />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-7 w-7 rounded-md" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[1, 2, 3, 4].map((i) => (
                                            <Skeleton key={i} className="h-6 w-16 rounded-md" />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <CardTitle className="text-base">
                                        <Skeleton className="h-5 w-24" />
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-accent/5 p-3 rounded">
                                        <Skeleton className="h-4 w-16 mb-1" />
                                        <Skeleton className="h-8 w-12" />
                                    </div>
                                    <div className="bg-accent/5 p-3 rounded">
                                        <Skeleton className="h-4 w-16 mb-1" />
                                        <Skeleton className="h-8 w-12" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-full mt-4" />
                            </CardContent>
                        </Card>

                        <Card className="border border-destructive/20 shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <CardTitle className="text-base">
                                        <Skeleton className="h-5 w-28" />
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4">
                                <Skeleton className="h-16 w-full rounded-md mb-3" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 