import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// POST - Reset all word usage for a user
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get language from request body
        const { language = 'fr' } = await request.json();

        // Delete all word usage entries for this user and language
        const result = await prisma.wordUsage.deleteMany({
            where: {
                userId: session.user.id,
                language,
            },
        });

        return NextResponse.json({
            message: `Reset ${result.count} words to available status`,
            count: result.count,
        });
    } catch (error) {
        console.error('Error resetting word usage:', error);
        return NextResponse.json(
            { error: 'Failed to reset word usage status' },
            { status: 500 }
        );
    }
} 