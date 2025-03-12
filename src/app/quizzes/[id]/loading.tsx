import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, FormSkeleton } from "@/components/ui/skeletons";

export default function QuizLoading() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <CardSkeleton className="h-[400px]" />

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Quiz Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent>
              <FormSkeleton />
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-accent/5 p-3 rounded">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="bg-accent/5 p-3 rounded">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 