import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    CheckCircle2,
    CreditCard,
    DollarSign,
    Edit2,
    MoreHorizontal,
    Plus,
    Store,
    Trash2,
    XCircle
} from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Subscription Plans | Admin Dashboard",
    description: "Manage subscription plans and pricing"
};

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

// Mock data for plan demonstration
const plans = [
    {
        id: "1",
        name: "Free",
        description: "Basic features for individuals",
        monthlyPrice: 0,
        yearlyPrice: 0,
        isActive: true,
        features: [
            { name: "5 quizzes per month", included: true },
            { name: "Basic templates", included: true },
            { name: "Limited analytics", included: true },
            { name: "Email support", included: false },
            { name: "Team collaboration", included: false },
            { name: "Custom branding", included: false },
        ],
        limits: {
            quizzes: 5,
            templates: 2,
            users: 1,
            storage: 50, // MB
        },
        subscriptionCount: 842,
        createdAt: "2023-01-01T00:00:00.000Z",
        stripeProductId: null,
        sortOrder: 1,
    },
    {
        id: "2",
        name: "Pro",
        description: "Advanced features for professionals",
        monthlyPrice: 19.99,
        yearlyPrice: 199.99,
        isActive: true,
        features: [
            { name: "Unlimited quizzes", included: true },
            { name: "All templates", included: true },
            { name: "Advanced analytics", included: true },
            { name: "Priority email support", included: true },
            { name: "Team collaboration", included: false },
            { name: "Custom branding", included: false },
        ],
        limits: {
            quizzes: -1, // unlimited
            templates: -1, // unlimited
            users: 1,
            storage: 500, // MB
        },
        subscriptionCount: 256,
        createdAt: "2023-01-01T00:00:00.000Z",
        stripeProductId: "prod_Nh28JKs87Hgks",
        sortOrder: 2,
    },
    {
        id: "3",
        name: "Team",
        description: "Collaboration tools for teams",
        monthlyPrice: 49.99,
        yearlyPrice: 499.99,
        isActive: true,
        features: [
            { name: "Unlimited quizzes", included: true },
            { name: "All templates", included: true },
            { name: "Advanced analytics", included: true },
            { name: "Priority email support", included: true },
            { name: "Team collaboration", included: true },
            { name: "Custom branding", included: true },
        ],
        limits: {
            quizzes: -1, // unlimited
            templates: -1, // unlimited
            users: 10,
            storage: 2000, // MB
        },
        subscriptionCount: 124,
        createdAt: "2023-01-01T00:00:00.000Z",
        stripeProductId: "prod_Nh28JKBs87HgkR",
        sortOrder: 3,
    }
];

function formatCurrency(amount: number): string {
    if (amount === 0) return "Free";
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatLimit(limit: number): string {
    if (limit === -1) return "Unlimited";
    return limit.toString();
}

function formatStorage(mb: number): string {
    if (mb >= 1000) {
        return `${mb / 1000} GB`;
    }
    return `${mb} MB`;
}

export default function PlansManagementPage() {
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
                                    <Store className="h-3.5 w-3.5 mr-1.5" />
                                    Admin Dashboard
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Subscription Plans</h1>
                                <p className="text-muted-foreground">
                                    Manage your subscription plans, pricing, and features
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Sync with Stripe
                                </Button>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Plan
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plans Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>
                        Manage all subscription plans for your SaaS
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Plan Name</TableHead>
                                <TableHead>Monthly Price</TableHead>
                                <TableHead>Yearly Price</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Storage</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Subscribers</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-medium">{plan.name}</div>
                                            <div className="text-xs text-muted-foreground">{plan.description}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(plan.monthlyPrice)}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(plan.yearlyPrice)}
                                    </TableCell>
                                    <TableCell>
                                        {formatLimit(plan.limits.users)}
                                    </TableCell>
                                    <TableCell>
                                        {formatStorage(plan.limits.storage)}
                                    </TableCell>
                                    <TableCell>
                                        {plan.isActive ? (
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactive
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span>{plan.subscriptionCount}</span>
                                            <span className="text-xs text-muted-foreground">subscribers</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/admin/plans/${plan.id}`}>
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        Edit Plan
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <DollarSign className="h-4 w-4 mr-2" />
                                                    Update Pricing
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Plan
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Feature Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Feature Comparison</CardTitle>
                    <CardDescription>
                        Compare features across different plans
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Feature</TableHead>
                                    {plans.map((plan) => (
                                        <TableHead key={plan.id} className="text-center">
                                            {plan.name}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans[0].features.map((feature, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {feature.name}
                                        </TableCell>
                                        {plans.map((plan) => (
                                            <TableCell key={plan.id} className="text-center">
                                                {plan.features[index].included ? (
                                                    <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell className="font-medium">
                                        Maximum Quizzes
                                    </TableCell>
                                    {plans.map((plan) => (
                                        <TableCell key={plan.id} className="text-center font-medium">
                                            {formatLimit(plan.limits.quizzes)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">
                                        Maximum Templates
                                    </TableCell>
                                    {plans.map((plan) => (
                                        <TableCell key={plan.id} className="text-center font-medium">
                                            {formatLimit(plan.limits.templates)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">
                                        Storage
                                    </TableCell>
                                    {plans.map((plan) => (
                                        <TableCell key={plan.id} className="text-center font-medium">
                                            {formatStorage(plan.limits.storage)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 