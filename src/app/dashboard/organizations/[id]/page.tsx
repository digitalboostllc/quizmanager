"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Calendar, ChevronRight, Edit, Globe, Loader2, Mail, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    createdAt: string;
    _count: {
        members: number;
        templates: number;
        quizzes: number;
    };
    role: string;
}

interface Member {
    id: string;
    userId: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    joinedAt: string;
}

interface Invitation {
    id: string;
    inviteEmail: string;
    role: string;
    inviteStatus: string;
    createdAt: string;
}

const inviteSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    role: z.enum(["ADMIN", "MEMBER", "VIEWER"], {
        required_error: "Please select a role.",
    }),
});

export default function OrganizationDetailPage() {
    const params = useParams();
    const organizationId = params.id as string;
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [openInviteDialog, setOpenInviteDialog] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof inviteSchema>>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
            role: "MEMBER",
        },
    });

    useEffect(() => {
        async function fetchOrganizationDetails() {
            try {
                // Fetch organization details
                const orgResponse = await fetch(`/api/organizations/${organizationId}`);
                if (!orgResponse.ok) {
                    throw new Error("Failed to fetch organization details");
                }
                const orgData = await orgResponse.json();
                setOrganization(orgData);

                // Fetch members
                const membersResponse = await fetch(`/api/organizations/${organizationId}/members`);
                if (!membersResponse.ok) {
                    throw new Error("Failed to fetch organization members");
                }
                const membersData = await membersResponse.json();
                setMembers(membersData);

                // Fetch pending invitations
                const invitationsResponse = await fetch(`/api/organizations/${organizationId}/invitations`);
                if (invitationsResponse.ok) {
                    const invitationsData = await invitationsResponse.json();
                    setInvitations(invitationsData);
                }
            } catch (error) {
                console.error("Error fetching organization details:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load organization details.",
                });
            } finally {
                setLoading(false);
            }
        }

        fetchOrganizationDetails();
    }, [organizationId, toast]);

    const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
        setInviting(true);
        try {
            const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to send invitation");
            }

            // Add the new invitation to the list
            const data = await response.json();
            setInvitations([data.invitation, ...invitations]);

            toast({
                title: "Invitation sent",
                description: `Invitation sent to ${values.email} successfully.`,
            });

            form.reset();
            setOpenInviteDialog(false);
        } catch (error) {
            console.error("Error sending invitation:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send invitation",
            });
        } finally {
            setInviting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Helper for user initials
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const canManageMembers = organization?.role === "OWNER" || organization?.role === "ADMIN";

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                </div>
                <Tabs defaultValue="overview">
                    <TabsList>
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24 ml-1" />
                    </TabsList>
                    <div className="mt-4">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </Tabs>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium">Organization not found</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                    The organization you are looking for does not exist or you don't have access to it.
                </p>
                <Button onClick={() => router.push("/dashboard/organizations")}>
                    Go back to Organizations
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-1">
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <span
                        className="hover:underline cursor-pointer"
                        onClick={() => router.push("/dashboard/organizations")}
                    >
                        Organizations
                    </span>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span>{organization.name}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                            {organization.logoUrl ? (
                                <img
                                    src={organization.logoUrl}
                                    alt={organization.name}
                                    className="h-6 w-6 rounded"
                                />
                            ) : (
                                <Building2 className="h-6 w-6" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center">
                                {organization.name}
                                <span className="ml-3 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                    {organization.role}
                                </span>
                            </h1>
                            <p className="text-muted-foreground">@{organization.slug}</p>
                        </div>
                    </div>
                    {(organization.role === "OWNER" || organization.role === "ADMIN") && (
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/organizations/${organization.id}/settings`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Organization
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Members</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{organization._count.members}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {invitations.length > 0 && `${invitations.length} pending invitations`}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{organization._count.quizzes}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Created by this organization
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{organization._count.templates}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Available for all members
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>
                                Information about {organization.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm text-muted-foreground">Description</Label>
                                <p className="mt-1">
                                    {organization.description || "No description provided"}
                                </p>
                            </div>
                            {organization.website && (
                                <div>
                                    <Label className="text-sm text-muted-foreground flex items-center">
                                        <Globe className="mr-1 h-3 w-3" /> Website
                                    </Label>
                                    <a
                                        href={organization.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 text-primary hover:underline"
                                    >
                                        {organization.website}
                                    </a>
                                </div>
                            )}
                            <div>
                                <Label className="text-sm text-muted-foreground flex items-center">
                                    <Calendar className="mr-1 h-3 w-3" /> Created
                                </Label>
                                <p className="mt-1">{formatDate(organization.createdAt)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Recent actions in this organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6">
                                <p className="text-muted-foreground">
                                    Activity tracking coming soon
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Team Members</h2>
                        {canManageMembers && (
                            <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Invite Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Team Member</DialogTitle>
                                        <DialogDescription>
                                            Invite someone to join {organization.name}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="colleague@example.com" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            We'll send an invitation to this email address
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="role"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Role</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a role" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                                <SelectItem value="MEMBER">Member</SelectItem>
                                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>
                                                            Choose the level of access for this team member
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setOpenInviteDialog(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={inviting}>
                                                    {inviting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Send Invitation
                                                        </>
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Members</CardTitle>
                            <CardDescription>
                                Members of {organization.name} and their roles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        {canManageMembers && <TableHead>Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                                        {member.user.image ? (
                                                            <img
                                                                src={member.user.image}
                                                                alt={member.user.name}
                                                                className="h-8 w-8 rounded-full"
                                                            />
                                                        ) : (
                                                            getInitials(member.user.name || "Unknown User")
                                                        )}
                                                    </div>
                                                    <span>{member.user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{member.user.email}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                    {member.role}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatDate(member.joinedAt)}</TableCell>
                                            {canManageMembers && (
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={organization.role !== "OWNER" && member.role === "OWNER"}
                                                    >
                                                        Manage
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {invitations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Invitations</CardTitle>
                                <CardDescription>
                                    People who have been invited to join {organization.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Invited</TableHead>
                                            <TableHead>Status</TableHead>
                                            {canManageMembers && <TableHead>Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invitations.map((invitation) => (
                                            <TableRow key={invitation.id}>
                                                <TableCell className="font-medium">
                                                    {invitation.inviteEmail}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                        {invitation.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                                        {invitation.inviteStatus}
                                                    </span>
                                                </TableCell>
                                                {canManageMembers && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="sm">
                                                            Cancel
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
} 