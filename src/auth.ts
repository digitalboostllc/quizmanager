import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

// Extend types
declare module "next-auth" {
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
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error',
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
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

                    // No user found or user has no password
                    if (!user || !user.password) {
                        console.log("User not found or no password");
                        return null;
                    }

                    // Verify password
                    const isValid = await verifyPassword(credentials.password, user.password);

                    if (!isValid) {
                        console.log("Password invalid");
                        return null;
                    }

                    // Return user object
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: (user.role as UserRole) || UserRole.USER,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Set data from user object
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.role = user.role || UserRole.USER;
            }
            return token;
        },
        async session({ session, token }) {
            // Set session data from token
            if (session.user && token) {
                session.user.id = token.id;
                session.user.email = token.email as string;
                session.user.role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

export function isAdmin(role: string | undefined): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function isSuperAdmin(role: string | undefined): boolean {
    return role === UserRole.SUPER_ADMIN;
} 