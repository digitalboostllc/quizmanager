import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
    ArrowUpDown,
    Check,
    CreditCard,
    Download,
    Filter,
    MoreHorizontal,
    RefreshCw,
    Search,
    Store,
    X
} from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Subscription Management | Admin Dashboard",
    description: "Manage active subscriptions and billing"
};

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

// Mock data for subscription demonstration
const subscriptions = [
    {
        id: "sub_1LkD9w2eDEqkfLsdjTwMnsQ",
        organizationId: "1",
        organizationName: "Acme Inc",
        organizationSlug: "acme-inc",
        planId: "2",
        planName: "Business",
        status: "active",
        renewalDate: "2023-08-15T00:00:00.000Z",
        startDate: "2023-01-15T00:00:00.000Z",
        endDate: null,
        billingCycle: "monthly",
        amount: 49.99,
        currency: "USD",
        paymentMethod: "visa",
        lastFour: "4242",
        cancelAtPeriodEnd: false,
        ownerName: "John Doe",
        ownerEmail: "john@acme-inc.com"
    },
    {
        id: "sub_2NfE9j3eDEqkfLsdjUmPaqR",
        organizationId: "2",
        organizationName: "Globex Corporation",
        organizationSlug: "globex-corp",
        planId: "3",
        planName: "Enterprise",
        status: "active",
        renewalDate: "2023-09-05T00:00:00.000Z",
        startDate: "2023-02-05T00:00:00.000Z",
        endDate: null,
        billingCycle: "annual",
        amount: 499.99,
        currency: "USD",
        paymentMethod: "mastercard",
        lastFour: "8888",
        cancelAtPeriodEnd: false,
        ownerName: "Jane Smith",
        ownerEmail: "jane@globexcorp.com"
    },
    {
        id: "sub_3WnD5l4eDEqkfLsdjWjNxeT",
        organizationId: "3",
        organizationName: "Initech",
        organizationSlug: "initech",
        planId: "1",
        planName: "Pro",
        status: "canceled",
        renewalDate: null,
        startDate: "2023-03-18T00:00:00.000Z",
        endDate: "2023-06-18T00:00:00.000Z",
        billingCycle: "monthly",
        amount: 19.99,
        currency: "USD",
        paymentMethod: "visa",
        lastFour: "1111",
        cancelAtPeriodEnd: true,
        ownerName: "Michael Bolton",
        ownerEmail: "michael@initech.com"
    },
    {
        id: "sub_4ZkE7m5eDEqkfLsdjYgRveU",
        organizationId: "4",
        organizationName: "Stark Industries",
        organizationSlug: "stark-industries",
        planId: "3",
        planName: "Enterprise",
        status: "active",
        renewalDate: "2024-01-22T00:00:00.000Z",
        startDate: "2023-01-22T00:00:00.000Z",
        endDate: null,
        billingCycle: "annual",
        amount: 499.99,
        currency: "USD",
        paymentMethod: "amex",
        lastFour: "9999",
        cancelAtPeriodEnd: false,
        ownerName: "Tony Stark",
        ownerEmail: "tony@stark.com"
    },
    {
        id: "sub_5KmF2n6eDEqkfLsdjZpTweV",
        organizationId: "5",
        organizationName: "Wayne Enterprises",
        organizationSlug: "wayne-enterprises",
        planId: "2",
        planName: "Business",
        status: "past_due",
        renewalDate: "2023-06-14T00:00:00.000Z",
        startDate: "2023-02-14T00:00:00.000Z",
        endDate: null,
        billingCycle: "monthly",
        amount: 49.99,
        currency: "USD",
        paymentMethod: "visa",
        lastFour: "4444",
        cancelAtPeriodEnd: false,
        ownerName: "Bruce Wayne",
        ownerEmail: "bruce@wayne.com"
    }
];

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Check className="h-3 w-3 mr-1" />
                    Active
                </Badge>
            );
        case "canceled":
            return (
                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted">
                    <X className="h-3 w-3 mr-1" />
                    Canceled
                </Badge>
            );
        case "past_due":
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Past Due
                </Badge>
            );
        case "incomplete":
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                    Incomplete
                </Badge>
            );
        case "unpaid":
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                    Unpaid
                </Badge>
            );
        default:
            return (
                <Badge variant="outline">
                    {status}
                </Badge>
            );
    }
}

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

function formatPaymentMethod(method: string, lastFour: string): JSX.Element {
    const methodIcon = () => {
        switch (method) {
            case 'visa':
                return '💳 Visa';
            case 'mastercard':
                return '💳 Mastercard';
            case 'amex':
                return '💳 Amex';
            default:
                return '💳 Card';
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <span>{methodIcon()}</span>
            <span className="text-xs text-muted-foreground">•••• {lastFour}</span>
        </div>
    );
}

export default function SubscriptionsPage() {
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
                                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                    Admin Dashboard
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Subscription Management</h1>
                                <p className="text-muted-foreground">
                                    Manage active subscriptions and billing
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Subscriptions
                                </Button>
                                <Button>
                                    <Store className="mr-2 h-4 w-4" />
                                    Manage Plans
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {subscriptions.filter(sub => sub.status === "active").length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(subscriptions.filter(sub => sub.status === "active").length / subscriptions.length * 100)}% of total
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(
                                subscriptions
                                    .filter(sub => sub.status === "active" && sub.billingCycle === "monthly")
                                    .reduce((acc, sub) => acc + sub.amount, 0),
                                "USD"
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            From {subscriptions.filter(sub => sub.status === "active" && sub.billingCycle === "monthly").length} subscriptions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(
                                subscriptions
                                    .filter(sub => sub.status === "active" && sub.billingCycle === "annual")
                                    .reduce((acc, sub) => acc + sub.amount, 0),
                                "USD"
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            From {subscriptions.filter(sub => sub.status === "active" && sub.billingCycle === "annual").length} subscriptions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Payments Due</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {subscriptions.filter(sub => sub.status === "past_due").length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-amber-500 font-medium">
                                {Math.round(subscriptions.filter(sub => sub.status === "past_due").length / subscriptions.length * 100)}%
                            </span> require attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Subscription Filters</CardTitle>
                    <CardDescription>
                        Filter and search subscriptions by various criteria
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="grid w-full max-w-sm gap-1.5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search organizations..."
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="grid w-full max-w-sm gap-1.5">
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="free">Free</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid w-full max-w-sm gap-1.5">
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                    <SelectItem value="past_due">Past Due</SelectItem>
                                    <SelectItem value="incomplete">Incomplete</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/admin/plans">
                                    <Store className="h-4 w-4 mr-2" />
                                    Manage Plans
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscriptions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscriptions</CardTitle>
                    <CardDescription>
                        Showing all active and past subscriptions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Billing</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>
                                    <div className="flex items-center">
                                        Renewal Date
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{sub.organizationName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{sub.organizationName}</div>
                                                <div className="text-xs text-muted-foreground">{sub.ownerEmail}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                                            {sub.planName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(sub.status)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="capitalize">{sub.billingCycle}</span>
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(sub.amount, sub.currency)}
                                    </TableCell>
                                    <TableCell>
                                        {formatPaymentMethod(sub.paymentMethod, sub.lastFour)}
                                    </TableCell>
                                    <TableCell>
                                        {sub.renewalDate ? formatDate(sub.renewalDate) : '—'}
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
                                                    <Link href={`/dashboard/admin/subscriptions/${sub.id}`}>
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/admin/subscriptions/${sub.id}/edit`}>
                                                        Edit Subscription
                                                    </Link>
                                                </DropdownMenuItem>
                                                {sub.status === 'active' && (
                                                    <DropdownMenuItem>
                                                        Cancel Subscription
                                                    </DropdownMenuItem>
                                                )}
                                                {sub.status === 'past_due' && (
                                                    <DropdownMenuItem>
                                                        Process Payment
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/admin/organizations/${sub.organizationId}`}>
                                                        View Organization
                                                    </Link>
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
        </div>
    );
} 