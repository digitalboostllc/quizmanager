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
    Building2,
    CheckCircle,
    Download,
    Edit2,
    Eye,
    Filter,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Users
} from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Organization Management | Admin Dashboard",
    description: "Manage organizations, teams, and resources"
};

// Mock data for organization demonstration
const organizations = [
    {
        id: "1",
        name: "Acme Inc",
        slug: "acme-inc",
        ownerName: "John Doe",
        ownerEmail: "john@example.com",
        members: 8,
        quizzes: 42,
        templates: 12,
        status: "active",
        planType: "Business",
        createdAt: "2023-01-15T00:00:00.000Z",
        logoUrl: null
    },
    {
        id: "2",
        name: "Globex Corporation",
        slug: "globex-corp",
        ownerName: "Jane Smith",
        ownerEmail: "jane@example.com",
        members: 15,
        quizzes: 93,
        templates: 28,
        status: "active",
        planType: "Enterprise",
        createdAt: "2023-02-05T00:00:00.000Z",
        logoUrl: "/logos/globex.png"
    },
    {
        id: "3",
        name: "Initech",
        slug: "initech",
        ownerName: "Michael Bolton",
        ownerEmail: "michael@example.com",
        members: 5,
        quizzes: 12,
        templates: 4,
        status: "inactive",
        planType: "Pro",
        createdAt: "2023-03-18T00:00:00.000Z",
        logoUrl: null
    },
    {
        id: "4",
        name: "Stark Industries",
        slug: "stark-industries",
        ownerName: "Tony Stark",
        ownerEmail: "tony@example.com",
        members: 22,
        quizzes: 157,
        templates: 35,
        status: "active",
        planType: "Enterprise",
        createdAt: "2023-01-22T00:00:00.000Z",
        logoUrl: "/logos/stark.png"
    },
    {
        id: "5",
        name: "Wayne Enterprises",
        slug: "wayne-enterprises",
        ownerName: "Bruce Wayne",
        ownerEmail: "bruce@example.com",
        members: 12,
        quizzes: 64,
        templates: 19,
        status: "suspended",
        planType: "Business",
        createdAt: "2023-02-14T00:00:00.000Z",
        logoUrl: "/logos/wayne.png"
    }
];

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                </Badge>
            );
        case "inactive":
            return (
                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted">
                    Inactive
                </Badge>
            );
        case "suspended":
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                    Suspended
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

function getPlanBadge(plan: string) {
    switch (plan) {
        case "Enterprise":
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                    Enterprise
                </Badge>
            );
        case "Business":
            return (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200">
                    Business
                </Badge>
            );
        case "Pro":
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                    Pro
                </Badge>
            );
        case "Free":
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    Free
                </Badge>
            );
        default:
            return (
                <Badge variant="outline">
                    {plan}
                </Badge>
            );
    }
}

export default function OrganizationsPage() {
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
                                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                                    Admin Dashboard
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Organization Management</h1>
                                <p className="text-muted-foreground">
                                    Manage organizations, memberships, and subscription plans
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Organization
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search organizations..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" className="gap-1.5 w-full sm:w-auto">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Organizations Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Organizations</CardTitle>
                    <CardDescription>
                        Showing all organizations on the platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Quizzes</TableHead>
                                <TableHead>Templates</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizations.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-medium">{org.name}</div>
                                            <div className="text-xs text-muted-foreground">{org.slug}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{org.ownerName}</div>
                                            <div className="text-xs text-muted-foreground">{org.ownerEmail}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(org.status)}
                                    </TableCell>
                                    <TableCell>
                                        {getPlanBadge(org.planType)}
                                    </TableCell>
                                    <TableCell>{org.members}</TableCell>
                                    <TableCell>{org.quizzes}</TableCell>
                                    <TableCell>{org.templates}</TableCell>
                                    <TableCell>{formatDate(org.createdAt)}</TableCell>
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
                                                    <Link href={`/dashboard/admin/organizations/${org.id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/admin/organizations/${org.id}/edit`}>
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        Edit Organization
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/admin/organizations/${org.id}/members`}>
                                                        <Users className="h-4 w-4 mr-2" />
                                                        Manage Members
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Organization
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