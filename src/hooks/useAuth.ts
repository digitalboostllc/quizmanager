'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// ======================================================================
// TEMPORARY: AUTHENTICATION DISABLED FOR DEVELOPMENT
// To re-enable auth, change this to false and restart the application
// This should match the setting in middleware.ts
// ======================================================================
const DISABLE_AUTH = true;

// Add TypeScript declaration for the global window property if not already defined
declare global {
    interface Window {
        REDIRECT_LOOP_PROTECTION?: boolean;
    }
}

export function useAuth() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [authAttempts, setAuthAttempts] = useState(0);
    const lastUpdateTime = useRef(0);
    const isRedirectingRef = useRef(false);

    // DEVELOPMENT OVERRIDE: Always return authenticated if auth is disabled
    const isAuthenticated = DISABLE_AUTH ? true : status === 'authenticated';
    const isLoading = DISABLE_AUTH ? false : status === 'loading';

    // Mock user for development when auth is disabled
    const user = DISABLE_AUTH ? {
        id: 'dev-user-id',
        name: 'Development User',
        email: 'dev@example.com',
        role: 'ADMIN',
        image: null
    } : session?.user;

    // Force update the session when the component mounts, but with throttling
    useEffect(() => {
        // Only try to update if not in loading state and more than 10 seconds since last update
        const now = Date.now();
        if (status !== 'loading' && now - lastUpdateTime.current > 10000) {
            lastUpdateTime.current = now;
            update();
        }
    }, [status, update]);

    // Handle session recovery if there's an auth error
    useEffect(() => {
        // Skip if redirect protection is active
        if (typeof window !== 'undefined' &&
            (window.REDIRECT_LOOP_PROTECTION ||
                sessionStorage.getItem('REDIRECT_LOOP_PROTECTION'))) {
            return;
        }

        // If we detect a JWT error after multiple attempts, we may need to clear session
        if (!isAuthenticated && !isLoading && authAttempts > 2) {
            // Clear any invalid session data that might be causing persistent errors
            const clearBrowserSession = () => {
                console.log('Clearing session data after multiple auth attempts');
                window.localStorage.removeItem('next-auth.session-token');
                window.localStorage.removeItem('next-auth.callback-url');
                window.localStorage.removeItem('next-auth.csrf-token');

                // Try to clear cookies by expiring them
                document.cookie = 'next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
                document.cookie = 'next-auth.csrf-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
                document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/; domain=' + window.location.hostname;

                // Use the custom cookie name if set
                if (process.env.NEXT_PUBLIC_COOKIE_NAME) {
                    document.cookie = `${process.env.NEXT_PUBLIC_COOKIE_NAME}=; Max-Age=0; path=/; domain=${process.env.NEXT_PUBLIC_COOKIE_DOMAIN || window.location.hostname}`;
                }
            };

            // After clearing, try to update session again
            clearBrowserSession();
            setTimeout(() => {
                update();
                setAuthAttempts(0);
            }, 500);
        }
    }, [isAuthenticated, isLoading, authAttempts, update]);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            setAuthAttempts(prev => prev + 1);

            // Clear any previous session data before attempting login
            const clearPreviousSession = () => {
                // Clear localStorage items
                window.localStorage.removeItem('next-auth.session-token');
                window.localStorage.removeItem('next-auth.callback-url');
                window.localStorage.removeItem('next-auth.csrf-token');

                // Clear cookies too - important for fixing cookie auth issues
                document.cookie = 'next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname;
                document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/; domain=' + window.location.hostname;
                document.cookie = 'next-auth.csrf-token=; Max-Age=0; path=/; domain=' + window.location.hostname;

                // Also clear with path=/
                document.cookie = 'next-auth.session-token=; Max-Age=0; path=/;';
                document.cookie = 'next-auth.callback-url=; Max-Age=0; path=/;';
                document.cookie = 'next-auth.csrf-token=; Max-Age=0; path=/;';

                // Clear session storage as well
                try {
                    sessionStorage.removeItem('next-auth.callback-url');
                    sessionStorage.removeItem('next-auth.message');
                } catch (e) {
                    // Silent fail
                }
            };

            clearPreviousSession();

            // Attempt sign in with callbackUrl explicitly set to avoid redirection issues
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl: '/profile', // Use profile as default for better auth testing
            });

            if (result?.error) {
                // Detect specific JWT errors
                if (result.error.includes('jwt') || result.error.includes('session')) {
                    setError('Session error. Please try again.');
                    // Attempt to refresh the session
                    await update();
                } else {
                    setError('Invalid email or password');
                }

                return false;
            }

            // Force update session
            await update();

            // Reset auth attempts on successful login
            setAuthAttempts(0);

            // Ensure cookies are properly set by making a separate request
            try {
                const cookieFixResponse = await fetch('/api/auth/csrf', {
                    method: 'GET',
                    credentials: 'include',  // Important for cookies
                });
            } catch (e) {
                // Silent fail - don't block login if this fails
            }

            // Use the URL from the result or default to profile page
            const returnUrl = result?.url || '/profile';
            router.push(returnUrl);
            return true;
        } catch (error) {
            setError('An unexpected error occurred. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Registration failed');
                return false;
            }

            // Auto login after successful registration
            return await login(email, password);
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred during registration');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Instead of trying to handle all cleanup here,
            // redirect to the dedicated logout page
            router.push('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);

            // If there's an error redirecting, try a basic cleanup and redirect
            window.localStorage.removeItem('next-auth.session-token');
            document.cookie = 'next-auth.session-token=; Max-Age=0; path=/; domain=' + window.location.hostname;

            // Force redirect to home even if logout fails
            router.push('/');
        }
    };

    // Method to check and refresh session with throttling
    const refreshSession = async () => {
        try {
            const now = Date.now();
            // Only update if at least 5 seconds have passed since last update
            if (now - lastUpdateTime.current < 5000) {
                console.log('Session refresh throttled');
                return true;
            }

            lastUpdateTime.current = now;
            await update();
            return true;
        } catch (error) {
            console.error('Session refresh error:', error);
            return false;
        }
    };

    // Attempt to detect if we're being redirected due to auth issues
    useEffect(() => {
        // Skip if redirect protection is active or redirect is already in progress
        if (typeof window !== 'undefined' &&
            (window.REDIRECT_LOOP_PROTECTION ||
                sessionStorage.getItem('REDIRECT_LOOP_PROTECTION') ||
                sessionStorage.getItem('auth_redirect_in_progress') ||
                isRedirectingRef.current)) {
            return;
        }

        const checkForAuthRedirect = () => {
            // Check if URL contains callbackUrl parameter indicating a redirect from auth
            const url = new URL(window.location.href);
            const callbackUrl = url.searchParams.get('callbackUrl');

            // Track number of redirects to detect loops
            let redirectCount = parseInt(sessionStorage.getItem('auth_redirect_count') || '0');

            if (callbackUrl && isAuthenticated) {
                // Check if we're in a potential loop
                if (redirectCount > 4) {
                    sessionStorage.setItem('REDIRECT_LOOP_PROTECTION', 'true');
                    window.REDIRECT_LOOP_PROTECTION = true;

                    // Force navigation to home to break the cycle
                    setTimeout(() => {
                        router.push('/');
                    }, 100);
                    return;
                }

                // Set redirect lock and increment counter
                sessionStorage.setItem('auth_redirect_count', (redirectCount + 1).toString());
                sessionStorage.setItem('auth_redirect_in_progress', 'true');
                isRedirectingRef.current = true;

                // We're authenticated but still got redirected, let's handle this
                router.push(callbackUrl);

                // Clear the lock after navigation
                setTimeout(() => {
                    isRedirectingRef.current = false;
                    sessionStorage.removeItem('auth_redirect_in_progress');
                }, 1000);
            }
        };

        // Only run this effect when we're fully mounted and authentication state is determined
        if (!isLoading) {
            checkForAuthRedirect();
        }
    }, [isAuthenticated, isLoading, router]);

    // Reset navigation tracking when reaching home page
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
            sessionStorage.removeItem('auth_redirect_count');
            isRedirectingRef.current = false;
        }
    }, []);

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        loading,
        login,
        register,
        logout,
        refreshSession,
    };
} 