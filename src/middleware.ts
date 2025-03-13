import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ======================================================================
// TEMPORARY: AUTHENTICATION DISABLED FOR DEVELOPMENT
// To re-enable auth, change this to false and restart the application
// ======================================================================
const DISABLE_AUTH = true;

// Routes that require authentication - using more specific paths
const protectedRoutes = [
    '/profile', // Main profile page
    '/profile/edit', // Edit profile
    '/profile/change-password', // Change password
    '/settings', // Main settings page and all sub-routes
    '/quizzes/new', // Create new quiz
    '/quizzes/edit', // Edit existing quiz
    '/quizzes/my', // My quizzes
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = [
    '/auth/login',
    '/auth/register',
];

// Routes that should never redirect or check auth
const noAuthCheckRoutes = [
    '/auth/logout',
    '/auth/error',
    '/api/auth/session-check',
    '/api/auth/check-auth',
    '/api/auth/csrf',
    '/api/auth/session',
    '/api/smart-generator',
    '/api/templates',
];

// Routes that are partially accessible without login
// These routes show limited content to non-authenticated users
const partialAccessRoutes = [
    '/dictionary',
    '/templates',
    '/quizzes',
    '/calendar',
];

// Additional safe paths that should never redirect
const safePaths = [
    '/',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/help',
    '/faq',
];

// Rate limiting configuration
const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
};

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Helper to check if a request should be rate limited
function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record) {
        rateLimitStore.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT.windowMs,
        });
        return false;
    }

    if (now > record.resetTime) {
        rateLimitStore.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT.windowMs,
        });
        return false;
    }

    if (record.count >= RATE_LIMIT.max) {
        return true;
    }

    record.count++;
    return false;
}

// Helper to get client IP
function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    // Use the remote address from the request headers
    return request.headers.get('x-real-ip') || 'unknown';
}

// Helper to detect redirect loops
const detectRedirectLoop = (request: NextRequest): boolean => {
    // Check for a special query parameter that counts redirects
    const redirectCount = parseInt(request.nextUrl.searchParams.get('_authRedirectCount') || '0');

    // If we've redirected more than 3 times in a row, we're probably in a loop
    return redirectCount >= 3;
};

/**
 * Check if a path matches a route pattern
 */
const pathMatchesRoute = (path: string, routes: string[]): boolean => {
    // Check for exact match (path equals route)
    if (routes.includes(path)) return true;

    // Check for prefix match (path starts with route)
    for (const route of routes) {
        // Handle trailing slashes consistently by removing them for comparison
        const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        const normalizedRoute = route.endsWith('/') ? route.slice(0, -1) : route;

        if (normalizedPath === normalizedRoute) return true;
        if (normalizedPath.startsWith(normalizedRoute + '/')) return true;
    }

    return false;
};

export async function middleware(request: NextRequest) {
    // If auth is disabled, allow all requests through
    if (DISABLE_AUTH) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // If accessing an API route, static asset, or favicon, proceed normally
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('favicon') ||
        pathname.includes('.') ||
        safePaths.includes(pathname)
    ) {
        // Only apply rate limiting to API routes
        if (!pathname.startsWith('/api/')) {
            return NextResponse.next();
        }

        const ip = getClientIp(request);

        // Check rate limit
        if (isRateLimited(ip)) {
            return NextResponse.json(
                {
                    error: RATE_LIMIT.message,
                    code: 'RATE_LIMIT_EXCEEDED',
                },
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                    },
                }
            );
        }

        // Add rate limit headers to response
        const response = NextResponse.next();
        const record = rateLimitStore.get(ip);
        if (record) {
            response.headers.set('X-RateLimit-Limit', RATE_LIMIT.max.toString());
            response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT.max - record.count).toString());
            response.headers.set('X-RateLimit-Reset', record.resetTime.toString());
        }

        return response;
    }

    // Never check auth for specific routes to avoid loops
    if (pathMatchesRoute(pathname, noAuthCheckRoutes)) {
        return NextResponse.next();
    }

    // Check if the route is protected or an auth route
    const isProtectedRoute = pathMatchesRoute(pathname, protectedRoutes);
    const isAuthRoute = pathMatchesRoute(pathname, authRoutes);
    const isPartialAccessRoute = pathMatchesRoute(pathname, partialAccessRoutes);

    // If it's not a protected route, auth route, or partial access route, proceed normally
    if (!isProtectedRoute && !isAuthRoute && !isPartialAccessRoute) {
        return NextResponse.next();
    }

    // Check for potential redirect loops before proceeding
    const inRedirectLoop = detectRedirectLoop(request);
    if (inRedirectLoop) {
        // Force access to break the loop and redirect to error page with diagnostics
        if (isProtectedRoute) {
            // Redirect to error page instead of login
            const errorUrl = new URL('/auth/error', request.url);
            errorUrl.searchParams.set('error', 'RedirectLoop');
            errorUrl.searchParams.set('path', pathname);
            return NextResponse.redirect(errorUrl);
        }

        // For non-protected routes in a loop, just allow access
        return NextResponse.next();
    }

    try {
        // Get the token from the request
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // For protected routes, require authentication
        if (isProtectedRoute) {
            if (!token) {
                // Create login URL with callback and increment redirect counter
                const loginUrl = new URL('/auth/login', request.url);
                loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));

                // Add redirect counter
                const redirectCount = parseInt(request.nextUrl.searchParams.get('_authRedirectCount') || '0');
                loginUrl.searchParams.set('_authRedirectCount', (redirectCount + 1).toString());

                return NextResponse.redirect(loginUrl);
            }

            // Create a clean URL without the redirect counter
            const cleanUrl = new URL(request.url);
            cleanUrl.searchParams.delete('_authRedirectCount');

            // Only redirect if we need to clean the URL
            if (request.nextUrl.searchParams.has('_authRedirectCount')) {
                return NextResponse.redirect(cleanUrl);
            }

            return NextResponse.next();
        }

        // For auth routes, redirect to profile if already authenticated
        if (isAuthRoute && token) {
            return NextResponse.redirect(new URL('/profile', request.url));
        }

        // For partial access routes, allow access
        return NextResponse.next();
    } catch (error) {
        console.error('[Auth middleware] Error:', error);

        // On error, still allow access to avoid blocking users
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}; 