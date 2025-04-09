import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart3,
    CreditCard,
    DollarSign,
    HardDrive,
    ShieldAlert,
    Store,
    Users
} from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Admin Dashboard | Quiz Manager",
    description: "Administration tools for Quiz Manager platform"
};

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export default function AdminDashboardPage() {
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
                                    <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                                    Administration
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
                                <p className="text-muted-foreground">
                                    Manage users, organizations, subscriptions, and platform settings
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Reports
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,283</div>
                        <p className="text-xs text-muted-foreground">
                            +23 this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">89</div>
                        <p className="text-xs text-muted-foreground">
                            +4 this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">73</div>
                        <p className="text-xs text-muted-foreground">
                            +7 this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$4,891</div>
                        <p className="text-xs text-muted-foreground">
                            +14.2% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Admin Sections */}
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid grid-cols-6 h-10 mb-4">
                    <TabsTrigger value="users" className="flex items-center gap-2 text-xs">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Users</span>
                    </TabsTrigger>
                    <TabsTrigger value="organizations" className="flex items-center gap-2 text-xs">
                        <HardDrive className="h-4 w-4" />
                        <span className="hidden sm:inline">Organizations</span>
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Subscriptions</span>
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2 text-xs">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">Plans</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 text-xs">
                        <ShieldAlert className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                Manage user accounts, roles, and permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Manage all users on the platform, adjust their roles and permissions,
                                    or review their activity. You can also create new admin accounts.
                                </p>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href="/dashboard/admin/users">
                                            Manage Users
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="organizations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Management</CardTitle>
                            <CardDescription>
                                Manage organizations, teams, and their members
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Manage all organizations on the platform, review their members,
                                    adjust subscription plans, or view their content usage.
                                </p>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href="/dashboard/admin/organizations">
                                            Manage Organizations
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Management</CardTitle>
                            <CardDescription>
                                Manage active subscriptions and billing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Manage all active subscriptions, review billing history,
                                    handle refunds, or adjust subscription details.
                                </p>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href="/dashboard/admin/subscriptions">
                                            Manage Subscriptions
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Management</CardTitle>
                            <CardDescription>
                                Manage subscription plans and pricing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Create and manage subscription plans, set pricing,
                                    define features, and adjust usage limits.
                                </p>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href="/dashboard/admin/plans">
                                            Manage Plans
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Analytics</CardTitle>
                            <CardDescription>
                                Review platform usage and performance metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    View detailed analytics about platform usage, revenue metrics,
                                    user growth, and content engagement.
                                </p>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href="/dashboard/admin/analytics">
                                            View Analytics
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Settings</CardTitle>
                            <CardDescription>
                                Configure global platform settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Manage global platform settings, system configurations,
                                    default values, and feature flags.
                                </p>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href="/dashboard/admin/settings">
                                            Manage Settings
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 