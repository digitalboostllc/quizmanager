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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as QuizType | null;

    // Check cache first
    const cacheKey = buildCacheKey(request);
    if (isCacheValid(cacheKey)) {
      console.log(`Cache hit for ${cacheKey}`);
      return NextResponse.json(cache[cacheKey].data, { headers });
    }

    // Optimize the where condition to use indexes effectively
    const where: Prisma.QuizWhereInput = {
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
      ...(type && { quizType: type }),
    };

    // Add timeout and retry logic with longer timeouts
    const MAX_RETRIES = 2;
    const TIMEOUT = 20000; // 20 seconds timeout
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

        // Try more efficient approach - first get just the quizzes
        const quizzesPromise = prisma.quiz.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: SELECT_FIELDS,
        });

        const quizzes = await Promise.race([
          quizzesPromise,
          timeoutPromise.then(() => { throw new Error('Database operation timed out'); })
        ]);

        // Then get an approximate count (faster than exact count)
        let totalPages = 1;
        let total = 0;

        try {
          // Only do a count query if it's the first page (most important for UX)
          if (page === 1) {
            // Use a faster count estimation for large tables 
            const countResult = await prisma.$queryRaw<[{ count: BigInt }]>`
              SELECT reltuples::bigint AS count
              FROM pg_class
              WHERE relname = 'Quiz';
            `;

            // If the estimate is available, use it
            if (countResult && countResult[0] && countResult[0].count) {
              total = Number(countResult[0].count);
              totalPages = Math.ceil(total / limit);
            } else {
              // Fallback to counting via a where query but limit to 1000
              const countQuery = await prisma.quiz.findMany({
                where,
                take: 1000,
                select: { id: true }
              });
              total = countQuery.length;
              totalPages = Math.ceil(total / limit) || 1;
            }
          } else {
            // For non-first pages, if we got results, there's at least one more page
            total = (page * limit) + (quizzes.length === limit ? limit : 0);
            totalPages = Math.ceil(total / limit) || 1;
          }
        } catch (countError) {
          console.warn('Count query failed, using estimate:', countError);
          total = quizzes.length + ((page - 1) * limit);
          totalPages = page + (quizzes.length === limit ? 1 : 0);
        }

        const response = {
          data: quizzes,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        };

        // Store in cache
        cache[cacheKey] = {
          data: response,
          timestamp: Date.now()
        };

        return NextResponse.json(response, { headers });
      } catch (error) {
        lastError = error;
        retryCount++;
        console.warn(`Retry ${retryCount}/${MAX_RETRIES} for quizzes query:`, error);

        // If it's the last retry, try a more minimal query as fallback
        if (retryCount === MAX_RETRIES) {
          try {
            // Fallback to a simpler query without count
            const simpleQuery = await prisma.quiz.findMany({
              where,
              skip: (page - 1) * limit,
              take: limit,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            });

            const response = {
              data: simpleQuery,
              pagination: {
                page,
                limit,
                total: simpleQuery.length + ((page - 1) * limit),
                totalPages: page + (simpleQuery.length === limit ? 1 : 0),
              },
            };

            // Still cache this fallback result
            cache[cacheKey] = {
              data: response,
              timestamp: Date.now()
            };

            return NextResponse.json(response, { headers });
          } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
            throw new ApiError(
              'Database operation failed',
              503,
              'DATABASE_ERROR'
            );
          }
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