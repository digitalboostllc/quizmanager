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

export default function DashboardQuizError({
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
        <div className="pt-6">
            <div className="max-w-2xl mx-auto py-8">
                <Card className="border border-destructive/20 shadow-sm">
                    <CardHeader className="pb-3 border-b">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <CardTitle>Error Loading Quiz</CardTitle>
                        </div>
                        <CardDescription>
                            We encountered a problem while trying to load this quiz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3">
                            <p className="text-sm text-destructive/90">
                                {error.message || "An unexpected error occurred while loading this quiz."}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={reset}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard/quizzes")}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Quizzes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 