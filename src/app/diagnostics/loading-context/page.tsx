'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoadingContextDiagnosticsPage() {
    const loadingDelayContext = useLoadingDelay();
    const [testState, setTestState] = useState<string>("Not tested");
    const [isLoading, setIsLoading] = useState(false);

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
            console.error("Loading context test error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6">Loading Context Diagnostics</h1>

            <Card className="mb-6">
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
                        <strong>Context Value:</strong> <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">{JSON.stringify(loadingDelayContext, null, 2)}</pre>
                    </div>
                    <div>
                        <strong>Test Result:</strong> {testState}
                    </div>
                    <Button
                        onClick={runTest}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                            </>
                        ) : "Run Test"}
                    </Button>
                </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
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