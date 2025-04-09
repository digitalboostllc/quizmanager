import { useToast } from '@/components/ui/use-toast';
import { Template } from '@/lib/types';
import { useCallback, useState } from 'react';

interface BatchGenerationState {
    isOpen: boolean;
    totalQuizzes: number;
    completedQuizzes: number;
    currentQuiz: {
        title: string;
        status: 'generating' | 'success' | 'failed';
        progress: number;
    };
    errors: Array<{ quizTitle: string; error: string }>;
}

export function useBatchGeneration() {
    const { toast } = useToast();
    const [state, setState] = useState<BatchGenerationState>({
        isOpen: false,
        totalQuizzes: 0,
        completedQuizzes: 0,
        currentQuiz: {
            title: '',
            status: 'generating',
            progress: 0
        },
        errors: []
    });

    const startBatchGeneration = useCallback(async (
        template: Template,
        count: number,
        language: string,
        difficulty: string = 'medium',
        theme?: string
    ) => {
        if (!template) {
            toast({
                title: "Error",
                description: "Please select a template first",
                variant: "destructive",
            });
            return;
        }

        // Initialize batch state
        setState(prev => ({
            ...prev,
            isOpen: true,
            totalQuizzes: count,
            completedQuizzes: 0,
            currentQuiz: {
                title: 'Preparing...',
                status: 'generating',
                progress: 0
            },
            errors: []
        }));

        try {
            // Start batch generation
            const response = await fetch('/api/quiz-generation/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateIds: [template.id],
                    count,
                    language,
                    difficulty,
                    theme,
                    variety: 50, // Default variety
                    timeSlotDistribution: [
                        // Create a week's worth of default time slots
                        ...Array(7).fill(0).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            return {
                                date: date.toISOString().split('T')[0], // YYYY-MM-DD format
                                slotId: 'morning',
                                weight: 1
                            };
                        })
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start batch generation');
            }

            const { batchId } = await response.json();

            // Poll for batch status
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await fetch(`/api/quiz-generation/batch/${batchId}/status`);
                    if (!statusResponse.ok) {
                        throw new Error('Failed to fetch batch status');
                    }

                    const status = await statusResponse.json();

                    setState(prev => ({
                        ...prev,
                        completedQuizzes: status.completedCount,
                        currentQuiz: {
                            title: status.currentQuiz?.title || 'Processing...',
                            status: status.currentQuiz?.status || 'generating',
                            progress: status.currentQuiz?.progress || 0
                        },
                        errors: status.errors || []
                    }));

                    if (status.status === 'COMPLETE' || status.status === 'FAILED') {
                        clearInterval(pollInterval);

                        if (status.status === 'COMPLETE') {
                            toast({
                                title: "Success",
                                description: `Successfully generated ${status.completedCount} quizzes`,
                            });
                        } else {
                            toast({
                                title: "Error",
                                description: "Some quizzes failed to generate",
                                variant: "destructive",
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error polling batch status:', error);
                    clearInterval(pollInterval);
                }
            }, 1000);

        } catch (error) {
            console.error('Error starting batch generation:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to start batch generation",
                variant: "destructive",
            });
            setState(prev => ({ ...prev, isOpen: false }));
        }
    }, [toast]);

    const closeBatchGeneration = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const retryFailedQuiz = useCallback(async (quizTitle: string) => {
        // Implement retry logic here
        console.log('Retrying quiz:', quizTitle);
    }, []);

    return {
        state,
        startBatchGeneration,
        closeBatchGeneration,
        retryFailedQuiz
    };
} 