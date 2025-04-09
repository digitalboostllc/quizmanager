/**
 * Centralized Authentication Configuration
 * 
 * This file contains all the core authentication configuration for the application,
 * including session handling, callbacks, and type definitions.
 */

import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from './password';

// Define UserRole enum to match Prisma schema
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

// Extend the standard NextAuth types
declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        role: UserRole;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            role: UserRole;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        role: UserRole;
    }
}

// Main authentication options
export const authConfig: NextAuthOptions = {
    // Use Prisma adapter for database operations
    adapter: PrismaAdapter(prisma),

    // Session configuration
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // Custom pages for authentication
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error',
        newUser: '/auth/register',
    },

    // Authentication providers
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Find user by email
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

                    // Return standardized user object
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: (user.role as UserRole) || UserRole.USER,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],

    // Callbacks for session and JWT handling
    callbacks: {
        // Update JWT with user information when signing in
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.image = user.image;
                token.role = user.role || UserRole.USER;
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

        // Update session with information from JWT
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.image;
                session.user.role = token.role;
            }
            return session;
        },
    },

    // JWT configuration
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // Security settings
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

// Helper functions for authentication
export function isAdmin(session: Session | null): boolean {
    return !!(session?.user.role === UserRole.ADMIN || session?.user.role === UserRole.SUPER_ADMIN);
}

export function isSuperAdmin(session: Session | null): boolean {
    return session?.user.role === UserRole.SUPER_ADMIN;
}

export function isUser(session: Session | null): boolean {
    return !!session?.user;
}

// Export a single instance of the auth options
export default authConfig; 