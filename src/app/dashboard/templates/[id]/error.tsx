"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundSize: '40px 40px',
    backgroundImage: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)',
    backgroundPosition: 'center center'
};

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to console for debugging
        console.error("Template page error:", error);
    }, [error]);

    return (
        <div className="container py-12">
            <div className="max-w-xl mx-auto">
                {/* Header with background pattern */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/dashboard/templates')}
                                className="h-9 w-9 mr-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="space-y-1">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                                    Error Loading Template
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Something went wrong
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <CardTitle>Error Details</CardTitle>
                        </div>
                        <CardDescription>
                            We encountered an error while trying to load the template
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                            <p className="font-medium">Message:</p>
                            <p className="mt-1 font-mono">{error.message || "Unknown error occurred"}</p>
                            {error.digest && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/templates')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Templates
                        </Button>
                        <Button onClick={reset} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
} 