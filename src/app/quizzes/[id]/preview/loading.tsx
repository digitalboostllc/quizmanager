import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Preview Card */}
        <Card className="lg:col-span-3 border border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Skeleton className="w-full aspect-square" />
              <div className="absolute top-4 right-4">
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 