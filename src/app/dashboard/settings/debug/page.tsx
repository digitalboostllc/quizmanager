"use client";

import { SettingsCard } from '@/components/settings/settings-card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from '@/components/ui/loading-indicator';
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { Code, Info, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from 'react';

// Mock debug files data
const mockDebugFiles = [
    { id: 1, name: 'error_log_20230615.html', size: '45 KB', date: '2023-06-15' },
    { id: 2, name: 'debug_trace_20230614.html', size: '128 KB', date: '2023-06-14' },
    { id: 3, name: 'performance_metrics_20230613.html', size: '78 KB', date: '2023-06-13' },
    { id: 4, name: 'api_log_20230612.html', size: '112 KB', date: '2023-06-12' },
    { id: 5, name: 'session_debug_20230611.html', size: '56 KB', date: '2023-06-11' },
];

// Mock environment info
const environmentInfo = {
    appVersion: '1.2.3',
    nodeVersion: '18.17.1',
    nextVersion: '14.0.3',
    prismaVersion: '5.6.0',
    environment: 'development',
    os: 'macOS',
    browser: 'Chrome 98.0.4758.102',
};

export default function DebugPage() {
    const { toast } = useToast();
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);
    const [debugFiles, setDebugFiles] = useState<typeof mockDebugFiles>([]);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("files");

    useEffect(() => {
        const loadDebugData = async () => {
            setIsLoading(true);
            try {
                console.log('Debug: Loading debug data');
                // Simulate API call
                const debugDataPromise = Promise.resolve(mockDebugFiles);
                const data = await simulateLoading(debugDataPromise);
                console.log('Debug: Debug data loaded');
                setDebugFiles(data);
            } catch (error) {
                console.error('Error loading debug data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load debug information. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadDebugData();
    }, [simulateLoading, toast]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Simulate API call to refresh debug files
            await new Promise(resolve => setTimeout(resolve, 1000));
            setDebugFiles([...mockDebugFiles]);
            toast({
                title: "Refreshed",
                description: "Debug files have been refreshed.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to refresh debug files. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsDeleting(id);
        try {
            // Simulate API call to delete a debug file
            await new Promise(resolve => setTimeout(resolve, 800));
            setDebugFiles(debugFiles.filter(file => file.id !== id));
            toast({
                title: "Deleted",
                description: "Debug file has been deleted.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete the debug file. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    if (isLoading) {
        return (
            <div>
                <div className="animate-pulse">
                    <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <SettingsCard
                title="Debug & Technical Information"
                description="Access and manage HTML debug files and view system information"
                icon={<Code className="h-5 w-5 text-primary" />}
            >
                <Tabs defaultValue="files" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="files">Debug Files</TabsTrigger>
                        <TabsTrigger value="env">Environment Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <Code className="h-5 w-5 text-primary" />
                                HTML Debug Files
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="text-sm font-medium"
                            >
                                {isRefreshing ? (
                                    <>
                                        <ButtonLoader className="mr-2" />
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCcw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead>
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">File Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Size</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {debugFiles.length > 0 ? (
                                            debugFiles.map((file) => (
                                                <tr key={file.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle text-base">{file.name}</td>
                                                    <td className="p-4 align-middle text-base">{file.size}</td>
                                                    <td className="p-4 align-middle text-base">{file.date}</td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(file.id)}
                                                            disabled={isDeleting === file.id}
                                                            className="text-sm font-medium"
                                                        >
                                                            {isDeleting === file.id ? (
                                                                <>
                                                                    <ButtonLoader className="mr-2" />
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </>
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                                    No debug files available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="env" className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                            <Info className="h-5 w-5 text-primary" />
                            Environment Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">App Version:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.appVersion}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Node Version:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.nodeVersion}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Next.js Version:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.nextVersion}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Prisma Version:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.prismaVersion}</Badge>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Environment:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.environment}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Operating System:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.os}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Browser:</span>
                                    <Badge variant="outline" className="text-sm">{environmentInfo.browser}</Badge>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </SettingsCard>
        </div>
    );
} 