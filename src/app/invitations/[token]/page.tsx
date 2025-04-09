"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Check, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Invitation {
    inviteEmail: string;
    inviteStatus: string;
    role: string;
    organization: {
        name: string;
        slug: string;
    };
}

export default function InvitationPage() {
    const { token } = useParams();
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        async function fetchInvitation() {
            try {
                const response = await fetch(`/api/invitations/${token}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch invitation");
                }

                const data = await response.json();
                setInvitation(data.invitation);
            } catch (error) {
                console.error("Error fetching invitation:", error);
                setError(error instanceof Error ? error.message : "Failed to fetch invitation");
            } finally {
                setLoading(false);
            }
        }

        fetchInvitation();
    }, [token]);

    const handleAcceptInvitation = async () => {
        if (!user) {
            // Redirect to login with callback URL
            const callbackUrl = `/invitations/${token}`;
            router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            return;
        }

        setAccepting(true);
        try {
            const response = await fetch(`/api/invitations/${token}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to accept invitation");
            }

            const data = await response.json();
            setAccepted(true);
            toast({
                title: "Success",
                description: data.message,
            });

            // After a short delay, redirect to the organization page
            setTimeout(() => {
                router.push(`/dashboard/organizations/${data.membership.organizationId}`);
            }, 2000);
        } catch (error) {
            console.error("Error accepting invitation:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to accept invitation",
            });
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">Loading Invitation</h2>
                    <p className="text-muted-foreground mt-2">Please wait while we verify your invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !invitation) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invitation Error</CardTitle>
                        <CardDescription>There was a problem with this invitation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">{error || "Invitation not found or has expired"}</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (invitation.inviteStatus !== "PENDING") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invitation Already Processed</CardTitle>
                        <CardDescription>This invitation has already been accepted or declined</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>
                            The invitation to join {invitation.organization.name} has already been processed and is no longer active.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (user && user.email !== invitation.inviteEmail) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Wrong Account</CardTitle>
                        <CardDescription>This invitation was sent to a different email address</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>
                            This invitation was sent to <strong>{invitation.inviteEmail}</strong>, but you're logged in as <strong>{user.email}</strong>.
                        </p>
                        <p className="mt-4">
                            Please log out and sign in with the email address that received the invitation.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/api/auth/signout">Sign out</Link>
                        </Button>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>
                        {accepted ? "Invitation Accepted" : "You're Invited!"}
                    </CardTitle>
                    <CardDescription>
                        {accepted
                            ? `You've successfully joined ${invitation.organization.name}`
                            : `Join ${invitation.organization.name} as a ${invitation.role.toLowerCase()}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {accepted ? (
                        <div className="text-center py-6">
                            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-medium">Welcome to the team!</p>
                            <p className="text-muted-foreground mt-1">
                                You'll be redirected to the organization dashboard shortly...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-md flex items-start space-x-4">
                                <Mail className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h3 className="font-medium">Invitation Details</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        This invitation was sent to <strong>{invitation.inviteEmail}</strong>
                                    </p>
                                    <p className="text-sm">
                                        <strong>Organization:</strong> {invitation.organization.name}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Role:</strong> {invitation.role}
                                    </p>
                                </div>
                            </div>

                            {!user && (
                                <p className="text-sm text-amber-600">
                                    You need to be signed in to accept this invitation. Clicking the button below will take you to the login page.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    {!accepted && (
                        <Button
                            onClick={handleAcceptInvitation}
                            className="w-full"
                            disabled={accepting}
                        >
                            {accepting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    {user ? "Accept Invitation" : "Sign in to Accept"}
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        asChild
                        className="w-full"
                    >
                        <Link href="/dashboard">
                            {accepted ? "Go to Dashboard" : "Cancel"}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 