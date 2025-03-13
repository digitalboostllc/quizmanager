import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma, QuizStatus, QuizType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Cache implementation
// This is a simple in-memory cache. In production, you might want to use Redis or similar
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms - increased from 1 minute
const cache: Record<string, { data: any; timestamp: number }> = {};

// Connection pool management
let connectionFailures = 0;
const MAX_CONNECTION_FAILURES = 3;
const CONNECTION_BACKOFF_BASE = 500; // ms

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

// Helper to manage connection failures with exponential backoff
async function withConnectionRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      retries++;
      // If we've hit max retries or this is not a connection error, rethrow
      if (retries >= maxRetries || !isConnectionError(error)) {
        throw error;
      }

      // Increment global connection failure counter
      connectionFailures++;

      // Exponential backoff with jitter
      const delay = Math.min(
        CONNECTION_BACKOFF_BASE * Math.pow(2, Math.min(connectionFailures, 6)) * (0.5 + Math.random()),
        10000
      );

      console.warn(`Connection failure, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Helper to identify connection-related errors
function isConnectionError(error: any): boolean {
  if (!error) return false;

  // Common connection error indicators from Prisma and pg
  const errorMsg = error.message || '';
  const connectionErrorPatterns = [
    /connection.*pool/i,
    /timeout.*connection/i,
    /failed.*connect/i,
    /ECONNREFUSED/,
    /ETIMEDOUT/,
    /connection.*terminated/i,
    /too.*many.*connections/i,
  ];

  return connectionErrorPatterns.some(pattern => pattern.test(errorMsg));
}

export async function GET(request: NextRequest) {
  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Increased cache times
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

    // Define minimal fields to select - further reduced to only essential fields
    const SELECT_FIELDS = {
      id: true,
      title: true,
      status: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      // Reduced template fields to minimum
      template: {
        select: {
          id: true,
          name: true,
          quizType: true,
        },
      },
    };

    // Cursor-based pagination query
    const cursorObj = cursor ? { id: cursor } : undefined;

    // Use the connection retry mechanism for database queries
    const quizzes = await withConnectionRetry(async () => {
      // Simplified query with minimal data
      return prisma.quiz.findMany({
        where,
        take: limit,
        ...(cursorObj && { cursor: cursorObj, skip: 1 }), // Skip the cursor item
        orderBy: { createdAt: 'desc' },
        select: SELECT_FIELDS,
      });
    }, 3); // 3 retries max

    // Reset connection failure counter on success
    connectionFailures = Math.max(0, connectionFailures - 1);

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
    console.error('Error in GET /quizzes:', error);

    // Empty DB is fine, just return empty results
    const noResults = {
      data: [],
      pagination: { hasMore: false, nextCursor: null, limit: 10 }
    };

    // For user-facing errors, try to give a helpful message
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = 503;
      errorMessage = 'Database operation failed';
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      statusCode = 503;
      errorMessage = 'Database connection failed';
      errorCode = 'DATABASE_CONNECTION_ERROR';
    } else if (isConnectionError(error)) {
      statusCode = 503;
      errorMessage = 'Database connection issues, please try again later';
      errorCode = 'CONNECTION_ERROR';
    }

    // Return graceful error response
    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        ...noResults  // Always include empty results so the UI can still render
      },
      { status: statusCode, headers }
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