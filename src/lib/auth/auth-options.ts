import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { RequestInternal } from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from './password';

// Define UserRole enum to match Prisma schema
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

// Extend the built-in session types
declare module "next-auth" {
    interface User {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        role?: UserRole;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: UserRole;
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: UserRole;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error',
        newUser: '/auth/register',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials, req): Promise<any> {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isValid = await verifyPassword(credentials.password, user.password);

                if (!isValid) {
                    return null;
                }

                // Cast to expected User type
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role || UserRole.USER,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role || UserRole.USER;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
    // Improved cookie security and configuration
    cookies: {
        sessionToken: {
            name: process.env.NEXT_PUBLIC_COOKIE_NAME || 'fbquiz-session',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
                maxAge: parseInt(process.env.COOKIE_MAX_AGE || '2592000'), // 30 days in seconds
            },
        },
    },
    // Add better security with JWT options
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },
    // Make sure secret is using environment variable
    secret: process.env.NEXTAUTH_SECRET,
    // Add debug mode in development
    debug: process.env.NODE_ENV === 'development',
};