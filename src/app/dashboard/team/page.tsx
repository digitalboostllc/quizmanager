'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertTriangle,
    ClipboardCheck,
    Eye,
    EyeOff,
    Filter,
    Mail,
    MoreHorizontal,
    ShieldAlert,
    ShieldCheck,
    UserPlus
} from "lucide-react";
import { useState } from "react";

// Mock team members data
const TEAM_MEMBERS = [
    {
        id: "1",
        name: "Alex Johnson",
        email: "alex@example.com",
        role: "Owner",
        avatar: "/avatars/01.png",
        status: "active",
        lastActive: "Just now",
        joined: "3 months ago",
        quizzesCreated: 24
    },
    {
        id: "2",
        name: "Sam Wilson",
        email: "sam@example.com",
        role: "Admin",
        avatar: "/avatars/02.png",
        status: "active",
        lastActive: "2 hours ago",
        joined: "2 months ago",
        quizzesCreated: 16
    },
    {
        id: "3",
        name: "Jordan Lee",
        email: "jordan@example.com",
        role: "Editor",
        avatar: "/avatars/03.png",
        status: "active",
        lastActive: "Yesterday",
        joined: "1 month ago",
        quizzesCreated: 8
    },
    {
        id: "4",
        name: "Taylor Swift",
        email: "taylor@example.com",
        role: "Viewer",
        avatar: "/avatars/04.png",
        status: "inactive",
        lastActive: "3 days ago",
        joined: "2 weeks ago",
        quizzesCreated: 0
    },
    {
        id: "5",
        name: "Casey Morgan",
        email: "casey@example.com",
        role: "Editor",
        avatar: "/avatars/05.png",
        status: "pending",
        lastActive: "Never",
        joined: "Invited 3 days ago",
        quizzesCreated: 0
    }
];

// Role permissions mapping
const ROLE_PERMISSIONS = {
    "Owner": [
        "Create, edit, and delete quizzes",
        "Manage team members and roles",
        "Billing and subscription management",
        "Access analytics and reports",
        "Manage integrations and API",
        "Create and manage templates"
    ],
    "Admin": [
        "Create, edit, and delete quizzes",
        "Manage team members and roles",
        "Access analytics and reports",
        "Create and manage templates"
    ],
    "Editor": [
        "Create, edit, and delete own quizzes",
        "View analytics for own quizzes",
        "Use existing templates"
    ],
    "Viewer": [
        "View quizzes and templates",
        "View basic analytics"
    ]
};

// Role color mapping
const ROLE_COLORS = {
    "Owner": "bg-amber-100 text-amber-800 hover:bg-amber-200",
    "Admin": "bg-purple-100 text-purple-800 hover:bg-purple-200",
    "Editor": "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "Viewer": "bg-green-100 text-green-800 hover:bg-green-200"
};

// Activity log data
const ACTIVITY_LOG = [
    {
        id: "1",
        user: "Alex Johnson",
        avatar: "/avatars/01.png",
        action: "created a new quiz",
        target: "Math Quiz #4",
        time: "Just now"
    },
    {
        id: "2",
        user: "Sam Wilson",
        avatar: "/avatars/02.png",
        action: "edited template",
        target: "Science Quiz Template",
        time: "2 hours ago"
    },
    {
        id: "3",
        user: "Jordan Lee",
        avatar: "/avatars/03.png",
        action: "published quiz",
        target: "Geography Quiz #2",
        time: "Yesterday at 3:45 PM"
    },
    {
        id: "4",
        user: "Alex Johnson",
        avatar: "/avatars/01.png",
        action: "invited user",
        target: "Casey Morgan",
        time: "3 days ago"
    },
    {
        id: "5",
        user: "Sam Wilson",
        avatar: "/avatars/02.png",
        action: "changed role of",
        target: "Jordan Lee to Editor",
        time: "1 week ago"
    }
];

export default function TeamPage() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [selectedRole, setSelectedRole] = useState("Editor");

    // State for member filters
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Apply filters to team members
    const filteredMembers = TEAM_MEMBERS.filter(member => {
        if (roleFilter !== "All" && member.role !== roleFilter) return false;
        if (statusFilter !== "All" && member.status !== statusFilter.toLowerCase()) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team</h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their access levels.
                    </p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Team Member
                </Button>
            </div>

            <Tabs defaultValue="members" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="members">Team Members</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                    <Card>
                        <CardHeader className="px-6 pt-6 pb-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <CardTitle>Team Members ({TEAM_MEMBERS.length})</CardTitle>
                                <div className="flex flex-wrap gap-2">
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Filter Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Roles</SelectItem>
                                            <SelectItem value="Owner">Owner</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Editor">Editor</SelectItem>
                                            <SelectItem value="Viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Filter Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Status</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6">
                            <div className="rounded-md border">
                                <div className="grid grid-cols-12 items-center gap-4 p-4 border-b bg-muted/50 text-sm font-medium">
                                    <div className="col-span-6 sm:col-span-5">User</div>
                                    <div className="col-span-2 hidden sm:block">Role</div>
                                    <div className="col-span-2 hidden md:block">Status</div>
                                    <div className="col-span-4 sm:col-span-3">Actions</div>
                                </div>
                                <div>
                                    {filteredMembers.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground">
                                            No team members match the selected filters.
                                        </div>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <div
                                                key={member.id}
                                                className="grid grid-cols-12 items-center gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={member.avatar} alt={member.name} />
                                                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                                        <div className="text-xs text-muted-foreground block sm:hidden mt-1">
                                                            {member.role}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 hidden sm:block">
                                                    <Badge variant="outline" className={ROLE_COLORS[member.role]}>
                                                        {member.role}
                                                    </Badge>
                                                </div>
                                                <div className="col-span-2 hidden md:block">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            member.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                                                member.status === "inactive" ? "bg-gray-100 text-gray-800 hover:bg-gray-200" :
                                                                    "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                        }
                                                    >
                                                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm">
                                                        <Mail className="h-4 w-4" />
                                                        <span className="sr-only sm:not-sr-only sm:ml-2">Message</span>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">More</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                            <DropdownMenuItem>Manage Permissions</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                                                            {member.status === "pending" ? (
                                                                <DropdownMenuItem>Resend Invite</DropdownMenuItem>
                                                            ) : member.status === "active" ? (
                                                                <DropdownMenuItem>Deactivate Account</DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem>Activate Account</DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive">
                                                                Remove from Team
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between px-6 py-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                {filteredMembers.length} of {TEAM_MEMBERS.length} team members
                            </div>
                            <div className="text-sm">
                                <Button variant="outline" size="sm">
                                    Export Team List
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ACTIVITY_LOG.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4">
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarImage src={item.avatar} alt={item.user} />
                                            <AvatarFallback>{item.user.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 w-full">
                                            <div className="flex flex-wrap justify-between gap-2">
                                                <p className="text-sm font-medium">
                                                    <span className="font-semibold">{item.user}</span> {item.action} <span className="font-semibold">{item.target}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{item.time}</p>
                                            </div>
                                            <Separator />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button variant="outline">View All Activity</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Role Permissions</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => setShowPermissions(!showPermissions)}>
                                    {showPermissions ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                    {showPermissions ? "Hide Details" : "Show Details"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                                    <div key={role} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={ROLE_COLORS[role]}>
                                                {role}
                                            </Badge>
                                            {role === "Owner" && <ShieldAlert className="h-4 w-4 text-amber-600" />}
                                            {role === "Admin" && <ShieldCheck className="h-4 w-4 text-purple-600" />}
                                            <span className="text-sm font-medium">
                                                {role === "Owner" && "Full access to all features and management"}
                                                {role === "Admin" && "Create content and manage team members"}
                                                {role === "Editor" && "Create and manage content"}
                                                {role === "Viewer" && "View-only access to content"}
                                            </span>
                                        </div>

                                        {showPermissions && (
                                            <ul className="ml-8 text-sm space-y-1">
                                                {permissions.map((permission, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <ClipboardCheck className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                                        <span>{permission}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <Separator />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex flex-col w-full gap-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Need custom roles?</p>
                                    <Button variant="link" className="p-0 h-auto">Contact Support</Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1 text-amber-600" />
                                    Changing the Owner role requires transferring ownership.
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Invite Team Member Modal */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                            Send an invitation to join your quiz creation team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input id="email" placeholder="colleague@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Editor">Editor</SelectItem>
                                    <SelectItem value="Viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="mt-2 p-3 bg-muted rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={ROLE_COLORS[selectedRole]}>
                                        {selectedRole}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                        {selectedRole === "Admin" && "Create content and manage team"}
                                        {selectedRole === "Editor" && "Create and manage content"}
                                        {selectedRole === "Viewer" && "View-only access to content"}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {selectedRole === "Admin" && "Can create, edit, publish quizzes, and manage team members"}
                                    {selectedRole === "Editor" && "Can create, edit, and publish quizzes, but cannot manage team settings"}
                                    {selectedRole === "Viewer" && "Can only view quizzes and analytics, cannot create or edit content"}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Personal message (optional)</Label>
                            <Input id="message" placeholder="Join our team to collaborate on quizzes" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Send Invitation</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 