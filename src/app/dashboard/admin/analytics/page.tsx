import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity,
    BarChart3,
    ChevronDown,
    CreditCard,
    Download,
    LineChart,
    Users
} from "lucide-react";

export const metadata = {
    title: "Analytics | Admin Dashboard",
    description: "Platform usage and performance analytics"
};

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                                    Admin Dashboard
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Platform Analytics</h1>
                                <p className="text-muted-foreground">
                                    Review comprehensive platform metrics and performance insights
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Data
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
                <div className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm">
                    <span className="mr-2">Last 30 days</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2,350</div>
                        <p className="text-xs text-muted-foreground">
                            +180.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-muted-foreground">
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.28%</div>
                        <p className="text-xs text-muted-foreground">
                            +1.2% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>
                                Monthly revenue and subscription trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col justify-center items-center">
                            <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-10 text-muted-foreground">
                                <LineChart className="h-10 w-10" />
                                <span className="ml-4 text-lg">Revenue Chart Visualization</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Growth Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Growth Metrics</CardTitle>
                                <CardDescription>
                                    User acquisition and retention
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <BarChart3 className="h-8 w-8" />
                                    <span className="ml-3 text-lg">User Growth Chart</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Platform Usage */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Usage</CardTitle>
                                <CardDescription>
                                    Feature engagement and activity
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <Activity className="h-8 w-8" />
                                    <span className="ml-3 text-lg">Usage Activity Chart</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Demographics</CardTitle>
                            <CardDescription>
                                Geographic and device distribution
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col justify-center items-center">
                            <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-10 text-muted-foreground">
                                <Users className="h-10 w-10" />
                                <span className="ml-4 text-lg">User Demographics Visualization</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Retention</CardTitle>
                                <CardDescription>
                                    Cohort analysis of user retention
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <BarChart3 className="h-8 w-8" />
                                    <span className="ml-3 text-lg">Retention Chart</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Users</CardTitle>
                                <CardDescription>
                                    Daily and monthly active users
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <Activity className="h-8 w-8" />
                                    <span className="ml-3 text-lg">Active Users Chart</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="revenue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Plan</CardTitle>
                            <CardDescription>
                                Distribution of revenue across subscription plans
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col justify-center items-center">
                            <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-10 text-muted-foreground">
                                <CreditCard className="h-10 w-10" />
                                <span className="ml-4 text-lg">Revenue Distribution Chart</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>MRR Growth</CardTitle>
                                <CardDescription>
                                    Monthly recurring revenue trends
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <LineChart className="h-8 w-8" />
                                    <span className="ml-3 text-lg">MRR Chart</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Churn Analysis</CardTitle>
                                <CardDescription>
                                    Subscription cancellations and downgrades
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <Activity className="h-8 w-8" />
                                    <span className="ml-3 text-lg">Churn Rate Chart</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Creation</CardTitle>
                            <CardDescription>
                                Quiz and template creation metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col justify-center items-center">
                            <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-10 text-muted-foreground">
                                <BarChart3 className="h-10 w-10" />
                                <span className="ml-4 text-lg">Content Creation Chart</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Popular Templates</CardTitle>
                                <CardDescription>
                                    Most used quiz templates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <BarChart3 className="h-8 w-8" />
                                    <span className="ml-3 text-lg">Templates Usage Chart</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Storage Usage</CardTitle>
                                <CardDescription>
                                    Storage utilization across organizations
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[220px] flex flex-col justify-center items-center">
                                <div className="flex items-center justify-center bg-muted/20 rounded-md w-full h-full p-8 text-muted-foreground">
                                    <Activity className="h-8 w-8" />
                                    <span className="ml-3 text-lg">Storage Usage Chart</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 