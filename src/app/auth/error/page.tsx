'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Function to run diagnostics
const runAuthDiagnostics = async () => {
    try {
        // Get auth diagnostics from localStorage if available
        const storedDiagnostics = localStorage.getItem('auth_diagnostics');
        const parsedDiagnostics = storedDiagnostics ? JSON.parse(storedDiagnostics) : null;

        // Check current cookies
        const cookies = document.cookie.split(';').map(c => c.trim());
        const authCookies = cookies.filter(c => c.startsWith('next-auth') || c.includes('next-auth'));

        // Check localStorage
        const lsKeys = Object.keys(localStorage);
        const authLsKeys = lsKeys.filter(k => k.startsWith('next-auth') || k.includes('next-auth'));

        // Try to fetch session info from server
        const sessionResponse = await fetch('/api/auth/session-check');
        const sessionData = await sessionResponse.json();

        return {
            timestamp: new Date().toISOString(),
            browser: {
                userAgent: navigator.userAgent,
                cookies: {
                    total: cookies.length,
                    auth: authCookies,
                },
                localStorage: {
                    total: lsKeys.length,
                    auth: authLsKeys,
                },
                storedDiagnostics: parsedDiagnostics
            },
            server: sessionData
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
};

export default function AuthErrorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);

    // Get error info from URL
    const error = searchParams?.get('error');
    const path = searchParams?.get('path');

    // Format the error message
    let errorMessage = 'An authentication error occurred';
    let errorDescription = 'There was a problem with your authentication session.';

    if (error === 'RedirectLoop') {
        errorMessage = 'Authentication Redirect Loop Detected';
        errorDescription = `We detected multiple redirects when trying to access ${path || 'a protected page'}.`;
    } else if (error === 'SessionRequired') {
        errorMessage = 'Login Required';
        errorDescription = 'You need to be logged in to access this page.';
    } else if (error === 'Configuration') {
        errorMessage = 'Authentication Configuration Error';
        errorDescription = 'There is a problem with the authentication configuration.';
    }

    // Function to clear auth data and refresh
    const clearAuthData = async () => {
        try {
            setLoading(true);

            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('next-auth')) {
                    localStorage.removeItem(key);
                }
            });

            // Clear cookies
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (name.includes('next-auth')) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                }
            });

            toast({
                title: 'Auth data cleared',
                description: 'Your authentication data has been cleared. Please try logging in again.',
            });

            // Redirect to login
            setTimeout(() => {
                router.push('/auth/login');
            }, 1000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to clear authentication data.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">{errorMessage}</CardTitle>
                    <CardDescription>{errorDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p>
                            This could be due to a corrupted authentication session or incorrectly configured auth settings.
                        </p>

                        <div className="flex gap-4">
                            <Button
                                onClick={() => router.push('/auth/login')}
                                variant="outline"
                            >
                                Go to Login
                            </Button>

                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                            >
                                Go to Home
                            </Button>

                            <Button
                                onClick={clearAuthData}
                                variant="destructive"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Clear Auth Data'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 