'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

// Add TypeScript declaration for the global window property
declare global {
    interface Window {
        REDIRECT_LOOP_PROTECTION?: boolean;
    }
}

interface SessionProviderProps {
    children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
    const [mounted, setMounted] = useState(false);

    // Clear any potentially corrupted session tokens on mount
    useEffect(() => {
        // Add loop detection - track API requests to detect infinite loops
        let apiCallCounter = 0;
        let lastCounterReset = Date.now();

        const detectInfiniteLoop = () => {
            apiCallCounter++;

            // If we've made many requests in a short period, likely an infinite loop
            if (apiCallCounter > 10 && (Date.now() - lastCounterReset) < 2000) {
                // Set global protection flag to prevent further redirects
                window.REDIRECT_LOOP_PROTECTION = true;
                sessionStorage.setItem('REDIRECT_LOOP_PROTECTION', 'true');

                // Force clear all auth data
                try {
                    // Clear localStorage
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('next-auth')) {
                            localStorage.removeItem(key);
                        }
                    });

                    // Clear sessionStorage
                    Object.keys(sessionStorage).forEach(key => {
                        if (key.startsWith('next-auth')) {
                            sessionStorage.removeItem(key);
                        }
                    });

                    // Clear cookies
                    document.cookie.split(';').forEach(cookie => {
                        const cookieStr = cookie.trim();
                        const cookieName = cookieStr.split('=')[0];
                        if (cookieName) {
                            document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
                            document.cookie = `${cookieName}=; Max-Age=0; path=/`;
                        }
                    });

                    // Force reload the page and go to home
                    window.location.href = '/';
                } catch (e) {
                    // Just redirect home on error
                    window.location.href = '/';
                }
            }

            // Reset counter every 3 seconds 
            if (Date.now() - lastCounterReset > 3000) {
                lastCounterReset = Date.now();
                apiCallCounter = 0;
            }
        };

        // Monitor fetch requests to detect auth loops
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

            if (typeof url === 'string' &&
                (url.includes('/api/auth/csrf') || url.includes('/api/auth/session'))) {
                detectInfiniteLoop();
            }

            return originalFetch.apply(this, [input, init]);
        };

        const checkAndClearInvalidTokens = () => {
            try {
                // Look for obvious corruption in localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('next-auth')) {
                        const value = localStorage.getItem(key);
                        if (value && (
                            value.includes('JWEDecryptionFailed') ||
                            value.includes('decryption operation failed') ||
                            value.includes('JWT_SESSION_ERROR')
                        )) {
                            localStorage.removeItem(key);
                        }
                    }
                });

                // Check cookies as well
                document.cookie.split(';').forEach(cookie => {
                    const cookieStr = cookie.trim();
                    if (cookieStr.includes('next-auth') && cookieStr.includes('error')) {
                        const cookieName = cookieStr.split('=')[0];
                        document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
                    }
                });
            } catch (error) {
                // If we get an error parsing the token, it might be corrupted
                try {
                    localStorage.removeItem('next-auth.session-token');
                } catch (e) {
                    // Silent fail
                }
            }
        };

        checkAndClearInvalidTokens();
        setMounted(true);

        // Cleanup function to restore original fetch
        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    // Only render children when component is mounted to avoid hydration issues
    if (!mounted) {
        return null;
    }

    return (
        <NextAuthSessionProvider
            refetchInterval={30 * 60} // Refresh session every 30 minutes
            refetchOnWindowFocus={false} // Don't refresh when window regains focus
            refetchWhenOffline={false} // Don't try to refresh when offline
        >
            {children}
        </NextAuthSessionProvider>
    );
} 