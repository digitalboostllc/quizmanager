import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton } from "@/components/ui/skeletons";

interface SettingsPageLoadingProps {
    /**
     * Title width in Tailwind units
     * @default "w-56"
     */
    titleWidth?: string;

    /**
     * Description width in Tailwind units
     * @default "w-96"
     */
    descriptionWidth?: string;

    /**
     * Number of form sections to show
     * @default 1
     */
    sections?: number;
}

export function SettingsPageLoading({
    titleWidth = "w-56",
    descriptionWidth = "w-96",
    sections = 1
}: SettingsPageLoadingProps) {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className={`h-8 ${titleWidth} mb-2`} />
                <Skeleton className={`h-5 ${descriptionWidth}`} />
            </div>

            {Array(sections).fill(0).map((_, index) => (
                <Card key={index} className="border border-border/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-full max-w-lg" />
                    </CardHeader>
                    <CardContent>
                        <FormSkeleton />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 