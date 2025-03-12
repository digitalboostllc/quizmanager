import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton } from "@/components/ui/skeletons";
import { Sparkles } from "lucide-react";

export default function NewTemplateLoading() {
    return (
        <div className="container py-8 space-y-8">
            {/* Page header with skeleton for title */}
            <div className="space-y-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Template Creation
                </div>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <Card className="border border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle>Template Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormSkeleton />
                        </CardContent>
                    </Card>

                    <Card className="border border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle>Template Code</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-60 w-full" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-border/50 shadow-sm h-[600px]">
                    <CardHeader className="pb-2">
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-full bg-accent/5 rounded-lg">
                            <div className="text-center space-y-3">
                                <Skeleton className="h-8 w-48 mx-auto" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 