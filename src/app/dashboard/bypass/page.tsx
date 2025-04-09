'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BypassAuth() {
    const [email, setEmail] = useState('admin@test.com');
    const [role, setRole] = useState('ADMIN');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const createManualSession = async () => {
        try {
            setLoading(true);

            // Use our direct token route to create a session
            const response = await fetch('/api/auth/create-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    role
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const data = await response.json();

            toast({
                title: 'Success',
                description: 'Bypass auth token created successfully!',
            });

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create bypass token',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-md py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Access Bypass</CardTitle>
                    <CardDescription>
                        This page will help you bypass the normal authentication flow and
                        access the dashboard directly by creating a manual session.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <Button
                        onClick={createManualSession}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Creating Session...' : 'Create Bypass Session'}
                    </Button>

                    <div className="text-xs text-muted-foreground pt-2">
                        <p>This utility creates a direct JWT token without going through NextAuth.</p>
                        <p>Use only for development or debugging purposes.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 