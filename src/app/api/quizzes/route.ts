import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma, QuizStatus, QuizType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

interface CreateQuizRequest {
  title: string;
  description?: string;
  quizType: QuizType;
  variables: Prisma.JsonValue;
  templateId: string;
  answer: string;
  solution?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as QuizType | null;

    const where: Prisma.QuizWhereInput = {
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
      ...(type && { quizType: type }),
    };

    // Add timeout and retry logic
    const MAX_RETRIES = 3;
    const TIMEOUT = 5000; // 5 seconds

    let retryCount = 0;
    let lastError: any;

    while (retryCount < MAX_RETRIES) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database operation timed out')), TIMEOUT);
        });

        const dbOperation = Promise.all([
          prisma.quiz.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              template: {
                select: {
                  id: true,
                  name: true,
                  quizType: true,
                },
              },
            },
          }),
          prisma.quiz.count({ where }),
        ]);

        const [quizzes, total] = await Promise.race([timeoutPromise, dbOperation]) as [any, number];

        return NextResponse.json({
          data: quizzes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        lastError = error;
        retryCount++;

        // If it's the last retry, throw the error
        if (retryCount === MAX_RETRIES) {
          console.error('Database operation failed after max retries:', error);
          throw new ApiError(
            'Database operation failed',
            503,
            'DATABASE_ERROR'
          );
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Error in GET /quizzes:', error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database operation failed', code: error.code },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DATABASE_CONNECTION_ERROR' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateQuizRequest;

    // Validate required fields
    if (!body.title) {
      throw new ApiError('Title is required', 400, 'VALIDATION_ERROR');
    }
    if (!body.quizType) {
      throw new ApiError('Quiz type is required', 400, 'VALIDATION_ERROR');
    }
    if (!body.templateId) {
      throw new ApiError('Template ID is required', 400, 'VALIDATION_ERROR');
    }
    if (!body.variables) {
      throw new ApiError('Variables are required', 400, 'VALIDATION_ERROR');
    }
    if (!body.answer) {
      throw new ApiError('Answer is required', 400, 'VALIDATION_ERROR');
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: body.title,
        answer: body.answer,
        solution: body.solution,
        variables: body.variables,
        templateId: body.templateId,
        status: QuizStatus.DRAFT,
        language: 'en',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            quizType: true,
          },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 