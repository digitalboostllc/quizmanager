"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

/**
 * Skeleton loading component for the Smart Generator page
 * Shows loading states for templates selection tab
 */
export function SmartGeneratorSkeleton() {
    return (
        <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle>Smart Quiz Generation</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                        <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
                    </Badge>
                </div>
                <CardDescription>Generate multiple quizzes at once with AI assistance</CardDescription>
            </CardHeader>
            <Tabs defaultValue="templates" className="w-full">
                <div className="px-6">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="templates" className="flex items-center gap-1">
                            <Skeleton className="h-4 w-4 mr-1" /> Templates
                        </TabsTrigger>
                        <TabsTrigger value="configure" className="flex items-center gap-1" disabled>
                            <Skeleton className="h-4 w-4 mr-1" /> Configure
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="flex items-center gap-1" disabled>
                            <Skeleton className="h-4 w-4 mr-1" /> Schedule
                        </TabsTrigger>
                    </TabsList>
                </div>

                <CardContent className="p-0">
                    <div className="space-y-6 m-0 p-6 pt-2">
                        <div>
                            <div className="mb-3 flex items-center">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-4 ml-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Array(6).fill(0).map((_, index) => (
                                    <TemplateCardSkeleton key={index} />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </CardContent>
            </Tabs>
        </Card>
    );
}

/**
 * Skeleton for a template card
 */
export function TemplateCardSkeleton() {
    return (
        <div className="flex items-start border rounded-md p-4 space-x-4 animate-pulse">
            <Skeleton className="h-5 w-5 rounded mt-1" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );
} 