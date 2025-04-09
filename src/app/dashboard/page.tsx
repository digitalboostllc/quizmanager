"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
    BarChart3,
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    FileText,
    Gauge,
    Home,
    Layout,
    LineChart,
    PieChart,
    Plus,
    Settings,
    Sparkles
} from "lucide-react";
import Link from "next/link";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export default function DashboardPage() {
    const { user } = useAuth();

    const currentHour = new Date().getHours();
    let greeting = "Good evening";
    if (currentHour < 12) {
        greeting = "Good morning";
    } else if (currentHour < 18) {
        greeting = "Good afternoon";
    }

    return (
        <div className="">
            {/* Breadcrumb navigation */}
            <header>
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <Link href="/" className="hover:text-foreground transition-colors">
                        <Home className="h-3.5 w-3.5 inline-block mr-1" />
                        Home
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">Dashboard</span>
                </nav>

                {/* Header with background */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex flex-col space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold flex items-center">
                                            <Layout className="mr-2 h-5 w-5 text-primary" />
                                            {greeting}, {user?.name?.split(" ")[0] || "there"}!
                                        </h1>
                                    </div>
                                    <p className="text-muted-foreground mt-1">
                                        Welcome to your dashboard. Here's what's happening with your quizzes.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button asChild>
                                        <Link href="/dashboard/quizzes/new">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Quiz
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="grid gap-6">
                {/* Stats cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                4 published, 8 drafts
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold">3</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Next post in 2 days
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                            <CardTitle className="text-sm font-medium">Quiz Views</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold">2,856</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                +28% from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold">72%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                +5% from last month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Two column section */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Quick actions and upcoming posts - 8 columns on large screens */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Quick Actions
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
                                        Actions
                                    </Badge>
                                </div>
                                <CardDescription>
                                    Frequently used actions to help you get started
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                                <Button asChild variant="default" size="lg" className="h-auto py-4 justify-start">
                                    <Link href="/dashboard/quizzes">
                                        <div className="flex flex-col items-start text-left">
                                            <div className="flex items-center">
                                                <FileText className="h-4 w-4 mr-2" />
                                                <span className="font-medium">Manage Quizzes</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                View and edit your existing quizzes
                                            </span>
                                        </div>
                                    </Link>
                                </Button>
                                <Button asChild variant="default" size="lg" className="h-auto py-4 justify-start">
                                    <Link href="/dashboard/quizzes/new">
                                        <div className="flex flex-col items-start text-left">
                                            <div className="flex items-center">
                                                <Plus className="h-4 w-4 mr-2" />
                                                <span className="font-medium">Create Quiz</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                Build a new quiz from scratch
                                            </span>
                                        </div>
                                    </Link>
                                </Button>
                                <Button asChild variant="default" size="lg" className="h-auto py-4 justify-start">
                                    <Link href="/dashboard/calendar">
                                        <div className="flex flex-col items-start text-left">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                <span className="font-medium">Calendar</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                Schedule and manage your posts
                                            </span>
                                        </div>
                                    </Link>
                                </Button>
                                <Button asChild variant="default" size="lg" className="h-auto py-4 justify-start">
                                    <Link href="/dashboard/ai-generator">
                                        <div className="flex flex-col items-start text-left">
                                            <div className="flex items-center">
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                <span className="font-medium">AI Generator</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-1">
                                                Generate quizzes with AI assistance
                                            </span>
                                        </div>
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="discover" className="space-y-4">
                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                                Learning Resources
                                            </CardTitle>
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-200">
                                                Resources
                                            </Badge>
                                        </div>
                                        <TabsList className="grid grid-cols-3 h-9">
                                            <TabsTrigger value="discover" className="text-xs">
                                                <PieChart className="w-4 h-4 mr-2" />
                                                Discover
                                            </TabsTrigger>
                                            <TabsTrigger value="resources" className="text-xs">
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Resources
                                            </TabsTrigger>
                                            <TabsTrigger value="tips" className="text-xs">
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Quick Tips
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <TabsContent value="discover" className="m-0 p-0 space-y-6">
                                        <div className="grid gap-4 grid-cols-3">
                                            <div className="space-y-3 border rounded-lg p-4">
                                                <div className="flex justify-center">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <PieChart className="h-6 w-6 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="font-medium">Analytics</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Track quiz performance
                                                    </p>
                                                </div>
                                                <div className="pt-2">
                                                    <Button asChild variant="outline" size="sm" className="w-full">
                                                        <Link href="/dashboard/analytics">View</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-3 border rounded-lg p-4">
                                                <div className="flex justify-center">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <BookOpen className="h-6 w-6 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="font-medium">Dictionary</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Quiz terminology
                                                    </p>
                                                </div>
                                                <div className="pt-2">
                                                    <Button asChild variant="outline" size="sm" className="w-full">
                                                        <Link href="/dashboard/dictionary">Browse</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-3 border rounded-lg p-4">
                                                <div className="flex justify-center">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Settings className="h-6 w-6 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="font-medium">Settings</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Customize account
                                                    </p>
                                                </div>
                                                <div className="pt-2">
                                                    <Button asChild variant="outline" size="sm" className="w-full">
                                                        <Link href="/dashboard/settings">Manage</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="resources" className="m-0 p-0 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 border rounded-md">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium mb-1">Quiz Creation Guide</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Learn how to create engaging quizzes that keep participants interested.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 border rounded-md">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium mb-1">AI Generator Tutorial</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Master the AI generator to create quizzes in seconds with perfect questions.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 border rounded-md">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <LineChart className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium mb-1">Analytics Interpretation</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Understand your quiz performance metrics and improve engagement.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="tips" className="m-0 p-0 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-primary">1</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Keep questions concise.</span> Shorter questions have higher completion rates.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-primary">2</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Use images.</span> Quizzes with images get 38% more engagement.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-primary">3</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Schedule strategically.</span> Weekdays between 11am-2pm get the highest participation.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-primary">4</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Vary difficulty.</span> Mix easy and challenging questions to keep users engaged.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-medium text-primary">5</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Use the AI generator.</span> AI-generated quizzes get 27% more completions.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </CardContent>
                            </Card>
                        </Tabs>
                    </div>

                    {/* Right sidebar - 4 columns on large screens */}
                    <div className="col-span-12 lg:col-span-4">
                        <Card className="sticky top-20 border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Upcoming Posts
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                                        Scheduled
                                    </Badge>
                                </div>
                                <CardDescription>
                                    Your scheduled quiz posts
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-4">
                                    <div className="border rounded-md p-4 relative">
                                        <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs py-1 px-2 rounded">Today</div>
                                        <h3 className="font-medium">World Geography Quiz</h3>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <Clock className="h-3.5 w-3.5 mr-1" />
                                            <span>6:00 PM</span>
                                        </div>
                                    </div>
                                    <div className="border rounded-md p-4">
                                        <h3 className="font-medium">Music Trivia Challenge</h3>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <Clock className="h-3.5 w-3.5 mr-1" />
                                            <span>Tomorrow at 2:30 PM</span>
                                        </div>
                                    </div>
                                    <div className="border rounded-md p-4">
                                        <h3 className="font-medium">Science Facts Quiz</h3>
                                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                                            <Clock className="h-3.5 w-3.5 mr-1" />
                                            <span>Friday at 11:00 AM</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href="/dashboard/calendar">View All Scheduled Posts</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 