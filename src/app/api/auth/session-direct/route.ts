import { UserRole } from '@/lib/auth/auth-options';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Extract session token directly from cookies
        const sessionToken = request.cookies.get('next-auth.session-token')?.value;

        if (!sessionToken) {
            return NextResponse.json({
                authenticated: false,
                message: 'No session token found',
                cookies: {
                    available: Array.from(request.cookies.keys())
                }
            });
        }

        // IMPORTANT: In our configuration, the token is a JSON string, not a JWT
        let tokenData;
        try {
            // Parse the token as JSON (not JWT)
            tokenData = JSON.parse(decodeURIComponent(sessionToken));
        } catch (e) {
            console.error('Failed to parse token:', e);
            return NextResponse.json({
                authenticated: false,
                error: {
                    message: 'Failed to parse token',
                    details: e instanceof Error ? e.message : 'Unknown error'
                },
                tokenPrefix: sessionToken.substring(0, 20) + '...'
            }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            session: {
                user: {
                    id: tokenData.id,
                    email: tokenData.email,
                    name: tokenData.name,
                    role: tokenData.role || UserRole.USER
                },
                expires: tokenData.exp ? new Date(tokenData.exp * 1000).toISOString() : null
            },
            debug: {
                tokenValidation: 'success',
                environment: process.env.NODE_ENV,
                nextAuthUrl: process.env.NEXTAUTH_URL
            }
        });
    } catch (error) {
        console.error('Session decode error:', error);

        // Get token for debugging
        const sessionToken = request.cookies.get('next-auth.session-token')?.value;
        const tokenFirstChars = sessionToken ? `${sessionToken.substring(0, 20)}...` : 'none';

        return NextResponse.json({
            authenticated: false,
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'Error'
            },
            debug: {
                tokenValidation: 'failed',
                tokenPrefix: tokenFirstChars,
                environment: process.env.NODE_ENV,
                nextAuthUrl: process.env.NEXTAUTH_URL,
                hasSecret: !!process.env.NEXTAUTH_SECRET
            }
        }, { status: 401 });
    }
} 