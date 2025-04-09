'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export default function AuthTest() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const { toast } = useToast();

    // Check session status
    const checkSession = async () => {
        try {
            setLoading(true);

            // Try both diagnostics and direct session check
            const [diagnosticRes, directRes] = await Promise.all([
                fetch('/api/auth/diagnostic'),
                fetch('/api/auth/session-direct')
            ]);

            const diagnosticData = await diagnosticRes.json();
            let directData = null;

            try {
                directData = await directRes.json();
            } catch (e) {
                console.error('Error parsing direct session:', e);
            }

            setResults({
                diagnostic: diagnosticData,
                direct: directData
            });

            // If authenticated via direct check, let the user know
            if (directData?.authenticated) {
                toast({
                    title: 'Authenticated',
                    description: `Logged in as ${directData.session?.user?.email}`,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to check auth status',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Test login directly
    const testLogin = async () => {
        try {
            setLoading(true);
            if (!email || !password) {
                toast({
                    title: 'Error',
                    description: 'Email and password are required',
                    variant: 'destructive',
                });
                return;
            }

            const res = await fetch('/api/auth/test-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            setResults(data);

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Login successful! Cookies should be set.',
                });
                // Check session status after login
                setTimeout(checkSession, 500);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Login failed',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to test login',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Clear cookies
    const clearCookies = () => {
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        });
        toast({
            title: 'Cookies Cleared',
            description: 'All cookies have been cleared',
        });
        setTimeout(checkSession, 500);
    };

    return (
        <div className="container max-w-3xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Test Tool</CardTitle>
                    <CardDescription>
                        Diagnose authentication issues and verify cookie storage
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>
                        <div className="space-y-4 flex flex-col justify-end">
                            <Button onClick={testLogin} disabled={loading}>
                                {loading ? 'Testing...' : 'Test Login'}
                            </Button>
                            <Button onClick={checkSession} variant="outline" disabled={loading}>
                                Check Session Status
                            </Button>
                            <Button onClick={clearCookies} variant="destructive" disabled={loading}>
                                Clear All Cookies
                            </Button>

                            {results?.direct?.authenticated && (
                                <Button
                                    onClick={() => window.location.href = '/dashboard'}
                                    variant="default"
                                    className="mt-2"
                                >
                                    Go to Dashboard →
                                </Button>
                            )}
                        </div>
                    </div>

                    {results && (
                        <div className="mt-8 border p-4 rounded-md bg-muted/10">
                            <h3 className="text-lg font-medium mb-2">Test Results</h3>
                            <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-[300px] p-2 bg-background rounded">
                                {JSON.stringify(results, null, 2)}
                            </pre>
                        </div>
                    )}

                    <div className="border-t pt-4 mt-8">
                        <h3 className="text-lg font-medium mb-2">Troubleshooting Steps</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>Click <strong>Check Session Status</strong> to verify your current authentication state</li>
                            <li>If not authenticated, try <strong>Test Login</strong> with your credentials</li>
                            <li>If login succeeds but cookies are not set, your browser may be blocking cookies</li>
                            <li>Check that you're not in private/incognito mode</li>
                            <li>If all fails, <strong>Clear All Cookies</strong> and try again</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 