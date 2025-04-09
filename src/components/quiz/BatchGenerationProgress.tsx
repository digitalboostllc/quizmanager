import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface BatchGenerationProgressProps {
    isOpen: boolean;
    totalQuizzes: number;
    completedQuizzes: number;
    currentQuiz: {
        title: string;
        status: 'generating' | 'success' | 'failed';
        progress: number;
    };
    errors: Array<{ quizTitle: string; error: string }>;
    onClose: () => void;
    onRetry: (quizTitle: string) => void;
}

export function BatchGenerationProgress({
    isOpen,
    totalQuizzes,
    completedQuizzes,
    currentQuiz,
    errors,
    onClose,
    onRetry
}: BatchGenerationProgressProps) {
    const progress = (completedQuizzes / totalQuizzes) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generating Quizzes</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Overall Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span>{completedQuizzes} of {totalQuizzes} quizzes</span>
                        </div>
                        <Progress value={progress} />
                    </div>

                    {/* Current Quiz Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                {currentQuiz.status === 'generating' && (
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                                {currentQuiz.status === 'success' && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                                {currentQuiz.status === 'failed' && (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                {currentQuiz.title}
                            </span>
                            <span>{currentQuiz.progress}%</span>
                        </div>
                        <Progress value={currentQuiz.progress} />
                    </div>

                    {/* Error List */}
                    {errors.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Failed Quizzes</h4>
                            <div className="space-y-2">
                                {errors.map((error, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                                    >
                                        <span className="text-red-500">{error.quizTitle}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRetry(error.quizTitle)}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 