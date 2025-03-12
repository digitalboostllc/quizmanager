import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // Validate input
        if (!email || !email.includes('@') || !password || password.trim().length < 8) {
            return NextResponse.json(
                { error: 'Invalid input - password should be at least 8 characters long.' },
                { status: 422 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email.' },
                { status: 422 }
            );
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create the user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Return success without exposing the password
        return NextResponse.json(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Could not register user. Please try again.' },
            { status: 500 }
        );
    }
} 