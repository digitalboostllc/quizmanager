import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, QuizType, QuizStatus } from '@prisma/client';
import { ApiError } from '@/services/api/errors/ApiError';

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

    const [quizzes, total] = await Promise.all([
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
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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