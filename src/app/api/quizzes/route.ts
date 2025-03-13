import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma, QuizStatus, QuizType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Cache implementation
// This is a simple in-memory cache. In production, you might want to use Redis or similar
const CACHE_TTL = 60 * 1000; // 1 minute in ms
const cache: Record<string, { data: any; timestamp: number }> = {};

interface CreateQuizRequest {
  title: string;
  description?: string;
  quizType: QuizType;
  variables: Prisma.JsonValue;
  templateId: string;
  answer: string;
  solution?: string;
}

// Helper to build a cache key from request parameters
function buildCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  return `quizzes_${params.toString()}`;
}

// Helper to check if cache entry is still valid
function isCacheValid(key: string): boolean {
  if (!cache[key]) return false;
  const now = Date.now();
  return now - cache[key].timestamp < CACHE_TTL;
}

export async function GET(request: NextRequest) {
  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as QuizType | null;

    // New cursor-based pagination
    const cursor = searchParams.get('cursor') || undefined;

    // Check cache first (but not when using cursor, as each page is unique)
    if (!cursor) {
      const cacheKey = buildCacheKey(request);
      if (isCacheValid(cacheKey)) {
        console.log(`Cache hit for ${cacheKey}`);
        return NextResponse.json(cache[cacheKey].data, { headers });
      }
    }

    // Optimize the where condition to use indexes effectively
    const where: Prisma.QuizWhereInput = {};

    // Only add conditions if they are provided
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (type) {
      // For template type filtering (since Quiz doesn't have quizType directly)
      where.template = {
        quizType: type
      };
    }

    // Add timeout and retry logic with longer timeouts
    const MAX_RETRIES = 2;
    const TIMEOUT = 10000; // Reduce timeout to 10 seconds

    // Define minimal fields to select
    const SELECT_FIELDS = {
      id: true,
      title: true,
      status: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      template: {
        select: {
          id: true,
          name: true,
          quizType: true,
        },
      },
    };

    let retryCount = 0;
    let lastError: any;

    while (retryCount < MAX_RETRIES) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database operation timed out')), TIMEOUT);
        });

        // Cursor-based pagination query
        const cursorObj = cursor ? { id: cursor } : undefined;

        // Simplified query - less data returned
        const quizzesPromise = prisma.quiz.findMany({
          where,
          take: limit,
          ...(cursorObj && { cursor: cursorObj, skip: 1 }), // Skip the cursor item
          orderBy: { createdAt: 'desc' },
          select: SELECT_FIELDS,
        });

        // Execute the query with timeout
        const quizzes = await Promise.race([
          quizzesPromise,
          timeoutPromise.then(() => { throw new Error('Database operation timed out'); })
        ]);

        // No need for count query with cursor-based pagination 
        // Just determine if there are more items
        const lastItem = quizzes.length > 0 ? quizzes[quizzes.length - 1] : null;
        const nextCursor = lastItem?.id;
        const hasMore = quizzes.length === limit;

        const response = {
          data: quizzes,
          pagination: {
            hasMore,
            nextCursor,
            limit,
          },
        };

        // Only cache first page results
        if (!cursor) {
          const cacheKey = buildCacheKey(request);
          cache[cacheKey] = {
            data: response,
            timestamp: Date.now()
          };
        }

        return NextResponse.json(response, { headers });
      } catch (error) {
        lastError = error;
        retryCount++;
        console.warn(`Retry ${retryCount}/${MAX_RETRIES} for quizzes query:`, error);

        // Wait before retrying (exponential backoff)
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }

    // If all retries failed, return a minimal fallback response
    console.error('All retries failed for quizzes query:', lastError);
    return NextResponse.json(
      {
        error: 'Database query failed after multiple attempts',
        data: [],
        pagination: { hasMore: false, nextCursor: null, limit }
      },
      {
        status: 503,
        headers
      }
    );
  } catch (error) {
    console.error('Error in GET /quizzes:', error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers }
      );
    }

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database operation failed', code: error.code },
        { status: 503, headers }
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: 'Database connection failed', code: 'DATABASE_CONNECTION_ERROR' },
        { status: 503, headers }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500, headers }
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