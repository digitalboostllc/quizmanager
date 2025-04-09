import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Set runtime to Node.js since this file uses the crypto module
export const runtime = 'nodejs';

// Schema for request validation
const tokenRequestSchema = z.object({
    email: z.string().email(),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).default('USER'),
    name: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Only allow in development mode 
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { error: 'This endpoint is only available in development mode' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = tokenRequestSchema.parse(body);

        // Generate an ID if the user doesn't exist
        const userId = randomUUID();

        // Create the token payload
        const tokenPayload = {
            id: userId,
            email: validatedData.email,
            name: validatedData.name || validatedData.email,
            role: validatedData.role,
            // Set expiration to 7 days from now 
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        };

        // Just JSON stringify the token (no JWT signing)
        // This matches our NextAuth configuration that uses plain JSON
        const token = JSON.stringify(tokenPayload);

        // Set cookies for NextAuth
        const response = NextResponse.json({
            success: true,
            user: {
                id: userId,
                email: validatedData.email,
                name: validatedData.name || validatedData.email,
                role: validatedData.role
            }
        });

        // Set the session token cookie
        response.cookies.set({
            name: 'next-auth.session-token',
            value: token,
            httpOnly: true,
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        // Set a CSRF token
        response.cookies.set({
            name: 'next-auth.csrf-token',
            value: `${randomUUID()}|${randomUUID()}`,
            httpOnly: true,
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('Token creation error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create token' },
            { status: 500 }
        );
    }
} 