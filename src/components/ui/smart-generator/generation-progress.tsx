"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Clock, Loader2, RotateCcw } from "lucide-react";
import Image from "next/image";

interface GeneratedQuiz {
    title: string;
    type: string;
    scheduledAt: string;
    imageUrl?: string;
}

interface GenerationProgressProps {
    currentStage: "preparing" | "generating" | "scheduling" | "processing-images" | "complete";
    progress: number;
    completed: number;
    total: number;
    currentTemplate: string;
    timeRemaining: number;
    generatedQuizzes?: GeneratedQuiz[];
    error?: string;
    onCancel: () => void;
    onRestart: () => void;
}

const stageMessages = {
    preparing: "Preparing templates and configuration",
    generating: "Generating quiz content",
    scheduling: "Scheduling posts",
    "processing-images": "Processing images",
    complete: "Generation completed!",
};

const stageColors = {
    preparing: "bg-blue-500",
    generating: "bg-amber-500",
    scheduling: "bg-purple-500",
    "processing-images": "bg-indigo-500",
    complete: "bg-green-500",
};

export function GenerationProgress({
    currentStage,
    progress,
    completed,
    total,
    currentTemplate,
    timeRemaining,
    generatedQuizzes = [],
    error,
    onCancel,
    onRestart,
}: GenerationProgressProps) {
    // Format time remaining in a human-readable way
    const formatTimeRemaining = (seconds: number): string => {
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <Card className="w-full">
            <CardHeader className="relative pb-2">
                <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden rounded-t-lg">
                    <div
                        className={`h-full ${stageColors[currentStage]} transition-all duration-500 ease-in-out`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between items-center pt-2">
                    <CardTitle className="text-xl">
                        {currentStage === "complete" ? "Generation Complete!" : "Generating Quizzes"}
                    </CardTitle>
                    <Badge
                        variant={currentStage === "complete" ? "default" : "secondary"}
                        className="font-normal"
                    >
                        {currentStage === "complete" ? (
                            <span className="flex items-center">
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Completed
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                In Progress
                            </span>
                        )}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
                        <p className="font-medium">Generation Error</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>{stageMessages[currentStage]}</span>
                                <span className="font-medium">
                                    {completed} of {total} quizzes
                                </span>
                            </div>

                            <Progress value={progress} className="h-2" />

                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    {currentStage !== "complete" && currentTemplate && (
                                        <span className="flex items-center">
                                            Current template: <span className="font-medium ml-1">{currentTemplate}</span>
                                        </span>
                                    )}
                                </span>

                                {currentStage !== "complete" && timeRemaining > 0 && (
                                    <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatTimeRemaining(timeRemaining)} remaining
                                    </span>
                                )}
                            </div>
                        </div>

                        {generatedQuizzes.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Generated Quizzes</h4>
                                <ScrollArea className="h-[240px] rounded-md border">
                                    <div className="p-4 space-y-3">
                                        {generatedQuizzes.map((quiz, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center space-x-3 p-2 rounded-md border bg-background/50"
                                            >
                                                {quiz.imageUrl ? (
                                                    <div className="w-12 h-12 rounded overflow-hidden shrink-0">
                                                        <Image
                                                            src={quiz.imageUrl}
                                                            alt={quiz.title}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                        <div className="text-primary text-xl font-bold">
                                                            {quiz.title.substring(0, 1)}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-medium text-sm truncate">
                                                        {quiz.title}
                                                    </h5>
                                                    <div className="flex items-center mt-0.5">
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {quiz.type} • Scheduled for {quiz.scheduledAt}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <CardFooter className="flex justify-end space-x-3 pt-0">
                {currentStage !== "complete" ? (
                    <Button variant="destructive" size="sm" onClick={onCancel}>
                        Cancel Generation
                    </Button>
                ) : (
                    <>
                        <Button variant="outline" size="sm" onClick={onRestart}>
                            <RotateCcw className="h-4 w-4 mr-1.5" />
                            Generate More
                        </Button>
                        <Button size="sm">
                            View Schedule
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
} 