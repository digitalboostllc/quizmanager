import { UserRole } from '@/auth';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: 'User already exists'
            }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user with explicit ID
        const now = new Date();
        const user = await prisma.user.create({
            data: {
                id: randomUUID(),
                name,
                email,
                password: hashedPassword,
                role: UserRole.USER,
                createdAt: now,
                updatedAt: now
            }
        });

        // Don't return the password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create user'
        }, { status: 500 });
    }
} 