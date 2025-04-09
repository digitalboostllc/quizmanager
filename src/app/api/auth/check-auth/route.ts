import { authOptions } from '@/lib/auth/auth-options';
import { verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Handle POST requests for credential authentication
export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // No user or no password
        if (!user || !user.password) {
            return NextResponse.json({
                success: false,
                error: 'Invalid credentials'
            }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return NextResponse.json({
                success: false,
                error: 'Invalid credentials'
            }, { status: 401 });
        }

        // Return authenticated user (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: {
                id: userWithoutPassword.id,
                name: userWithoutPassword.name,
                email: userWithoutPassword.email,
                role: userWithoutPassword.role,
                image: userWithoutPassword.image,
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({
            success: false,
            error: 'Authentication failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get session from multiple sources to diagnose the issue
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        const session = await getServerSession(authOptions);

        // In Next.js, cookies() returns a ReadonlyRequestCookies object
        // Let's get cookie names without using getAll() or forEach
        const cookieHeader = request.headers.get('cookie') || '';
        const parsedCookies = parseCookieHeader(cookieHeader);

        const nextAuthCookies = Object.keys(parsedCookies)
            .filter(name => name.includes('next-auth'))
            .map(name => ({
                name,
                value: parsedCookies[name]
            }));

        // Return detailed auth diagnostics
        return NextResponse.json({
            tokenExists: !!token,
            tokenDetails: token ? {
                name: token.name,
                email: token.email,
                exp: token.exp,
                role: token.role,
                // Avoid returning sensitive data
                id: token.id ? 'exists' : 'missing',
            } : null,
            sessionExists: !!session,
            sessionDetails: session ? {
                expires: session.expires,
                user: {
                    name: session.user.name,
                    email: session.user.email,
                    // Avoid returning sensitive data
                    id: session.user.id ? 'exists' : 'missing',
                    role: session.user.role,
                }
            } : null,
            cookies: nextAuthCookies.map(cookie => ({
                name: cookie.name,
                // Only show that the value exists, not the actual value
                hasValue: !!cookie.value,
            })),
            environmentCheck: {
                hasSecret: !!process.env.NEXTAUTH_SECRET,
                hasUrl: !!process.env.NEXTAUTH_URL,
                nextAuthUrl: process.env.NEXTAUTH_URL,
                nodeEnv: process.env.NODE_ENV,
            }
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({
            error: 'Error checking authentication',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Helper function to parse cookie string into an object
function parseCookieHeader(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
            const name = parts[0];
            const value = parts.slice(1).join('=');
            cookies[name] = value;
        }
    });

    return cookies;
} 