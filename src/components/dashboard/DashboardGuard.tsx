'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface DashboardGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
}

/**
 * Guards access to dashboard pages based on authentication status and role
 */
export function DashboardGuard({ children, requiredRole }: DashboardGuardProps) {
    const {
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        refreshSession
    } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Redirect to login if not authenticated and not loading
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Store the current path for redirect after login
            sessionStorage.setItem('redirectAfterLogin', pathname);
            router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
    }, [isAuthenticated, isLoading, router, pathname]);

    // Check for required role
    const hasRequiredRole = !requiredRole ||
        (user?.role && (
            user.role === requiredRole ||
            user.role === UserRole.SUPER_ADMIN ||
            (requiredRole !== UserRole.SUPER_ADMIN && user.role === UserRole.ADMIN)
        ));

    // Handle role-based access control
    if (isAuthenticated && !hasRequiredRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You don't have permission to access this page.
                    </AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard')}
                >
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Show authentication error
    if (error && !isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
                <div className="flex gap-4 mt-4">
                    <Button
                        variant="default"
                        onClick={() => router.push('/auth/login')}
                    >
                        Log In
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => refreshSession()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Render children if authenticated and has required role
    return <>{children}</>;
}

export default DashboardGuard; 