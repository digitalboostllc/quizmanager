'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function BypassDirect() {
    const { toast } = useToast();
    const router = useRouter();

    // Helper function to generate a UUID v4 string in the browser
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const createEmergencyBypass = () => {
        try {
            // Create token payload for admin access
            const tokenPayload = {
                id: "emergency-bypass-" + Math.random().toString(36).substring(2),
                email: "admin@test.com",
                name: "Emergency Admin",
                role: "ADMIN",
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            };

            // Create token string
            const token = JSON.stringify(tokenPayload);

            // Set the cookies directly from client-side
            document.cookie = `next-auth.session-token=${encodeURIComponent(token)}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
            document.cookie = `next-auth.csrf-token=${generateUUID()}-${generateUUID()}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;

            toast({
                title: "Emergency Access Created",
                description: "You should now be able to access the dashboard",
            });

            // Set flag to prevent redirect loops
            window.localStorage.setItem('dashboard_direct_access', 'true');

            // Navigate to dashboard with a delay to allow cookies to be set
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error) {
            console.error("Bypass error:", error);
            toast({
                title: "Error Creating Bypass",
                description: "Could not create emergency access token",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="container max-w-lg py-12">
            <Card className="border-red-300">
                <CardHeader className="bg-red-50">
                    <CardTitle className="text-red-700">Emergency Dashboard Access</CardTitle>
                    <CardDescription className="text-red-600">
                        This creates a direct access token without going through the authentication flow
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <p className="text-muted-foreground">
                        Use this option only if you're completely unable to access the dashboard
                        through normal authentication. This bypasses all normal security checks.
                    </p>

                    <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                        <h3 className="text-amber-800 font-medium mb-2">Warning</h3>
                        <p className="text-amber-700 text-sm">
                            This is a development-only feature and should not be used in production.
                        </p>
                    </div>

                    <Button
                        onClick={createEmergencyBypass}
                        variant="destructive"
                        className="w-full"
                    >
                        Create Emergency Access
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 