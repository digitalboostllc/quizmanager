'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Define UserRole enum locally to avoid Edge Runtime issues with imports
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

/**
 * Helper to check if a user has admin privileges 
 */
export function isAdmin(role: string | undefined): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/**
 * Custom hook for authentication that provides enhanced functionality
 * on top of the standard NextAuth useSession hook.
 */
export const useAuth = () => {
    // Get session data from NextAuth
    const { data: sessionData, status, update } = useSession();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Determine if the user is authenticated based on session status
    const isAuthenticated = status === 'authenticated' && !!sessionData;
    const isLoading = status === 'loading';

    // Get user from session
    const user = sessionData?.user;

    // Check if the user has admin privileges
    const userIsAdmin = isAdmin(user?.role);

    // Clear any errors on session change
    useEffect(() => {
        if (sessionData) {
            setError(null);
        }
    }, [sessionData]);

    // Login function that uses NextAuth signIn
    const login = useCallback(async (
        email: string,
        password: string,
        redirectPath?: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            console.log("Attempting login with credentials", { email, redirectPath });

            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl: redirectPath || '/dashboard'
            });

            console.log("SignIn result:", result);

            if (result?.error) {
                setError(result.error);
                return false;
            }

            // Force session update after successful login
            await update();

            // Use timeout to ensure session state is updated before redirect
            setTimeout(() => {
                // Navigate to the return URL
                router.push(redirectPath || '/dashboard');
            }, 100);

            return true;
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [router, update]);

    // Register function
    const register = useCallback(async (
        name: string,
        email: string,
        password: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Register the user via API
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return false;
            }

            // If registration is successful, immediately log in
            return await login(email, password);
        } catch (err) {
            console.error('Registration error:', err);
            setError('An unexpected error occurred');
            return false;
        } finally {
            setLoading(false);
        }
    }, [login]);

    // Logout function
    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await signOut({ redirect: false });
            router.push('/');
            return true;
        } catch (err) {
            console.error('Logout error:', err);
            setError('Logout failed');
            return false;
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Refresh session data
    const refreshSession = useCallback(async () => {
        try {
            await update();
            return true;
        } catch (err) {
            console.error('Failed to refresh session:', err);
            return false;
        }
    }, [update]);

    /**
     * Check if the current user has a specific role
     */
    const hasRole = (role: UserRole) => {
        if (!isAuthenticated || !user) return false;
        return user.role === role;
    };

    /**
     * Check if the current user is an admin
     */
    const checkIsAdmin = () => {
        if (!isAuthenticated || !user) return false;
        return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    };

    // Automatically refresh session when component mounts
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            update();
        }
    }, [isLoading, isAuthenticated, update]);

    return {
        // Auth state
        user,
        session: sessionData,
        status,
        isAuthenticated,
        isLoading,
        error,
        loading,

        // Auth actions
        login,
        register,
        logout,
        refreshSession,

        // Role checks
        hasRole,
        isAdmin: checkIsAdmin,
        userIsAdmin,
    };
};

// Export default for backward compatibility
export default useAuth; 