import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { PostStatus, Prisma, QuizStatus } from "@prisma/client";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Constants for validation
const MAX_FUTURE_DAYS = 365;

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
function buildCacheKey(method: string, params?: Record<string, any>): string {
  const key = `scheduled_posts_${method}`;
  if (!params) return key;
  return `${key}_${JSON.stringify(params)}`;
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

      console.warn(`Connection failure in scheduled posts API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// Validation schema for POST request
const createScheduleSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  scheduledAt: z.string().datetime("Invalid date format"),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  try {
    // Check cache first
    let cacheHit = false;
    const cacheKey = buildCacheKey('GET');
    if (isCacheValid(cacheKey)) {
      console.log('Cache hit for scheduled posts');
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
    const scheduledPosts = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findMany({
        select: SELECT_FIELDS,
        orderBy: {
          scheduledAt: 'asc'
        }
      });
    });

    // Cache the results
    cache[cacheKey] = {
      data: scheduledPosts,
      timestamp: Date.now(),
      ttl: CACHE_TTL.default
    };

    const apiResponse = NextResponse.json(scheduledPosts, { headers });
    trackPerformance(apiResponse, requestPath, method, startTime, cacheHit);
    return apiResponse;
  } catch (error) {
    console.error('Failed to fetch scheduled posts:', error);

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  try {
    const body = await request.json();

    // Validate input
    const validatedData = await createScheduleSchema.parseAsync(body);
    const { quizId, scheduledAt } = validatedData;

    const scheduleDate = new Date(scheduledAt);
    const now = new Date();

    // Validate if the date is in the past
    if (scheduleDate < now) {
      const errorResponse = NextResponse.json(
        { error: 'Cannot schedule posts in the past' },
        { status: 400 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Invalid date');
      return errorResponse;
    }

    // Validate maximum future date
    const maxFutureDate = new Date(now.getTime() + MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000);
    if (scheduleDate > maxFutureDate) {
      const errorResponse = NextResponse.json(
        { error: `Cannot schedule posts more than ${MAX_FUTURE_DAYS} days in advance` },
        { status: 400 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Date too far in future');
      return errorResponse;
    }

    // Check for existing schedules for this quiz
    const existingSchedule = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findFirst({
        where: {
          quizId,
          scheduledAt: scheduleDate,
          status: PostStatus.PENDING
        },
        include: {
          quiz: true
        }
      });
    });

    if (existingSchedule) {
      const errorResponse = NextResponse.json(
        {
          error: 'Scheduling conflict',
          details: `The quiz "${existingSchedule.quiz.title}" is already scheduled for this time slot`
        },
        { status: 409 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Scheduling conflict');
      return errorResponse;
    }

    // Use a transaction to ensure both operations succeed or fail together
    const result = await withConnectionRetry(async () => {
      return prisma.$transaction(async (tx) => {
        // Create new schedule
        const schedule = await tx.scheduledPost.create({
          data: {
            quizId,
            scheduledAt: scheduleDate,
            status: PostStatus.PENDING
          },
          include: {
            quiz: true
          }
        });

        // Update quiz status to SCHEDULED if not already
        const quiz = await tx.quiz.update({
          where: { id: quizId },
          data: { status: QuizStatus.SCHEDULED }
        });

        return { schedule, quiz };
      });
    });

    // Invalidate cache
    const cacheKey = buildCacheKey('GET');
    delete cache[cacheKey];

    const apiResponse = NextResponse.json({
      success: true,
      schedule: result.schedule,
      quiz: result.quiz
    });
    trackPerformance(apiResponse, requestPath, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Failed to create schedule:', error);

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
        statusCode = 400;
        errorMessage = 'This quiz is already scheduled for this time slot';
        errorCode = 'DUPLICATE_SCHEDULE';
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

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      const errorResponse = NextResponse.json(
        { error: 'Missing post ID' },
        { status: 400 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Missing ID');
      return errorResponse;
    }

    const post = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findUnique({
        where: { id },
        include: { quiz: true }
      });
    });

    if (!post) {
      const errorResponse = NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Post not found');
      return errorResponse;
    }

    // Use a transaction to handle both operations
    await withConnectionRetry(async () => {
      await prisma.$transaction(async (tx) => {
        // Delete the scheduled post
        await tx.scheduledPost.delete({
          where: { id }
        });

        // Check if there are any other scheduled posts for this quiz
        const remainingPosts = await tx.scheduledPost.count({
          where: { quizId: post.quizId }
        });

        // Only update quiz status if there are no remaining scheduled posts
        if (remainingPosts === 0) {
          await tx.quiz.update({
            where: { id: post.quizId },
            data: { status: QuizStatus.READY }
          });
        }
      });
    });

    // Invalidate cache
    const cacheKey = buildCacheKey('GET');
    delete cache[cacheKey];

    const apiResponse = NextResponse.json({ success: true });
    trackPerformance(apiResponse, requestPath, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Error deleting scheduled post:', error);

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
      { status: statusCode }
    );

    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 