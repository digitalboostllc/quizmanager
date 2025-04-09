import { verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';
import { AuthOptions, DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

// Define UserRole enum to match Prisma schema
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

// Extend the built-in session types
declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            name?: string | null;
            email: string;
            role: UserRole;
            image?: string | null;
            // Add any other fields
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        name?: string | null;
        email: string;
        role: UserRole;
        image?: string | null;
        // Add any other fields
    }
}

// Extend JWT with custom fields
declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        name?: string | null;
        email: string;
        role: UserRole;
        image?: string | null;
        // Add any other fields
    }
}

// Configuration for routes needing authentication
export const authConfig = {
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

// NextAuth options configuration
export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            // The name to display on the sign in form
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Find user by email directly in the database
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });

                    // No user or no password
                    if (!user || !user.password) {
                        return null;
                    }

                    // Verify password
                    const isValid = await verifyPassword(credentials.password, user.password);

                    if (!isValid) {
                        return null;
                    }

                    // Return user object for token creation
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: (user.role as UserRole) || UserRole.USER,
                        image: user.image,
                    };
                } catch (error) {
                    console.error('Authorization error:', error);
                    return null;
                }
            }
        }),
        // Add other providers here as needed
    ],
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error',
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role || UserRole.USER;
                token.image = user.image;
            }

            // Handle session updates
            if (trigger === 'update' && session) {
                // Allow updating certain fields from session
                if (session.user) {
                    token.name = session.user.name ?? token.name;
                    token.image = session.user.image ?? token.image;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.role = token.role;
                session.user.image = token.image;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

// Helper function to check if a path matches any routes in the array
export function matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );
}

// Helper to check if a user has admin privileges
export function isAdmin(role: UserRole | undefined): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

// Helper to check if a user is a super admin
export function isSuperAdmin(role: UserRole | undefined): boolean {
    return role === UserRole.SUPER_ADMIN;
}

// Helper to check if a path requires authentication
export function requiresAuth(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.protectedRoutes);
}

// Helper to check if a path requires admin privileges
export function requiresAdmin(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.adminRoutes);
}

// Helper to check if a path is an auth page
export function isAuthPage(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.authRoutes);
}

// Helper to check if a path is a public page
export function isPublicPage(pathname: string): boolean {
    return matchesRoute(pathname, authConfig.publicRoutes);
} 