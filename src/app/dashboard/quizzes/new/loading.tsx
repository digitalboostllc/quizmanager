import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileCode, FileType, Info, Sparkles } from "lucide-react";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundSize: '40px 40px',
    backgroundImage: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)',
    backgroundPosition: 'center center'
};

export default function NewQuizLoading() {
    return (
        <div className="container max-w-screen-2xl mx-auto py-8 space-y-8">
            {/* Header with progress steps */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col justify-between">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 mr-1"
                                        disabled
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                        Quiz Creator
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-56" />
                                <Skeleton className="h-5 w-96" />
                            </div>

                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-9 w-36" />
                                <Skeleton className="h-9 w-32" />
                            </div>
                        </div>

                        {/* Progress steps */}
                        <div className="w-full max-w-3xl mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col items-center relative">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                                        <FileType className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1 text-primary">Template</span>
                                </div>
                                <div className="h-[2px] flex-1 bg-muted-foreground/20 mx-2 relative">
                                    <div className="absolute inset-0 bg-primary w-0 transition-all duration-300"></div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-background">
                                        <FileCode className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1 text-muted-foreground">Content</span>
                                </div>
                                <div className="h-[2px] flex-1 bg-muted-foreground/20 mx-2 relative">
                                    <div className="absolute inset-0 bg-primary w-0 transition-all duration-300"></div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-background">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium mt-1 text-muted-foreground">Details</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Main content area */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <Tabs defaultValue="template" className="w-full">
                        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
                            <TabsTrigger value="template" className="flex items-center">
                                <FileType className="h-4 w-4 mr-2" />
                                Template
                            </TabsTrigger>
                            <TabsTrigger value="content" className="flex items-center" disabled>
                                <FileCode className="h-4 w-4 mr-2" />
                                Content
                            </TabsTrigger>
                            <TabsTrigger value="admin" className="flex items-center" disabled>
                                <Info className="h-4 w-4 mr-2" />
                                Details
                            </TabsTrigger>
                        </TabsList>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <Card className="border border-border/50 shadow-sm min-h-[600px]">
                                    <CardHeader className="pb-3 border-b">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Skeleton className="h-6 w-40 mb-2" />
                                                <Skeleton className="h-4 w-60" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className="relative flex items-start p-4 rounded-lg border border-muted-foreground/20 overflow-hidden"
                                                >
                                                    <div className="flex gap-4 items-center w-full">
                                                        <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Skeleton className="h-5 w-36" />
                                                                <Skeleton className="h-5 w-16 rounded-full" />
                                                            </div>
                                                            <Skeleton className="h-4 w-full" />
                                                            <Skeleton className="h-4 w-3/4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end mt-6">
                                            <Skeleton className="h-9 w-40" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Preview Section */}
                            <div className="space-y-6">
                                <Card className="border border-border/50 shadow-sm min-h-[600px] flex flex-col">
                                    <CardHeader className="pb-2 border-b">
                                        <Skeleton className="h-6 w-32 mb-2" />
                                        <Skeleton className="h-4 w-48" />
                                    </CardHeader>
                                    <CardContent className="flex-grow relative overflow-hidden pt-4">
                                        <div className="h-full border rounded-md flex items-center justify-center bg-muted/20">
                                            <div className="text-center p-8">
                                                <div className="mx-auto mb-4 rounded-full bg-muted h-12 w-12"></div>
                                                <Skeleton className="h-5 w-48 mx-auto mb-2" />
                                                <Skeleton className="h-4 w-36 mx-auto" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </Tabs>
                </div>

                {/* AI Helper Sidebar */}
                <div className="col-span-12 lg:col-span-4">
                    <Card className="border border-border/50 shadow-sm h-full flex flex-col">
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <div className="flex-grow relative overflow-hidden">
                            <div className="p-4 space-y-4">
                                <div className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                                    </Avatar>
                                    <Skeleton className="h-20 w-[80%] rounded-lg" />
                                </div>

                                <div className="flex items-start justify-end gap-2">
                                    <Skeleton className="h-12 w-[60%] rounded-lg" />
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-secondary">You</AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                                    </Avatar>
                                    <Skeleton className="h-16 w-[80%] rounded-lg" />
                                </div>
                            </div>
                        </div>
                        <CardFooter className="border-t p-4">
                            <div className="flex w-full items-center gap-2">
                                <Skeleton className="h-10 flex-1 rounded-md" />
                                <Skeleton className="h-10 w-10 rounded-md" />
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
} 