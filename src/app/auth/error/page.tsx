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

            // Get diagnostics first for debugging
            const diagnostics = await runAuthDiagnostics();

            // Save diagnostics to localStorage for future reference
            try {
                localStorage.setItem('auth_diagnostics', JSON.stringify(diagnostics));
            } catch (e) {
                // Silent fail
            }

            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('next-auth') || key.includes('auth_redirect')) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.removeItem('REDIRECT_LOOP_PROTECTION');

            // Clear sessionStorage
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('next-auth') || key.includes('redirect') || key.includes('auth_')) {
                    sessionStorage.removeItem(key);
                }
            });

            // Clear all cookies - be more aggressive with cookie clearing
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            });

            toast({
                title: 'Auth data cleared',
                description: 'Your authentication data has been cleared. Please try logging in again.',
            });

            // Set flag to block redirects during recovery
            sessionStorage.setItem('AUTH_RECOVERY_MODE', 'true');

            // Redirect to login
            setTimeout(() => {
                window.location.href = '/auth/login?reset=true';
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

    // More aggressive reset for stubborn auth loops
    const forceReset = async () => {
        try {
            setLoading(true);

            // Try to get diagnostics
            let diagnostics = null;
            try {
                diagnostics = await runAuthDiagnostics();
            } catch (e) {
                // Silent fail, continue with reset
            }

            // Clear everything from localStorage and sessionStorage
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {
                // Some browsers might restrict this in certain contexts
            }

            // Clear all cookies
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                // Also try subdomain clearing
                const domain = window.location.hostname;
                if (domain.includes('.')) {
                    const rootDomain = domain.split('.').slice(-2).join('.');
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain}`;
                }
            });

            // Set recovery flag
            try {
                sessionStorage.setItem('FORCE_AUTH_RESET', Date.now().toString());
            } catch (e) {
                // Silent fail
            }

            toast({
                title: 'Auth system reset',
                description: 'Authentication has been completely reset. You will now be redirected to the home page.',
            });

            // Redirect to home page after delay
            setTimeout(() => {
                window.location.href = '/?reset=true';
            }, 1500);

        } catch (error) {
            toast({
                title: 'Reset Failed',
                description: 'Could not complete the reset. Try clearing your browser data manually.',
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

                        {error === 'RedirectLoop' && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                                <h3 className="text-amber-800 font-medium mb-2">Redirect Loop Detected</h3>
                                <p className="text-amber-700 text-sm mb-2">
                                    We've detected that your authentication is caught in a redirect loop.
                                    This usually happens when your auth session is corrupted or invalid.
                                </p>
                                <p className="text-amber-700 text-sm">
                                    Try clicking "Clear Auth Data" first. If that doesn't work, use the "Force Reset" option,
                                    which will clear all browser data for this site.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4">
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
                                variant="secondary"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Clear Auth Data'}
                            </Button>

                            <Button
                                onClick={forceReset}
                                variant="destructive"
                                disabled={loading}
                            >
                                Force Reset
                            </Button>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <p className="text-sm text-muted-foreground mb-2">If problems persist after reset:</p>
                            <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                                <li>Try clearing cookies manually in your browser settings</li>
                                <li>Check that you have cookies enabled</li>
                                <li>Try using a different browser</li>
                                <li>If using a private/incognito window, try a regular window</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 