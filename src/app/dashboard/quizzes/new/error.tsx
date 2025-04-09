"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundSize: '40px 40px',
    backgroundImage: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)',
    backgroundPosition: 'center center'
};

export default function NewQuizError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="container max-w-screen-2xl mx-auto py-8">
            {/* Header section with improved styling */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push('/dashboard/quizzes')}
                                    className="h-8 w-8 mr-1"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="sr-only">Back to Quizzes</span>
                                </Button>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                                    Error Occurred
                                </div>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                Quiz Creation Error
                            </h1>
                            <p className="text-muted-foreground">
                                There was an error while creating your quiz. Please try again or contact support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border border-border/50 shadow-sm max-w-xl mx-auto">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <CardTitle>Something went wrong!</CardTitle>
                    </div>
                    <CardDescription>
                        There was an error creating the quiz. Please try again or contact support if the problem persists.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20 text-sm text-destructive-foreground">
                        {error.message || "An unexpected error occurred."}
                        {error.digest && (
                            <p className="mt-2 text-xs font-mono">Error code: {error.digest}</p>
                        )}
                    </div>
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => router.push('/dashboard/quizzes')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Quizzes
                        </Button>
                        <Button onClick={reset} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 