'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirectPath, setRedirectPath] = useState('/dashboard');
    const { login, isLoading, isAuthenticated, error } = useAuth();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const router = useRouter();

    // Check for redirectUrl in query params or session storage
    useEffect(() => {
        const callbackUrl = searchParams.get('callbackUrl');
        const storedRedirectUrl = typeof window !== 'undefined' ? sessionStorage.getItem('redirectUrl') : null;
        const isReset = searchParams.get('reset') === 'true';

        // If in recovery mode, remove redirect URL to prevent loops
        const inRecoveryMode = typeof window !== 'undefined' && (
            sessionStorage.getItem('AUTH_RECOVERY_MODE') === 'true' ||
            sessionStorage.getItem('FORCE_AUTH_RESET')
        );

        if (inRecoveryMode) {
            // In recovery mode, we ignore stored redirect URLs to prevent loops
            setRedirectPath('/dashboard');

            // Notify user if coming from a reset
            if (isReset) {
                toast({
                    title: "Authentication Reset",
                    description: "Your session was reset. Please log in again.",
                    variant: "default"
                });
            }

            // Clear recovery flags after a delay
            setTimeout(() => {
                sessionStorage.removeItem('AUTH_RECOVERY_MODE');
                sessionStorage.removeItem('FORCE_AUTH_RESET');
            }, 2000);
        } else if (callbackUrl) {
            setRedirectPath(callbackUrl);
        } else if (storedRedirectUrl) {
            setRedirectPath(storedRedirectUrl);
            // Clear the stored URL after using it
            sessionStorage.removeItem('redirectUrl');
        }
    }, [searchParams, toast]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push(redirectPath);
        }
    }, [isAuthenticated, isLoading, redirectPath, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all fields",
                variant: "destructive"
            });
            return;
        }

        await login(email, password, redirectPath);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Or{' '}
                    <Link href="/auth/register" className="font-medium text-primary hover:text-primary/90">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background px-3 py-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/90">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3">
                                <div className="flex">
                                    <div className="text-sm text-destructive">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                className="flex w-full justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 