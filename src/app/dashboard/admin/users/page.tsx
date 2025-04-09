import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
    CheckCircle,
    Download,
    Edit2,
    Filter,
    MoreHorizontal,
    Plus,
    Search,
    ShieldAlert,
    Trash2,
    Users
} from "lucide-react";

export const metadata = {
    title: "User Management | Admin Dashboard",
    description: "Manage user accounts, roles, and permissions"
};

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

// Mock data for user demonstration
const users = [
    {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        role: "ADMIN",
        status: "active",
        createdAt: "2023-01-15T00:00:00.000Z",
        organizations: 2,
        lastActive: "2023-04-26T14:30:00.000Z",
        avatar: null
    },
    {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "USER",
        status: "active",
        createdAt: "2023-02-22T00:00:00.000Z",
        organizations: 1,
        lastActive: "2023-04-25T09:15:00.000Z",
        avatar: "/avatars/jane.jpg"
    },
    {
        id: "3",
        name: "Robert Johnson",
        email: "robert@example.com",
        role: "USER",
        status: "inactive",
        createdAt: "2023-03-10T00:00:00.000Z",
        organizations: 0,
        lastActive: "2023-04-01T16:45:00.000Z",
        avatar: null
    },
    {
        id: "4",
        name: "Emily Chen",
        email: "emily@example.com",
        role: "USER",
        status: "active",
        createdAt: "2023-03-18T00:00:00.000Z",
        organizations: 3,
        lastActive: "2023-04-26T10:20:00.000Z",
        avatar: "/avatars/emily.jpg"
    },
    {
        id: "5",
        name: "Michael Williams",
        email: "michael@example.com",
        role: "USER",
        status: "suspended",
        createdAt: "2023-04-05T00:00:00.000Z",
        organizations: 1,
        lastActive: "2023-04-20T11:30:00.000Z",
        avatar: null
    }
];

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function getRoleBadge(role: string) {
    switch (role) {
        case "ADMIN":
            return (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Admin
                </Badge>
            );
        case "USER":
            return (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                    User
                </Badge>
            );
        default:
            return (
                <Badge variant="outline">
                    {role}
                </Badge>
            );
    }
}

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

export default function UserManagementPage() {
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
                                    <Users className="h-3.5 w-3.5 mr-1.5" />
                                    Admin Dashboard
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">User Management</h1>
                                <p className="text-muted-foreground">
                                    Manage user accounts, roles, and permissions
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Users
                                </Button>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
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
                    <Input placeholder="Search users..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                </Select>
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
                <Button variant="outline" className="gap-1.5 w-full sm:w-auto">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        Showing all users on the platform
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Organizations</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                {user.avatar && (
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                )}
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getRoleBadge(user.role)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(user.status)}
                                    </TableCell>
                                    <TableCell>{user.organizations}</TableCell>
                                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                                    <TableCell>{formatDate(user.lastActive)}</TableCell>
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
                                                <DropdownMenuItem>
                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <ShieldAlert className="h-4 w-4 mr-2" />
                                                    Change Role
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete User
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