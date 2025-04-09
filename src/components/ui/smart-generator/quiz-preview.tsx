"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle, ClipboardCheck, Clock, Eye, Info } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface QuizPreviewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quiz: {
        title: string;
        type: string;
        scheduledAt: string;
        answer: string;
        solution?: string;
        variables: Record<string, any>;
        imageUrl?: string;
    } | null;
}

export function QuizPreview({ open, onOpenChange, quiz }: QuizPreviewProps) {
    const [showAnswer, setShowAnswer] = useState(false);

    if (!quiz) return null;

    // Format scheduled date
    const formatScheduledDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }).format(date);
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Quiz Preview</DialogTitle>
                    <DialogDescription>
                        Preview how this quiz will appear when scheduled
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 my-2">
                    {quiz.imageUrl && (
                        <div className="relative w-full h-[260px] rounded-lg overflow-hidden">
                            <Image
                                src={quiz.imageUrl}
                                alt={quiz.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                                <Badge className="mb-2" variant="secondary">
                                    {quiz.type}
                                </Badge>
                                <h2 className="text-white text-xl font-semibold line-clamp-2">
                                    {quiz.title}
                                </h2>
                            </div>
                        </div>
                    )}

                    <Card className="border border-border/70">
                        <CardHeader className="pb-3">
                            {!quiz.imageUrl && (
                                <div className="flex justify-between items-start mb-1">
                                    <CardTitle className="text-xl">{quiz.title}</CardTitle>
                                    <Badge>{quiz.type}</Badge>
                                </div>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatScheduledDate(quiz.scheduledAt)}</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pb-3">
                            {!showAnswer ? (
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        <span className="font-medium">Challenge</span>
                                    </div>
                                    <p>Can you solve this quiz? Tap Show Answer to see the solution.</p>

                                    {/* Display variables if available */}
                                    {quiz.variables && Object.keys(quiz.variables).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-primary/10">
                                            <h4 className="text-sm font-medium mb-2">Clues:</h4>
                                            <ul className="space-y-1.5">
                                                {Object.entries(quiz.variables).map(([key, value]) => (
                                                    <li key={key} className="text-sm flex items-start gap-2">
                                                        <span className="font-medium min-w-[100px]">{key}:</span>
                                                        <span>{value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="font-medium">Answer</span>
                                        </div>
                                        <p className="font-semibold text-green-900">{quiz.answer}</p>
                                    </div>

                                    {quiz.solution && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                                            <div className="flex items-center gap-2 text-blue-700">
                                                <ClipboardCheck className="h-4 w-4" />
                                                <span className="font-medium">Solution</span>
                                            </div>
                                            <p className="text-blue-900">{quiz.solution}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>

                        <Separator />

                        <CardFooter className="pt-3 flex justify-end">
                            <Button
                                variant={showAnswer ? "outline" : "default"}
                                size="sm"
                                onClick={() => setShowAnswer(!showAnswer)}
                                className="gap-1.5"
                            >
                                {showAnswer ? (
                                    <>
                                        <Eye className="h-4 w-4" />
                                        Hide Answer
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4" />
                                        Show Answer
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span>Scheduled for {formatScheduledDate(quiz.scheduledAt)}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 