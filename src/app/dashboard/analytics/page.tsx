"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart,
    BarChart3,
    Calendar,
    Clock,
    Download,
    LineChart,
    PieChart,
    PieChart as PieChartIcon,
    TrendingUp,
    Users
} from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Track performance and engagement across your quizzes.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Tabs defaultValue="overview" className="w-full sm:w-auto">
                    <TabsList className="grid w-full sm:w-auto grid-cols-4 sm:flex">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="exports">Exports</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select defaultValue="30days">
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select time period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 days</SelectItem>
                            <SelectItem value="30days">Last 30 days</SelectItem>
                            <SelectItem value="90days">Last 90 days</SelectItem>
                            <SelectItem value="year">Last 12 months</SelectItem>
                            <SelectItem value="alltime">All time</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <TabsContent value="overview" className="space-y-6 m-0">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">156</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-emerald-500 font-medium">+12%</span> from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3,248</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-emerald-500 font-medium">+18%</span> from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
                            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">78.3%</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-rose-500 font-medium">-2.5%</span> from last month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24s</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-emerald-500 font-medium">+1.2s</span> faster than last month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Participant Growth</CardTitle>
                            <CardDescription>
                                New participants over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-2">
                            <div className="h-[300px] flex items-center justify-center">
                                <LineChart className="h-full w-full text-muted-foreground opacity-50" />
                                {/* This would be replaced with an actual chart component */}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Quiz Engagement</CardTitle>
                            <CardDescription>
                                Breakdown by quiz category
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-2">
                            <div className="h-[300px] flex items-center justify-center">
                                <PieChart className="h-full w-full text-muted-foreground opacity-50" />
                                {/* This would be replaced with an actual chart component */}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Performing Quizzes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Quizzes</CardTitle>
                        <CardDescription>
                            Your best quizzes by completion rate and participant count
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b pb-2">
                                <div className="col-span-3">Quiz</div>
                                <div className="text-center">Participants</div>
                                <div className="text-center">Completion</div>
                                <div className="text-center">Avg. Score</div>
                                <div className="text-right">Trend</div>
                            </div>

                            {[
                                { name: "Science Quiz: The Solar System", category: "Science", participants: 423, completion: "92%", score: "76%", trend: "up" },
                                { name: "History Quiz: Ancient Civilizations", category: "History", participants: 356, completion: "87%", score: "68%", trend: "up" },
                                { name: "Geography: World Capitals", category: "Geography", participants: 287, completion: "85%", score: "71%", trend: "down" },
                                { name: "Literature: Classic Novels", category: "Literature", participants: 256, completion: "80%", score: "65%", trend: "up" },
                                { name: "Math Challenge: Algebra Basics", category: "Mathematics", participants: 213, completion: "72%", score: "59%", trend: "neutral" }
                            ].map((quiz, index) => (
                                <div key={index} className="grid grid-cols-7 py-3 items-center text-sm border-b last:border-0">
                                    <div className="col-span-3 flex flex-col">
                                        <span className="font-medium">{quiz.name}</span>
                                        <span className="text-xs text-muted-foreground">{quiz.category}</span>
                                    </div>
                                    <div className="text-center">{quiz.participants}</div>
                                    <div className="text-center">{quiz.completion}</div>
                                    <div className="text-center">{quiz.score}</div>
                                    <div className="text-right">
                                        {quiz.trend === "up" && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">↑ 5.3%</Badge>}
                                        {quiz.trend === "down" && <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">↓ 2.1%</Badge>}
                                        {quiz.trend === "neutral" && <Badge variant="outline">― 0%</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-6 m-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Quiz Performance</CardTitle>
                        <CardDescription>
                            Detailed analytics for individual quizzes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                            <h3 className="mt-4 text-lg font-semibold">Select a Quiz to View Analytics</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Choose a quiz from your library to view detailed performance metrics
                            </p>
                            <Button className="mt-4">
                                Browse Quizzes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 m-0">
                <Card>
                    <CardHeader>
                        <CardTitle>User Demographics</CardTitle>
                        <CardDescription>
                            Insights about your quiz participants
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                            <h3 className="mt-4 text-lg font-semibold">User Analytics Coming Soon</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Detailed user demographics and engagement metrics are under development
                            </p>
                            <Button className="mt-4" variant="outline">
                                Request This Feature
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="exports" className="space-y-6 m-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Exports</CardTitle>
                        <CardDescription>
                            Download your quiz data for further analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BarChart className="h-5 w-5 text-primary" />
                                        <div>
                                            <h3 className="font-medium">Quiz Performance Report</h3>
                                            <p className="text-sm text-muted-foreground">Detailed metrics on quiz performance and participant scores</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-primary" />
                                        <div>
                                            <h3 className="font-medium">Participant Data</h3>
                                            <p className="text-sm text-muted-foreground">Information about participants and their quiz attempts</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        <div>
                                            <h3 className="font-medium">Activity Timeline</h3>
                                            <p className="text-sm text-muted-foreground">Chronological data on quiz creations and completions</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        <div>
                                            <h3 className="font-medium">Growth Analytics</h3>
                                            <p className="text-sm text-muted-foreground">Trends and growth data for your quiz platform usage</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" disabled>
                                        <Download className="mr-2 h-4 w-4" />
                                        Premium Only
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
    );
} 