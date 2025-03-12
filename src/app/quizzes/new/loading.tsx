import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, FormSkeleton } from "@/components/ui/skeletons";
import { Sparkles } from "lucide-react";

export default function NewQuizLoading() {
  return (
    <div className="container py-8 space-y-8">
      {/* Page header with skeleton for title */}
      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Create Content
        </div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent>
              <FormSkeleton />
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <CardSkeleton className="h-[600px]" />
      </div>
    </div>
  );
} 