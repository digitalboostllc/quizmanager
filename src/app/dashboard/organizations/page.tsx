"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Building2, Buildings, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Grid background style for the header
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

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

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchOrganizations() {
            try {
                const response = await fetch("/api/organizations");

                if (!response.ok) {
                    throw new Error("Failed to fetch organizations");
                }

                const data = await response.json();
                setOrganizations(data);
            } catch (error) {
                console.error("Error fetching organizations:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load your organizations."
                });
            } finally {
                setLoading(false);
            }
        }

        fetchOrganizations();
    }, [toast]);

    const filteredOrganizations = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function handleCreateOrganization() {
        router.push("/dashboard/organizations/new");
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                                    <Buildings className="h-3.5 w-3.5 mr-1.5" />
                                    Team Collaboration
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Organizations</h1>
                                <p className="text-muted-foreground">
                                    Manage your organizations and team collaborations
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handleCreateOrganization}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Organization
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search organizations..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Organizations Grid */}
            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-6 w-2/3 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Skeleton className="h-4 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : filteredOrganizations.length === 0 ? (
                <div className="text-center py-12">
                    <Buildings className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No organizations found</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                        {organizations.length === 0
                            ? "You don't have any organizations yet."
                            : "No organizations match your search."}
                    </p>
                    {organizations.length === 0 && (
                        <Button onClick={handleCreateOrganization}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first organization
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredOrganizations.map((org) => (
                        <Link href={`/dashboard/organizations/${org.id}`} key={org.id}>
                            <Card className="h-full overflow-hidden hover:shadow-md transition-all cursor-pointer">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {org.logoUrl ? (
                                                    <img
                                                        src={org.logoUrl}
                                                        alt={org.name}
                                                        className="h-6 w-6 rounded"
                                                    />
                                                ) : (
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                )}
                                                {org.name}
                                            </CardTitle>
                                            <CardDescription>@{org.slug}</CardDescription>
                                        </div>
                                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                            {org.role}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {org.description || "No description provided"}
                                    </p>
                                </CardContent>
                                <CardFooter className="border-t px-6 py-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{org._count.members} members</span>
                                        </div>
                                        <div>
                                            <span>{org._count.quizzes} quizzes</span>
                                        </div>
                                        <div>
                                            <span>{org._count.templates} templates</span>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
} 