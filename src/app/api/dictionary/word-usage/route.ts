import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Retrieve word usage for a user
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language') || 'fr'; // Default to French
        const word = searchParams.get('word');

        // If a specific word is requested, return its usage status
        if (word) {
            const wordUsage = await prisma.wordUsage.findUnique({
                where: {
                    userId_word_language: {
                        userId: session.user.id,
                        word,
                        language,
                    },
                },
            });

            return NextResponse.json({ isUsed: !!wordUsage });
        }

        // Otherwise return all used words for this user and language
        const usedWords = await prisma.wordUsage.findMany({
            where: {
                userId: session.user.id,
                language,
            },
            orderBy: {
                usedAt: 'desc',
            },
        });

        return NextResponse.json(usedWords);
    } catch (error) {
        console.error('Error fetching word usage:', error);
        return NextResponse.json(
            { error: 'Failed to fetch word usage data' },
            { status: 500 }
        );
    }
}

// POST - Mark a word as used
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get word data from request body
        const { word, language = 'fr' } = await request.json();

        if (!word) {
            return NextResponse.json(
                { error: 'Word is required' },
                { status: 400 }
            );
        }

        // Create or update word usage entry
        const wordUsage = await prisma.wordUsage.upsert({
            where: {
                userId_word_language: {
                    userId: session.user.id,
                    word,
                    language,
                },
            },
            update: {
                isUsed: true,
                usedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                word,
                language,
                isUsed: true,
            },
        });

        return NextResponse.json(wordUsage);
    } catch (error) {
        console.error('Error marking word as used:', error);
        return NextResponse.json(
            { error: 'Failed to update word usage status' },
            { status: 500 }
        );
    }
}

// PUT - Toggle word usage status
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get word data from request body
        const { word, language = 'fr' } = await request.json();

        if (!word) {
            return NextResponse.json(
                { error: 'Word is required' },
                { status: 400 }
            );
        }

        // Find existing word usage entry
        const existingWordUsage = await prisma.wordUsage.findUnique({
            where: {
                userId_word_language: {
                    userId: session.user.id,
                    word,
                    language,
                },
            },
        });

        // If it exists and is marked as used, delete it (mark as unused)
        if (existingWordUsage && existingWordUsage.isUsed) {
            await prisma.wordUsage.delete({
                where: {
                    id: existingWordUsage.id,
                },
            });

            return NextResponse.json({ word, isUsed: false });
        }

        // Otherwise, create a new entry (mark as used)
        const wordUsage = await prisma.wordUsage.create({
            data: {
                userId: session.user.id,
                word,
                language,
                isUsed: true,
            },
        });

        return NextResponse.json(wordUsage);
    } catch (error) {
        console.error('Error toggling word usage:', error);
        return NextResponse.json(
            { error: 'Failed to toggle word usage status' },
            { status: 500 }
        );
    }
} 