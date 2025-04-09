import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Configuration for protected routes
const authConfig = {
    // Routes that require authentication
    protectedRoutes: [
        '/dashboard',
        '/profile',
        '/settings',
        '/quizzes/edit',
        '/quizzes/my',
    ],

    // Routes that require admin privileges
    adminRoutes: [
        '/dashboard/admin',
    ],

    // Routes that should redirect to dashboard if already authenticated
    authRoutes: [
        '/auth/login',
        '/auth/register',
    ],

    // Routes that should never redirect or check auth (public API endpoints, etc.)
    publicRoutes: [
        '/',
        '/about',
        '/contact',
        '/terms',
        '/privacy',
        '/help',
        '/faq',
        '/auth/error',
        '/auth/logout',
        '/auth/test',
        '/dashboard/bypass',
        '/dashboard/bypass-direct',
        '/api/auth/session-check',
        '/api/auth/check-auth',
        '/api/auth/create-token',
        '/api/auth/diagnostic',
        '/api/auth/test-login',
        '/api/auth/session-direct',
        '/api/auth/debug-session',
        '/api/auth/csrf',
        '/api/auth/session',
        '/api/auth/providers',
        '/api/smart-generator',
        '/api/templates',
    ],
};

/**
 * Check if a path matches any of the routes in the array
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );
}

/**
 * Helper to check if a path requires authentication
 */
function requiresAuth(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.protectedRoutes);
}

/**
 * Helper to check if a path requires admin privileges
 */
function requiresAdmin(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.adminRoutes);
}

/**
 * Helper to check if a path is an auth page
 */
function isAuthPage(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.authRoutes);
}

/**
 * Helper to check if a path is a public page
 */
function isPublicPage(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.publicRoutes);
}

/**
 * Helper to check if a user has admin privileges
 */
function isAdmin(role: string | undefined): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Middleware for Next.js that handles authentication and authorization checks.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow static assets and public routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/fonts/') ||
        pathname.includes('.') ||
        isPublicPage(pathname)
    ) {
        return NextResponse.next();
    }

    try {
        // Get user token
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // If user is on an auth page but already authenticated, redirect to dashboard
        if (isAuthPage(pathname) && token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // For protected routes, require authentication
        if (requiresAuth(pathname)) {
            if (!token) {
                // Save the current URL to redirect back after login
                const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
                return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url));
            }

            // For admin routes, require admin role
            if (requiresAdmin(pathname)) {
                // Make sure token.role is a string value for comparison
                const userRole = token.role as string;

                // Check if user has admin role
                if (!isAdmin(userRole)) {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }
        }

        // All checks passed, proceed to the requested page
        return NextResponse.next();
    } catch (error) {
        console.error('[Auth Middleware Error]', error);

        // On error, still allow access to avoid blocking users completely
        // but redirect to error page for protected routes
        if (requiresAuth(pathname)) {
            return NextResponse.redirect(new URL('/auth/error?error=ServerError', request.url));
        }

        return NextResponse.next();
    }
} 