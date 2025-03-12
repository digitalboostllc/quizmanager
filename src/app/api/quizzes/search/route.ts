import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuizStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const status = searchParams.get('status') as QuizStatus | null;

    if (!query) {
      // If no query is provided, return all quizzes with the specified status
      const quizzes = await prisma.quiz.findMany({
        where: {
          status: status || undefined,
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          status: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return NextResponse.json(quizzes);
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { answer: { contains: query, mode: 'insensitive' } },
            ],
          },
          status ? { status } : {},
        ],
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error searching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to search quizzes' },
      { status: 500 }
    );
  }
} 