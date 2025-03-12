import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationProgressProps {
  progress: number;
  currentField: string | null;
  completedFields: string[];
  getFieldValue: (field: string) => string;
}

export function GenerationProgress({
  progress,
  currentField,
  completedFields,
  getFieldValue,
}: GenerationProgressProps) {
  const allFields = [...new Set([...(currentField ? [currentField] : []), ...completedFields])];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Generating quiz content...</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-3">
        {allFields.map((field) => {
          const isCompleted = completedFields.includes(field);
          const isGeneratingField = currentField === field;
          
          return (
            <div
              key={field}
              className={cn(
                "flex items-center gap-3 text-sm p-3 rounded-lg border",
                isCompleted && "bg-secondary/50",
                isGeneratingField && "border-primary"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : isGeneratingField ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {isGeneratingField && (
                    <span className="text-xs text-muted-foreground">Generating...</span>
                  )}
                </div>
                {(isCompleted || isGeneratingField) && (
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {getFieldValue(field)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 