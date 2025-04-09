import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    // Check if user is already authenticated
    const session = await getServerSession(authOptions);
    
    if (session) {
        return NextResponse.json({
            success: true,
            message: 'Already authenticated',
            session
        });
    }
    
    try {
        const body = await request.json();
        const { email, password } = body;
        
        if (!email || !password) {
            return NextResponse.json({
                success: false,
                message: 'Email and password are required'
            }, { status: 400 });
        }
        
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true
            }
        });
        
        if (!user || !user.password) {
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }
        
        // Verify password
        const isValid = await verifyPassword(password, user.password);
        
        if (!isValid) {
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }
        
        // Create direct JWT token for testing
        const token = sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production',
            { expiresIn: '1h' }
        );
        
        // Set cookie manually
        const response = NextResponse.json({
            success: true,
            message: 'Authentication successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
        
        // Set manually as a test to see if cookies work
        response.cookies.set({
            name: 'next-auth.session-token',
            value: token,
            httpOnly: true,
            maxAge: 60 * 60, // 1 hour
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        
        return response;
    } catch (error) {
        console.error('Test login error:', error);
        return NextResponse.json({
            success: false,
            message: 'Authentication failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 