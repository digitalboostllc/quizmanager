'use client';

import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// ======================================================================
// TEMPORARY: AUTHENTICATION DISABLED FOR DEVELOPMENT
// This should match the setting in middleware.ts and useAuth.ts
// ======================================================================
const DISABLE_AUTH = true;

// Add TypeScript declaration for the global window property
declare global {
    interface Window {
        REDIRECT_LOOP_PROTECTION?: boolean;
    }
}

export function AuthErrorHandler() {
    const { data: session, status, update } = useSession();
    const { toast } = useToast();
    const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState(0);
    const redirectInProgressRef = useRef(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Fix for authenticated users being redirected to login
    useEffect(() => {
        // Skip all checks if auth is disabled
        if (DISABLE_AUTH) return;

        // Check for global redirect protection
        if (typeof window !== 'undefined' &&
            (window.REDIRECT_LOOP_PROTECTION ||
                sessionStorage.getItem('REDIRECT_LOOP_PROTECTION'))) {
            return;
        }

        // Don't do anything if we're missing path info or already processing a redirect
        if (!pathname || !searchParams || redirectInProgressRef.current) return;

        // Only run this if we're on the login page with a callbackUrl
        const isLoginPage = pathname === '/auth/login';
        const hasCallbackUrl = searchParams.has('callbackUrl');

        if (isLoginPage && hasCallbackUrl && status === 'authenticated') {
            const callbackUrl = searchParams.get('callbackUrl') || '/profile';

            // Prevent other components from triggering redirects
            redirectInProgressRef.current = true;
            sessionStorage.setItem('auth_redirect_in_progress', 'true');

            // Track number of redirects to detect loops
            const redirectCount = parseInt(sessionStorage.getItem('auth_redirect_count') || '0');

            // If we've redirected too many times, break the cycle
            if (redirectCount > 5) {
                sessionStorage.setItem('REDIRECT_LOOP_PROTECTION', 'true');
                window.REDIRECT_LOOP_PROTECTION = true;

                // Navigate home to break the cycle
                router.push('/');

                // Show toast to inform user
                toast({
                    title: "Authentication issue detected",
                    description: "Redirect loop broken. Please try logging in again.",
                    variant: "destructive",
                });

                return;
            }

            // Increment redirect counter
            sessionStorage.setItem('auth_redirect_count', (redirectCount + 1).toString());

            // Use a short timeout to avoid conflicts with other redirects
            const timeoutId = setTimeout(() => {
                router.push(callbackUrl);

                // Release the lock after a delay to allow navigation to complete
                setTimeout(() => {
                    redirectInProgressRef.current = false;
                    sessionStorage.removeItem('auth_redirect_in_progress');
                }, 1000);
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                redirectInProgressRef.current = false;
                sessionStorage.removeItem('auth_redirect_in_progress');
            };
        }
    }, [pathname, searchParams, status, router, toast]);

    // Check for and fix session errors - throttled to avoid loops
    useEffect(() => {
        // Skip if auth is disabled
        if (DISABLE_AUTH) return;

        // Skip if redirect protection is active
        if (typeof window !== 'undefined' &&
            (window.REDIRECT_LOOP_PROTECTION ||
                sessionStorage.getItem('REDIRECT_LOOP_PROTECTION') ||
                sessionStorage.getItem('auth_redirect_in_progress') ||
                redirectInProgressRef.current)) {
            return;
        }

        if (status === 'loading') return;

        // Throttle how often we check for session errors (at most once every 5 seconds)
        const now = Date.now();
        if (now - lastCheckTime < 5000) {
            return;
        }

        // Only check on protected pages
        if (!pathname ||
            !(pathname.startsWith('/profile') || pathname.startsWith('/settings'))) {
            return;
        }

        const checkAndFixSession = async () => {
            try {
                setLastCheckTime(Date.now());

                // Check for client-side auth errors on protected pages
                if (status === 'unauthenticated') {
                    // Try to refresh the session once
                    if (!hasAttemptedRefresh) {
                        await update();
                        setHasAttemptedRefresh(true);

                        // If still unauthenticated after refresh, redirect to login - with debounce
                        if (status === 'unauthenticated') {
                            // Set redirect lock
                            redirectInProgressRef.current = true;
                            sessionStorage.setItem('auth_redirect_in_progress', 'true');

                            // Set timeout to prevent potential rapid redirects
                            setTimeout(() => {
                                router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);

                                // Release lock after navigation
                                setTimeout(() => {
                                    redirectInProgressRef.current = false;
                                    sessionStorage.removeItem('auth_redirect_in_progress');
                                }, 1000);
                            }, 200);
                        }
                    }
                }

                // Reset attempt flag if we leave protected pages
                if (!pathname?.startsWith('/profile') && !pathname?.startsWith('/settings')) {
                    setHasAttemptedRefresh(false);
                }
            } catch (error) {
                console.error('AuthErrorHandler error:', error);
            }
        };

        checkAndFixSession();
    }, [status, pathname, hasAttemptedRefresh, update, router, lastCheckTime]);

    // Reset redirect counts when reaching the home page
    useEffect(() => {
        // Skip if auth is disabled
        if (DISABLE_AUTH) return;

        if (pathname === '/') {
            sessionStorage.removeItem('auth_redirect_count');
            sessionStorage.removeItem('auth_redirect_in_progress');
            redirectInProgressRef.current = false;
        }
    }, [pathname]);

    // Handle session expiry by redirecting to login
    const handleExpiredSession = useCallback(() => {
        // Skip auth check and redirect if auth is disabled
        if (DISABLE_AUTH) return;

        if (redirectInProgressRef.current) return;

        redirectInProgressRef.current = true;
        sessionStorage.setItem('auth_redirect_in_progress', 'true');

        // Navigate to login
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname || '')}`);

        // Release lock after timeout
        setTimeout(() => {
            redirectInProgressRef.current = false;
            sessionStorage.removeItem('auth_redirect_in_progress');
        }, 1000);
    }, [pathname, router]);

    // Skip all auth checks if DISABLE_AUTH is true
    if (DISABLE_AUTH) {
        return null;
    }

    // Provide visual feedback if we're fixing auth issues
    if (hasAttemptedRefresh && status === 'loading') {
        return (
            <div className="fixed bottom-4 right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-md shadow-md text-sm">
                Checking authentication...
            </div>
        );
    }

    // Usually doesn't render anything visible
    return null;
}