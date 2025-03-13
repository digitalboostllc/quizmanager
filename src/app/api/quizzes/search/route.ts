import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma, QuizStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

// Cache implementation with dynamic TTL
const CACHE_TTL = {
  default: 5 * 60 * 1000, // 5 minutes for most queries
  search: 10 * 60 * 1000,  // 10 minutes for search results
};

// Cache structure with typed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Typed cache object
const cache: Record<string, CacheEntry<any>> = {};

// Helper to build a cache key from request parameters
function buildCacheKey(url: string, params: URLSearchParams): string {
  const sortedParams = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `quiz_search_${sortedParams || 'all'}`;
}

// Helper to check if cache entry is still valid
function isCacheValid(key: string): boolean {
  if (!cache[key]) return false;
  const now = Date.now();
  return now - cache[key].timestamp < cache[key].ttl;
}

// Connection retry helper with improved error detection and handling
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

      console.warn(`Connection failure in quiz search API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

export async function GET(request: Request) {
  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const status = searchParams.get('status') as QuizStatus | null;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Check cache first
    const cacheKey = buildCacheKey(request.url, searchParams);
    if (isCacheValid(cacheKey)) {
      console.log(`Cache hit for ${cacheKey}`);
      return NextResponse.json(cache[cacheKey].data, { headers });
    }

    // Build where conditions
    const where: Prisma.QuizWhereInput = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Optimize field selection
    const SELECT_FIELDS = {
      id: true,
      title: true,
      imageUrl: true,
      status: true,
      createdAt: true,
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

    // Execute the query with connection retries
    const quizzes = await withConnectionRetry(async () => {
      return prisma.quiz.findMany({
        where,
        select: SELECT_FIELDS,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    });

    // Cache the results
    cache[cacheKey] = {
      data: quizzes,
      timestamp: Date.now(),
      ttl: query ? CACHE_TTL.search : CACHE_TTL.default
    };

    return NextResponse.json(quizzes, { headers });
  } catch (error) {
    console.error('Error searching quizzes:', error);

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
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        data: []
      },
      { status: statusCode, headers }
    );
  }
} 