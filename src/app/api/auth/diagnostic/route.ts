import { authOptions } from '@/lib/auth/auth-options';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Get token and session through different methods to compare
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        raw: true, // Get the raw token for debugging
    });

    const session = await getServerSession(authOptions);

    // Gather cookie information
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
        cookieHeader.split(';')
            .map(c => c.trim().split('='))
            .filter(parts => parts.length === 2)
            .map(([name, value]) => [name, value])
    );

    // Examine HTTP headers
    const headers = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        auth: {
            hasToken: !!token,
            tokenType: typeof token,
            hasSession: !!session,
            sessionExpiry: session?.expires || null,
            user: session?.user ? {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role
            } : null
        },
        cookies: {
            count: Object.keys(cookies).length,
            hasSessionToken: 'next-auth.session-token' in cookies,
            hasCallbackUrl: 'next-auth.callback-url' in cookies,
            hasCsrfToken: 'next-auth.csrf-token' in cookies,
            sessionCookieValue: cookies['next-auth.session-token'] ?
                `${cookies['next-auth.session-token'].substring(0, 10)}...` : null,
        },
        server: {
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
            nodeEnv: process.env.NODE_ENV,
        },
        request: {
            url: request.url,
            method: request.method,
            headers: {
                host: headers['host'],
                userAgent: headers['user-agent'],
                accept: headers['accept'],
                referer: headers['referer']
            }
        }
    });
} 