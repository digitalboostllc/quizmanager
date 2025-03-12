import { authOptions } from "@/lib/auth/auth-options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Attempt to get the current session
        const session = await getServerSession(authOptions);

        // Return basic session diagnostics
        return NextResponse.json({
            status: "success",
            authenticated: !!session,
            session: session ? {
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    role: session.user.role,
                },
                expires: session.expires,
            } : null,
            env: {
                hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
                hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
                nodeEnv: process.env.NODE_ENV,
            },
        });
    } catch (error) {
        console.error("[SESSION_CHECK_ERROR]", error);

        // Return error information for debugging
        return NextResponse.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown session error",
            name: error instanceof Error ? error.name : "Error",
            authenticated: false,
            env: {
                hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
                hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
                nodeEnv: process.env.NODE_ENV,
            },
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Check if there's an active session
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({
                status: "warning",
                message: "No active session to refresh",
            });
        }

        // Session exists, return success
        return NextResponse.json({
            status: "success",
            message: "Session refreshed successfully",
        });
    } catch (error) {
        console.error("[SESSION_REFRESH_ERROR]", error);

        return NextResponse.json({
            status: "error",
            message: "Failed to refresh session",
            error: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });
    }
} 