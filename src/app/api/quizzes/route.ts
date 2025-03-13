import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { createQuizSchema, paginationParamsSchema, searchQuerySchema, validateQueryParams } from '@/lib/validations/api';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma, QuizStatus, QuizType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Enhanced cache implementation with dynamic TTL based on query complexity
const CACHE_TTL = {
  default: 5 * 60 * 1000, // 5 minutes for most queries
  search: 10 * 60 * 1000,  // 10 minutes for search results (less frequently changing)
  minimal: 60 * 1000      // 1 minute for frequently changing data
};

// Cache structure with typed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Typed cache object
const cache: Record<string, CacheEntry<any>> = {};

// Connection pool management
let connectionFailures = 0;
const MAX_CONNECTION_FAILURES = 5;
const CONNECTION_BACKOFF_BASE = 250; // ms - reduced for faster retries

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
function buildCacheKey(url: string, params: URLSearchParams): string {
  // Create a deterministic order of params
  const sortedParams = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `quizzes_${sortedParams || 'all'}`;
}

// Helper to check if cache entry is still valid
function isCacheValid(key: string): boolean {
  if (!cache[key]) return false;
  const now = Date.now();
  return now - cache[key].timestamp < cache[key].ttl;
}

// Helper to manage connection failures with exponential backoff
async function withConnectionRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  let lastError: any = null;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      retries++;

      if (retries >= maxRetries || !isConnectionError(error)) {
        console.error(`Operation failed after ${retries} attempts:`, error);
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        250 * Math.pow(1.5, Math.min(retries, 6)) * (0.5 + Math.random()),
        5000 // Cap at 5 seconds
      );

      console.warn(`Connection failure in quizzes API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Enhanced helper to identify connection-related errors
function isConnectionError(error: any): boolean {
  if (!error) return false;

  const errorMsg = (error.message || '').toLowerCase();

  // Check if it's a Prisma connection error
  if (error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError) {
    return true;
  }

  // Check common connection error patterns
  const connectionErrorPatterns = [
    /connection.*pool/i,
    /timeout.*connection/i,
    /failed.*connect/i,
    /ECONNREFUSED/,
    /ETIMEDOUT/,
    /connection.*terminated/i,
    /too.*many.*connections/i,
    /timed out/i,
    /could not acquire/i,
    /query.*timeout/i,
  ];

  return connectionErrorPatterns.some(pattern => pattern.test(errorMsg));
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const { limit, cursor } = await validateQueryParams(paginationParamsSchema, searchParams);
    const { query, type, status } = await validateQueryParams(searchQuerySchema, searchParams);

    // Don't use cache for cursor-based pagination requests after the first page
    let cacheHit = false;
    if (!cursor) {
      const cacheKey = buildCacheKey(request.url, searchParams);
      if (isCacheValid(cacheKey)) {
        console.log(`Cache hit for ${cacheKey}`);
        const cachedResponse = NextResponse.json(cache[cacheKey].data, { headers });
        cacheHit = true;
        trackPerformance(cachedResponse, path, method, startTime, cacheHit);
        return cachedResponse;
      }
    }

    // Build where conditions
    const where: Prisma.QuizWhereInput = {};

    if (query) {
      where.title = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.template = {
        quizType: type
      };
    }

    if (status) {
      where.status = status;
    }

    // Optimize field selection (only select what's actually needed)
    const SELECT_FIELDS = {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      imageUrl: true,
      template: {
        select: {
          id: true,
          quizType: true,
        },
      },
      _count: {
        select: {
          scheduledPost: true,
        },
      },
    };

    // Set up cursor for pagination
    const cursorObj = cursor ? { id: cursor } : undefined;

    // Execute the query with connection retries
    const quizzes = await withConnectionRetry(async () => {
      return prisma.quiz.findMany({
        where,
        take: limit,
        ...(cursorObj && { cursor: cursorObj, skip: 1 }), // Skip the cursor item
        orderBy: { createdAt: 'desc' },
        select: SELECT_FIELDS,
      });
    });

    // Determine if there are more items
    const lastItem = quizzes.length > 0 ? quizzes[quizzes.length - 1] : null;
    const nextCursor = lastItem?.id;
    const hasMore = quizzes.length === limit;

    // Format the response data
    const responseData = {
      data: quizzes,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };

    // Cache the results (only first page)
    if (!cursor) {
      const cacheKey = buildCacheKey(request.url, searchParams);
      // Use appropriate TTL based on query type
      const ttl = query ? CACHE_TTL.search : CACHE_TTL.default;

      cache[cacheKey] = {
        data: responseData,
        timestamp: Date.now(),
        ttl
      };
    }

    const apiResponse = NextResponse.json(responseData, { headers });
    trackPerformance(apiResponse, path, method, startTime, cacheHit);
    return apiResponse;
  } catch (error) {
    console.error("Error in GET /quizzes:", error);

    // Enhanced error handling with more detailed error responses
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
    } else if (error instanceof Error) {
      statusCode = 400;
      errorMessage = error.message;
      errorCode = 'VALIDATION_ERROR';
    }

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        data: [],
        pagination: { hasMore: false, nextCursor: null, limit: 20 }
      },
      { status: statusCode, headers }
    );

    trackPerformance(errorResponse, path, method, startTime, false, errorMessage);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  try {
    const body = await request.json();

    // Validate request body
    const validatedData = await createQuizSchema.parseAsync(body);

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        answer: validatedData.answer,
        solution: validatedData.solution,
        variables: validatedData.variables,
        templateId: validatedData.templateId,
        status: QuizStatus.DRAFT,
        language: validatedData.language,
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

    const apiResponse = NextResponse.json(quiz);
    trackPerformance(apiResponse, path, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Error creating quiz:', error);

    // Enhanced error handling with more detailed error responses
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
    } else if (error instanceof Error) {
      statusCode = 400;
      errorMessage = error.message;
      errorCode = 'VALIDATION_ERROR';
    }

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
      },
      { status: statusCode }
    );

    trackPerformance(errorResponse, path, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 