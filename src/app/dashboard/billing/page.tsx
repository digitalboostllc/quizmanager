"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ResourceType } from "@/lib/usage-limits";
import { Check, ChevronDown, CreditCard, Download, FileText, History, RefreshCcw, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface PlanFeature {
    name: string;
    included: boolean;
    limit?: number;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: "monthly" | "yearly";
    features: PlanFeature[];
    isCurrentPlan?: boolean;
}

interface UsageLimits {
    [key: string]: {
        current: number;
        limit: number;
        label: string;
    };
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    downloadUrl?: string;
}

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [usageLimits, setUsageLimits] = useState<UsageLimits>({});
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const { toast } = useToast();
    const { user } = useAuth();

    // Grid background style for the header
    const gridBgStyle = {
        backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
        backgroundSize: '20px 20px',
    };

    useEffect(() => {
        // Simulated data loading
        setTimeout(() => {
            // Simulated plans data
            const mockPlans: Plan[] = [
                {
                    id: "free",
                    name: "Free",
                    description: "Basic features for individuals",
                    price: 0,
                    interval: "monthly",
                    features: [
                        { name: "5 quizzes per month", included: true, limit: 5 },
                        { name: "Basic templates", included: true, limit: 2 },
                        { name: "Email support", included: false },
                    ],
                    isCurrentPlan: true,
                },
                {
                    id: "pro",
                    name: "Pro",
                    description: "Advanced features for professionals",
                    price: 19.99,
                    interval: "monthly",
                    features: [
                        { name: "Unlimited quizzes", included: true, limit: -1 },
                        { name: "All templates", included: true, limit: -1 },
                        { name: "Priority support", included: true },
                    ],
                },
                {
                    id: "team",
                    name: "Team",
                    description: "Collaboration tools for teams",
                    price: 49.99,
                    interval: "monthly",
                    features: [
                        { name: "Unlimited quizzes", included: true, limit: -1 },
                        { name: "All templates", included: true, limit: -1 },
                        { name: "Priority support", included: true },
                        { name: "Team collaboration", included: true },
                        { name: "Advanced analytics", included: true },
                    ],
                },
            ];

            const yearlyPlans = mockPlans.map(plan => ({
                ...plan,
                interval: "yearly" as const,
                price: plan.price * 10, // 2 months free
            }));

            // Find current plan
            const current = mockPlans.find(p => p.isCurrentPlan);

            // Simulated usage data
            const mockUsageLimits: UsageLimits = {
                quizzes: {
                    current: 3,
                    limit: 5,
                    label: "Quizzes"
                },
                templates: {
                    current: 1,
                    limit: 2,
                    label: "Templates"
                },
                teamMembers: {
                    current: 1,
                    limit: 1,
                    label: "Team Members"
                },
                storage: {
                    current: 15,
                    limit: 50,
                    label: "Storage (MB)"
                }
            };

            // Simulated invoices
            const mockInvoices: Invoice[] = [
                {
                    id: "INV-001",
                    date: "2023-03-01",
                    amount: 19.99,
                    status: "Paid",
                    downloadUrl: "#"
                },
                {
                    id: "INV-002",
                    date: "2023-04-01",
                    amount: 19.99,
                    status: "Paid",
                    downloadUrl: "#"
                },
                {
                    id: "INV-003",
                    date: "2023-05-01",
                    amount: 19.99,
                    status: "Pending"
                }
            ];

            setPlans([...mockPlans, ...yearlyPlans]);
            setCurrentPlan(current || null);
            setUsageLimits(mockUsageLimits);
            setInvoices(mockInvoices);
            setLoading(false);
        }, 1000);
    }, []);

    const handleUpgradePlan = async (planId: string) => {
        try {
            setLoading(true);
            // This would be a real API call in a production app
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    planId,
                    priceId: "price_123", // This would be a real Stripe price ID
                    interval: billingCycle,
                    successUrl: `${window.location.origin}/dashboard/billing?success=true`,
                    cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`
                })
            });

            const data = await response.json();

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Error upgrading plan:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to upgrade plan. Please try again later."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setLoading(true);
            // This would be a real API call in a production app
            const response = await fetch("/api/billing-portal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    returnUrl: `${window.location.origin}/dashboard/billing`
                })
            });

            const data = await response.json();

            // Redirect to Stripe Billing Portal
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Error opening billing portal:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to open billing portal. Please try again later."
            });
        } finally {
            setLoading(false);
        }
    };

    const renderPricing = (price: number) => {
        if (price === 0) return "Free";
        return `$${price.toFixed(2)}${billingCycle === "monthly" ? "/month" : "/year"}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    return (
        <div className="space-y-6">
            {/* Standardized Header */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                    Subscription
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Billing & Subscription</h1>
                                <p className="text-muted-foreground">
                                    Manage your subscription plan and billing information
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handleManageSubscription}>
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Manage Subscription
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="subscription" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="subscription" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Subscription</span>
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        <span>Usage</span>
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <span>Billing History</span>
                    </TabsTrigger>
                </TabsList>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="space-y-4">
                    {/* Current Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>
                                Your current subscription plan and billing cycle
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-semibold">{currentPlan?.name || "Free Plan"}</h3>
                                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                                                {currentPlan?.interval === "yearly" ? "Yearly" : "Monthly"}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground">{currentPlan?.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-lg font-medium">{renderPricing(currentPlan?.price || 0)}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Your next billing date is June 1, 2023
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <div className="text-sm text-muted-foreground">
                                Need help with your subscription? <a href="#" className="text-primary hover:underline">Contact support</a>
                            </div>
                            <Button variant="outline" onClick={handleManageSubscription} disabled={loading}>
                                Manage Subscription
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Available Plans */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Plans</CardTitle>
                            <CardDescription>
                                Choose the plan that works best for you
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-end mb-4">
                                <div className="flex items-center rounded-lg border p-1">
                                    <Button
                                        variant={billingCycle === "monthly" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setBillingCycle("monthly")}
                                        className="rounded-md"
                                    >
                                        Monthly
                                    </Button>
                                    <Button
                                        variant={billingCycle === "yearly" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setBillingCycle("yearly")}
                                        className="rounded-md"
                                    >
                                        Yearly (Save 20%)
                                    </Button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-64 rounded-lg" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {plans
                                        .filter(plan => plan.interval === billingCycle)
                                        .map(plan => (
                                            <Card key={plan.id} className={`border ${plan.isCurrentPlan ? 'border-primary' : ''}`}>
                                                <CardHeader className="pb-3">
                                                    <CardTitle>{plan.name}</CardTitle>
                                                    <CardDescription>{plan.description}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="mb-4">
                                                        <div className="text-2xl font-bold">{renderPricing(plan.price)}</div>
                                                        {plan.interval === "yearly" && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Billed annually (save 20%)
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <ul className="space-y-2 text-sm mt-4">
                                                        {plan.features.map((feature, index) => (
                                                            <li key={index} className="flex items-center gap-2">
                                                                <Check className={`h-4 w-4 ${feature.included ? 'text-primary' : 'text-muted-foreground'}`} />
                                                                <span>{feature.name}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button
                                                        className="w-full"
                                                        variant={plan.isCurrentPlan ? "outline" : "default"}
                                                        disabled={plan.isCurrentPlan || loading}
                                                        onClick={() => handleUpgradePlan(plan.id)}
                                                    >
                                                        {plan.isCurrentPlan ? "Current Plan" : "Upgrade"}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Usage Tab */}
                <TabsContent value="usage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Usage</CardTitle>
                            <CardDescription>
                                Track your current resource usage against your plan limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-2 w-full" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.keys(usageLimits).map((key) => {
                                        const resource = usageLimits[key as ResourceType];
                                        const percentage = resource.limit === -1 ? 0 : (resource.current / resource.limit) * 100;
                                        const isUnlimited = resource.limit === -1;

                                        return (
                                            <div key={key} className="space-y-2">
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span>{resource.label}</span>
                                                    <span>
                                                        {resource.current} / {isUnlimited ? "Unlimited" : resource.limit}
                                                    </span>
                                                </div>
                                                <Progress value={isUnlimited ? 5 : percentage} className={isUnlimited ? "opacity-40" : ""} />
                                                <div className="text-xs text-muted-foreground">
                                                    {isUnlimited ? (
                                                        "Unlimited with your current plan"
                                                    ) : percentage >= 80 ? (
                                                        <span className="text-amber-600">
                                                            {percentage >= 100 ? "Limit reached. " : "Approaching limit. "}
                                                            Consider upgrading your plan.
                                                        </span>
                                                    ) : (
                                                        `${resource.limit - resource.current} ${resource.label.toLowerCase()} remaining`
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <div className="flex items-center justify-between w-full">
                                <div className="text-sm text-muted-foreground">
                                    Last updated: {new Date().toLocaleTimeString()}
                                </div>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <RefreshCcw className="h-3 w-3" />
                                    Refresh
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing History</CardTitle>
                            <CardDescription>
                                View and download your past invoices
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-64 w-full" />
                            ) : invoices.length ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">{invoice.id}</TableCell>
                                                <TableCell>{formatDate(invoice.date)}</TableCell>
                                                <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {invoice.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {invoice.downloadUrl && (
                                                                <DropdownMenuItem className="cursor-pointer">
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                View details
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                                    <h3 className="text-lg font-medium">No invoices yet</h3>
                                    <p className="text-muted-foreground mt-1">
                                        You don't have any invoices yet. They'll appear here when you make a payment.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 