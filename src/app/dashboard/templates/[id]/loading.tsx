"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, ChevronRight, Clock, FileCode, FileType, Home, Layers3, Variable } from "lucide-react";
import Link from "next/link";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export default function Loading() {
    return (
        <div className="container pt-6 pb-12">
            {/* Breadcrumb navigation */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                <Link href="/" className="hover:text-foreground transition-colors">
                    <Home className="h-3.5 w-3.5 inline-block mr-1" />
                    Home
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/dashboard/templates" className="hover:text-foreground transition-colors">
                    Templates
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground">Loading...</span>
            </nav>

            {/* Header with background pattern */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center">
                                    <Layers3 className="mr-2 h-5 w-5 text-primary" />
                                    <div className="animate-pulse rounded-md bg-muted h-8 w-48"></div>
                                </h1>
                                <div className="animate-pulse rounded-md bg-muted h-4 w-60 mt-1"></div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" disabled>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <Button disabled>
                                    <div className="animate-pulse rounded-md bg-muted/30 h-4 w-16"></div>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="space-y-8">
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <Card className="border shadow-sm">
                            <Tabs defaultValue="details">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <FileType className="h-4 w-4" />
                                                <span>Template Details</span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="bg-muted/60 text-foreground border-border animate-pulse"
                                            >
                                                Loading...
                                            </Badge>
                                        </div>

                                        <TabsList className="grid grid-cols-3 h-9">
                                            <TabsTrigger value="details">
                                                <div className="animate-pulse rounded-md bg-muted h-4 w-16"></div>
                                            </TabsTrigger>
                                            <TabsTrigger value="code">
                                                <div className="animate-pulse rounded-md bg-muted h-4 w-16"></div>
                                            </TabsTrigger>
                                            <TabsTrigger value="variables">
                                                <div className="animate-pulse rounded-md bg-muted h-4 w-16"></div>
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <TabsContent value="details" className="space-y-4">
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-10 bg-muted rounded-md w-1/2"></div>
                                            <div className="h-24 bg-muted rounded-md"></div>
                                            <div className="h-10 bg-muted rounded-md w-2/3"></div>
                                            <div className="h-10 bg-muted rounded-md w-1/3"></div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="code" className="space-y-4">
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-10 bg-muted rounded-md w-1/2"></div>
                                            <div className="h-24 bg-muted rounded-md"></div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="variables" className="space-y-4">
                                        <div className="animate-pulse space-y-4">
                                            <div className="h-10 bg-muted rounded-md w-1/2"></div>
                                            <div className="h-24 bg-muted rounded-md"></div>
                                        </div>
                                    </TabsContent>
                                </CardContent>
                            </Tabs>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <Card className="border shadow-sm sticky top-20">
                            <CardHeader className="pb-2 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">
                                            Live Preview
                                        </CardTitle>
                                        <div className="animate-pulse rounded-md bg-muted h-4 w-40 mt-1"></div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="w-full flex justify-center">
                                    <div className="w-full max-w-xl aspect-square bg-muted animate-pulse rounded-lg border shadow-sm overflow-hidden relative">
                                    </div>
                                </div>

                                {/* Template info */}
                                <div className="space-y-1 mt-3">
                                    <div className="animate-pulse rounded-md bg-muted h-5 w-2/3"></div>
                                    <div className="animate-pulse rounded-md bg-muted h-4 w-full mt-1"></div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mt-6 border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileType className="h-5 w-5 text-primary" />
                                        Template Information
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-200">
                                        Details
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4 px-5">
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <div className="flex items-center gap-2 min-w-32">
                                            <div className="p-1.5 rounded-md bg-primary/10">
                                                <FileCode className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span className="font-medium">Template ID</span>
                                        </div>
                                        <div className="animate-pulse rounded-md bg-muted h-4 w-40"></div>
                                    </div>

                                    <div className="flex items-center text-sm">
                                        <div className="flex items-center gap-2 min-w-32">
                                            <div className="p-1.5 rounded-md bg-green-500/10">
                                                <Calendar className="h-3.5 w-3.5 text-green-500" />
                                            </div>
                                            <span className="font-medium">Created</span>
                                        </div>
                                        <div className="animate-pulse rounded-md bg-muted h-4 w-28"></div>
                                    </div>

                                    <div className="flex items-center text-sm">
                                        <div className="flex items-center gap-2 min-w-32">
                                            <div className="p-1.5 rounded-md bg-blue-500/10">
                                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                            </div>
                                            <span className="font-medium">Updated</span>
                                        </div>
                                        <div className="animate-pulse rounded-md bg-muted h-4 w-28"></div>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-3">
                                    <div className="flex items-center text-sm">
                                        <div className="flex items-center gap-2 min-w-32">
                                            <div className="p-1.5 rounded-md bg-purple-500/10">
                                                <Variable className="h-3.5 w-3.5 text-purple-500" />
                                            </div>
                                            <span className="font-medium">Variables</span>
                                        </div>
                                        <div className="animate-pulse rounded-md bg-muted h-4 w-16"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 