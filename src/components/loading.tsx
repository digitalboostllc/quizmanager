import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingProps {
  title?: boolean;
  description?: boolean;
  items?: number;
  action?: boolean;
}

export function Loading({
  title = true,
  description = true,
  items = 3,
  action = true,
}: LoadingProps) {
  return (
    <div className="container py-8">
      {(title || description) && (
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            {title && <Skeleton className="h-8 w-[200px]" />}
            {description && <Skeleton className="h-4 w-[300px]" />}
          </div>
          {action && <Skeleton className="h-10 w-[100px]" />}
        </div>
      )}

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[100px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent className="space-y-8">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
} 