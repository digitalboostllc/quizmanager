import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertCircle, Brain, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";

interface GenerationStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  subStages?: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
  }[];
}

interface GenerationProgressProps {
  progress: number;
  currentStage: string;
  stages?: GenerationStage[];
  error?: string;
  estimatedTimeRemaining?: number;
  // Support for New Quiz page generation
  currentField?: string;
  completedFields?: string[];
  generationProgress?: number;
}

export function GenerationProgress({
  progress,
  currentStage,
  stages = [], // Provide default empty array
  error,
  estimatedTimeRemaining,
  currentField,
  completedFields,
  generationProgress,
}: GenerationProgressProps) {
  const getStageIcon = (status: GenerationStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return null;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Use generationProgress if provided, otherwise use progress
  const displayProgress = generationProgress !== undefined ? generationProgress : progress;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium">Generating Quizzes</span>
          </div>
          <div className="flex items-center gap-4">
            {estimatedTimeRemaining && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTimeRemaining(estimatedTimeRemaining)} remaining</span>
              </div>
            )}
            <span className="font-medium">{Math.round(displayProgress)}%</span>
          </div>
        </div>
        <Progress value={displayProgress} className="h-2" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Simplified progress for New Quiz page */}
      {currentField && completedFields && (
        <div className="space-y-3">
          {['title', 'description', 'question', 'answer', 'solution'].map((field) => {
            const isCompleted = completedFields.includes(field);
            const isCurrent = currentField === field;

            return (
              <div
                key={field}
                className={cn(
                  "rounded-lg border p-4",
                  isCurrent && "border-primary bg-primary/5",
                  isCompleted && "bg-secondary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                      {isCurrent && (
                        <span className="text-xs text-muted-foreground">In progress...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stages */}
      {stages.length > 0 && (
        <div className="space-y-3">
          {stages.map((stage) => {
            const isActive = stage.id === currentStage;
            const isCompleted = stage.status === 'completed';

            return (
              <div
                key={stage.id}
                className={cn(
                  "rounded-lg border p-4 space-y-3",
                  isActive && "border-primary bg-primary/5",
                  isCompleted && "bg-secondary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {getStageIcon(stage.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{stage.name}</span>
                      {stage.status === 'in_progress' && (
                        <span className="text-xs text-muted-foreground">In progress...</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                  </div>
                  {stage.progress > 0 && stage.progress < 100 && (
                    <Progress value={stage.progress} className="w-24 h-2" />
                  )}
                </div>

                {/* Sub-stages */}
                {stage.subStages && stage.subStages.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {stage.subStages.map((subStage) => (
                      <div
                        key={subStage.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        {getStageIcon(subStage.status)}
                        <span className="text-muted-foreground">{subStage.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 