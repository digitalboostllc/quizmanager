"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { CircleAlert, Clock, Database, RefreshCw, Search, Shield, Zap } from "lucide-react";
import { useState } from "react";

type QueryResult = {
    id: string;
    name: string;
    status: "success" | "error" | "loading";
    startTime: number;
    endTime?: number;
    duration?: number;
    data?: any;
    error?: string;
    queryDetails?: string;
};

export default function DiagnosticsPage() {
    const [results, setResults] = useState<QueryResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const loadingDelayContext = useLoadingDelay();
    const [testState, setTestState] = useState<string>("Not tested");
    const [isLoading, setIsLoading] = useState(false);

    // Function to run a test query and measure its performance
    const testQuery = async (endpoint: string, name: string, queryDetails?: string) => {
        // Create a new result entry
        const queryId = Date.now().toString();
        const newResult: QueryResult = {
            id: queryId,
            name,
            status: "loading",
            startTime: performance.now(),
            queryDetails
        };

        // Add to results list
        setResults(prev => [newResult, ...prev]);

        try {
            // Perform the actual fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

            const response = await fetch(`/api/${endpoint}`, {
                signal: controller.signal
            });

            // Clear timeout
            clearTimeout(timeoutId);

            // Process the response
            const data = await response.json();
            const endTime = performance.now();

            // Update the result with success data
            setResults(prev =>
                prev.map(item =>
                    item.id === queryId
                        ? {
                            ...item,
                            status: "success",
                            endTime,
                            duration: endTime - item.startTime,
                            data
                        }
                        : item
                )
            );
        } catch (error: any) {
            // Update the result with error information
            const endTime = performance.now();
            setResults(prev =>
                prev.map(item =>
                    item.id === queryId
                        ? {
                            ...item,
                            status: "error",
                            endTime,
                            duration: endTime - item.startTime,
                            error: error.message
                        }
                        : item
                )
            );
        }
    };

    // Function to run all diagnostic tests
    const runAllTests = async () => {
        setIsRunning(true);

        // Clear previous results
        setResults([]);

        // Run tests sequentially to avoid overloading the server
        await testQuery(
            "quizzes?limit=50",
            "List Quizzes (50)",
            "SELECT * FROM Quiz LIMIT 50 with Template relation"
        );

        await testQuery(
            "quizzes?limit=10",
            "List Quizzes (10)",
            "SELECT * FROM Quiz LIMIT 10 with Template relation"
        );

        await testQuery(
            "quizzes/search?q=test",
            "Search Quizzes",
            "Full-text search on Quiz titles"
        );

        // Add more test queries here
        await testQuery(
            "diagnostics/query-stats",
            "Database Stats",
            "Table statistics and row counts"
        );

        setIsRunning(false);
    };

    // Format duration for display
    const formatDuration = (duration?: number) => {
        if (!duration) return "N/A";

        if (duration < 1000) {
            return `${duration.toFixed(0)}ms`;
        } else {
            return `${(duration / 1000).toFixed(2)}s`;
        }
    };

    // Get badge variant based on performance
    const getDurationBadge = (duration?: number) => {
        if (!duration) return "default";

        if (duration < 500) return "success"; // Under 500ms: Excellent
        if (duration < 2000) return "default"; // Under 2s: Acceptable
        if (duration < 5000) return "secondary"; // Under 5s: Slow
        return "destructive"; // Over 5s: Problematic
    };

    // Get status badge variant
    const getStatusBadge = (status: "success" | "error" | "loading") => {
        switch (status) {
            case "success": return "success";
            case "error": return "destructive";
            case "loading": return "default";
        }
    };

    const runTest = async () => {
        setIsLoading(true);
        setTestState("Testing...");
        try {
            // Create a test promise
            const testPromise = new Promise<string>(resolve => {
                setTimeout(() => resolve("Context working correctly!"), 100);
            });

            // Use the simulateLoading function from context
            const result = await loadingDelayContext.simulateLoading(testPromise);
            setTestState(result);
        } catch (error) {
            setTestState(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-10 max-w-5xl">
            <div className="flex flex-col space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Database Diagnostics</h1>
                <p className="text-muted-foreground">
                    Test and optimize database queries to improve performance
                </p>
            </div>

            <Alert className="mb-8">
                <Database className="h-4 w-4" />
                <AlertTitle>Query Diagnostics Tool</AlertTitle>
                <AlertDescription>
                    This page helps identify slow database queries and provides optimization insights.
                    Run all tests or individual tests to analyze performance bottlenecks.
                </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">Query Tests</h2>
                    <p className="text-sm text-muted-foreground">Run tests to measure query performance</p>
                </div>
                <Button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="gap-2"
                >
                    {isRunning ? (
                        <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Running Tests...
                        </>
                    ) : (
                        <>
                            <Zap className="h-4 w-4" />
                            Run All Tests
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6 mb-8">
                <Tabs defaultValue="results">
                    <TabsList className="mb-4">
                        <TabsTrigger value="results">Test Results</TabsTrigger>
                        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="results">
                        {results.length === 0 ? (
                            <Card>
                                <CardContent className="py-10">
                                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                                        <Database className="h-8 w-8 text-muted-foreground" />
                                        <div>
                                            <p className="text-lg font-medium">No tests run yet</p>
                                            <p className="text-sm text-muted-foreground">
                                                Click "Run All Tests" to begin diagnostics
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {results.map((result) => (
                                    <Card key={result.id}>
                                        <CardHeader className="py-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{result.name}</CardTitle>
                                                    <CardDescription>{result.queryDetails}</CardDescription>
                                                </div>
                                                <Badge
                                                    variant={getStatusBadge(result.status)}
                                                    className="ml-2"
                                                >
                                                    {result.status === "loading" ? "Running..." :
                                                        result.status === "success" ? "Success" : "Failed"}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent>
                                            <div className="space-y-2">
                                                {result.duration && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">Duration:</span>
                                                        <Badge variant={getDurationBadge(result.duration)}>
                                                            {formatDuration(result.duration)}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {result.error && (
                                                    <Alert variant="destructive" className="mt-2">
                                                        <CircleAlert className="h-4 w-4" />
                                                        <AlertTitle>Error</AlertTitle>
                                                        <AlertDescription className="font-mono text-xs">
                                                            {result.error}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {result.status === "success" && (
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium">Response Data Sample</span>
                                                            <span className="text-muted-foreground">
                                                                {result.data && typeof result.data === 'object' &&
                                                                    Array.isArray(result.data.data) &&
                                                                    `${result.data.data.length} items`}
                                                            </span>
                                                        </div>
                                                        <div className="bg-muted rounded-md p-3 overflow-auto max-h-40">
                                                            <pre className="text-xs font-mono">
                                                                {JSON.stringify(result.data, null, 2).substring(0, 500)}
                                                                {JSON.stringify(result.data, null, 2).length > 500 && '...'}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="recommendations">
                        <Card>
                            <CardHeader>
                                <CardTitle>Query Optimization Recommendations</CardTitle>
                                <CardDescription>
                                    Based on test results, here are recommendations to improve database performance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Shield className="h-4 w-4" /> Indexes
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ensure these fields have proper indexes:
                                    </p>
                                    <ul className="list-disc pl-6 text-sm space-y-1">
                                        <li>Quiz.title (for text search)</li>
                                        <li>Quiz.status (for filtering)</li>
                                        <li>Quiz.createdAt (for sorting)</li>
                                        <li>Quiz.templateId (for joins)</li>
                                    </ul>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Search className="h-4 w-4" /> Query Optimizations
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Consider these query optimizations:
                                    </p>
                                    <ul className="list-disc pl-6 text-sm space-y-1">
                                        <li>Use <code>SELECT</code> with specific fields instead of <code>*</code></li>
                                        <li>Implement pagination with cursor-based approach rather than offset</li>
                                        <li>Use lightweight counts for pagination (estimate total count)</li>
                                        <li>Add caching for frequently accessed data</li>
                                        <li>Consider denormalizing data that's frequently joined</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Loading Delay Context Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <strong>Context Available:</strong> {loadingDelayContext ? "Yes" : "No"}
                    </div>
                    <div>
                        <strong>simulateLoading Function:</strong> {typeof loadingDelayContext?.simulateLoading === 'function' ? "Available" : "Not available"}
                    </div>
                    <div>
                        <strong>Test Result:</strong> {testState}
                    </div>
                    <Button
                        onClick={runTest}
                        disabled={isLoading}
                    >
                        {isLoading ? "Testing..." : "Run Test"}
                    </Button>
                </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground mt-6">
                <p className="mb-2">Visit these routes to test specific pages:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><a href="/dashboard/settings" className="text-blue-500 hover:underline">/dashboard/settings</a></li>
                    <li><a href="/dashboard/settings/facebook" className="text-blue-500 hover:underline">/dashboard/settings/facebook</a></li>
                    <li><a href="/dashboard/settings/calendar" className="text-blue-500 hover:underline">/dashboard/settings/calendar</a></li>
                    <li><a href="/dashboard/settings/auto-schedule" className="text-blue-500 hover:underline">/dashboard/settings/auto-schedule</a></li>
                    <li><a href="/dashboard/settings/notifications" className="text-blue-500 hover:underline">/dashboard/settings/notifications</a></li>
                </ul>
            </div>
        </div>
    );
} 