import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { PostStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Cache implementation with dynamic TTL
const CACHE_TTL = {
  default: 5 * 60 * 1000, // 5 minutes for most queries
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

// Helper to build a cache key
function buildCacheKey(id: string): string {
  return `scheduled_post_${id}`;
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

      console.warn(`Connection failure in scheduled post API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// Validation schema for PATCH request
const updateScheduleSchema = z.object({
  scheduledAt: z.string().datetime("Invalid date format"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  try {
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validatedData = await updateScheduleSchema.parseAsync(body);
    const { scheduledAt } = validatedData;

    const newScheduleDate = new Date(scheduledAt);

    // Validate if the date is in the past
    if (newScheduleDate < new Date()) {
      const errorResponse = NextResponse.json(
        { error: 'Cannot schedule posts in the past' },
        { status: 400 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Invalid date');
      return errorResponse;
    }

    // Find the post first to check if it exists and is in PENDING status
    const existingPost = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findUnique({
        where: { id },
        include: { quiz: true }
      });
    });

    if (!existingPost) {
      const errorResponse = NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Post not found');
      return errorResponse;
    }

    if (existingPost.status !== PostStatus.PENDING) {
      const errorResponse = NextResponse.json(
        { error: 'Only pending posts can be rescheduled' },
        { status: 400 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Invalid post status');
      return errorResponse;
    }

    // Check for existing posts at the same time for the same quiz
    const conflictingPost = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findFirst({
        where: {
          AND: [
            { quizId: existingPost.quizId },
            { scheduledAt: newScheduleDate },
            { id: { not: id } } // Exclude the current post
          ]
        }
      });
    });

    if (conflictingPost) {
      const errorResponse = NextResponse.json(
        {
          error: 'Scheduling conflict',
          details: `The quiz "${existingPost.quiz.title}" is already scheduled for this time slot`,
          conflictingPost
        },
        { status: 409 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Scheduling conflict');
      return errorResponse;
    }

    // Update the post
    const updatedPost = await withConnectionRetry(async () => {
      return prisma.scheduledPost.update({
        where: { id },
        data: {
          scheduledAt: newScheduleDate
        },
        include: {
          quiz: true
        }
      });
    });

    // Invalidate cache
    const cacheKey = buildCacheKey(id);
    delete cache[cacheKey];

    const apiResponse = NextResponse.json(updatedPost);
    trackPerformance(apiResponse, requestPath, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Error updating scheduled post:', error);

    // Enhanced error handling with more detailed error responses
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        statusCode = 409;
        errorMessage = 'Scheduling conflict';
        errorCode = 'DUPLICATE_SCHEDULE';
      } else if (error.code === 'P2025') {
        statusCode = 404;
        errorMessage = 'Scheduled post not found';
        errorCode = 'NOT_FOUND';
      } else {
        statusCode = 503;
        errorMessage = 'Database operation failed';
        errorCode = error.code;
      }
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

    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  try {
    const { id } = params;

    // Check cache first
    let cacheHit = false;
    const cacheKey = buildCacheKey(id);
    if (isCacheValid(cacheKey)) {
      console.log(`Cache hit for scheduled post ${id}`);
      const cachedResponse = NextResponse.json(cache[cacheKey].data, { headers });
      cacheHit = true;
      trackPerformance(cachedResponse, requestPath, method, startTime, cacheHit);
      return cachedResponse;
    }

    // Optimize field selection
    const SELECT_FIELDS = {
      id: true,
      quizId: true,
      scheduledAt: true,
      publishedAt: true,
      status: true,
      fbPostId: true,
      caption: true,
      errorMessage: true,
      retryCount: true,
      lastRetryAt: true,
      createdAt: true,
      updatedAt: true,
      quiz: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          status: true,
        }
      }
    };

    // Execute the query with connection retries
    const post = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findUnique({
        where: { id },
        select: SELECT_FIELDS,
      });
    });

    if (!post) {
      const errorResponse = NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404, headers }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Post not found');
      return errorResponse;
    }

    // Cache the results
    cache[cacheKey] = {
      data: post,
      timestamp: Date.now(),
      ttl: CACHE_TTL.default
    };

    const apiResponse = NextResponse.json(post, { headers });
    trackPerformance(apiResponse, requestPath, method, startTime, cacheHit);
    return apiResponse;
  } catch (error) {
    console.error('Error fetching scheduled post:', error);

    // Enhanced error handling with more detailed error responses
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        statusCode = 404;
        errorMessage = 'Scheduled post not found';
        errorCode = 'NOT_FOUND';
      } else {
        statusCode = 503;
        errorMessage = 'Database operation failed';
        errorCode = error.code;
      }
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      statusCode = 503;
      errorMessage = 'Database connection failed';
      errorCode = 'DATABASE_CONNECTION_ERROR';
    } else if (isConnectionError(error)) {
      statusCode = 503;
      errorMessage = 'Database connection issues, please try again later';
      errorCode = 'CONNECTION_ERROR';
    }

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
      },
      { status: statusCode, headers }
    );

    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 