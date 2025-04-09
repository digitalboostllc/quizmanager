import { authOptions } from "@/lib/auth/auth-options";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Get JWT token directly
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        // Get session using getServerSession
        const session = await getServerSession(authOptions);

        // Get essential cookies
        const cookies = request.cookies;
        const sessionTokenCookie = cookies.get('next-auth.session-token');
        const csrfTokenCookie = cookies.get('next-auth.csrf-token');

        // Collect client headers for debugging
        const headers = Object.fromEntries(request.headers.entries());

        // Return diagnostic information
        return NextResponse.json({
            authenticated: !!session,
            sessionExists: !!session,
            tokenExists: !!token,
            sessionData: session ? {
                expires: session.expires,
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    role: session.user.role
                }
            } : null,
            tokenData: token ? {
                name: token.name,
                email: token.email,
                role: token.role,
                exp: token.exp,
                iat: token.iat
            } : null,
            cookieInfo: {
                sessionTokenExists: !!sessionTokenCookie,
                csrfTokenExists: !!csrfTokenCookie
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                nextAuthUrlSet: !!process.env.NEXTAUTH_URL,
                nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET
            },
            // Headers with sensitive info redacted
            requestHeaders: {
                host: headers.host,
                userAgent: headers['user-agent'],
                referer: headers.referer,
                contentType: headers['content-type'],
                acceptEncoding: headers['accept-encoding'],
                acceptLanguage: headers['accept-language']
            }
        });
    } catch (error) {
        console.error("Session debug error:", error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error occurred",
            errorType: error instanceof Error ? error.name : "Unknown error type",
            authenticated: false,
            environment: {
                nodeEnv: process.env.NODE_ENV,
                nextAuthUrlSet: !!process.env.NEXTAUTH_URL,
                nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET
            }
        }, { status: 500 });
    }
} 