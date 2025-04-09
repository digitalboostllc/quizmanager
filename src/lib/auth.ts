import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Create a new Prisma client for auth
// In production, you would use the DatabaseService instead
const prisma = new PrismaClient();

/**
 * User roles for the application
 */
export enum AuthUserRole {
    USER = "user",
    ADMIN = "admin",
    EDITOR = "editor",
}

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                    });

                    if (!user || !user.password) {
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!passwordMatch) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role || AuthUserRole.USER,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.role = user.role || AuthUserRole.USER;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

/**
 * Helper to get the session server-side
 */
export const auth = async () => {
    return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 * @returns The current user or null if not authenticated
 */
export async function getSessionUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return null;
    }
    return session.user;
} 