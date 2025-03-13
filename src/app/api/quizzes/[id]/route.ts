import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { updateQuizSchema } from '@/lib/validations/api';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import * as pathModule from 'path';

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
  return `quiz_${id}`;
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

      console.warn(`Connection failure in quiz API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  try {
    const id = context.params.id;

    // Check cache first
    let cacheHit = false;
    const cacheKey = buildCacheKey(id);
    if (isCacheValid(cacheKey)) {
      console.log(`Cache hit for quiz ${id}`);
      const cachedResponse = NextResponse.json(cache[cacheKey].data, { headers });
      cacheHit = true;
      trackPerformance(cachedResponse, requestPath, method, startTime, cacheHit);
      return cachedResponse;
    }

    // Optimize field selection
    const SELECT_FIELDS = {
      id: true,
      title: true,
      answer: true,
      solution: true,
      variables: true,
      status: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      template: {
        select: {
          id: true,
          name: true,
          quizType: true,
          html: true,
          css: true,
        },
      },
      _count: {
        select: {
          scheduledPost: true,
        },
      },
    };

    // Execute the query with connection retries
    const quiz = await withConnectionRetry(async () => {
      return prisma.quiz.findUnique({
        where: { id },
        select: SELECT_FIELDS,
      });
    });

    if (!quiz) {
      const notFoundResponse = NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404, headers }
      );
      trackPerformance(notFoundResponse, requestPath, method, startTime, false, 'Quiz not found');
      return notFoundResponse;
    }

    // Cache the results
    cache[cacheKey] = {
      data: quiz,
      timestamp: Date.now(),
      ttl: CACHE_TTL.default
    };

    const apiResponse = NextResponse.json(quiz, { headers });
    trackPerformance(apiResponse, requestPath, method, startTime, cacheHit);
    return apiResponse;
  } catch (error) {
    console.error('Error fetching quiz:', error);

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

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  try {
    const id = context.params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = await updateQuizSchema.parseAsync(body);

    // Optimize field selection
    const SELECT_FIELDS = {
      id: true,
      title: true,
      answer: true,
      solution: true,
      variables: true,
      status: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      template: {
        select: {
          id: true,
          name: true,
          quizType: true,
          html: true,
          css: true,
        },
      },
      _count: {
        select: {
          scheduledPost: true,
        },
      },
    };

    // Execute the update with connection retries
    const quiz = await withConnectionRetry(async () => {
      return prisma.quiz.update({
        where: { id },
        data: {
          title: validatedData.title,
          variables: validatedData.variables,
          templateId: validatedData.templateId,
          answer: validatedData.answer,
          solution: validatedData.solution,
          status: validatedData.status,
        },
        select: SELECT_FIELDS,
      });
    });

    // Invalidate cache
    const cacheKey = buildCacheKey(id);
    delete cache[cacheKey];

    const apiResponse = NextResponse.json(quiz);
    trackPerformance(apiResponse, requestPath, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Error updating quiz:', error);

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
        errorMessage = 'Quiz not found';
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

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  try {
    const id = context.params.id;

    // First check if the quiz exists with optimized field selection
    const quiz = await withConnectionRetry(async () => {
      return prisma.quiz.findUnique({
        where: { id },
        select: {
          id: true,
          imageUrl: true,
        },
      });
    });

    if (!quiz) {
      const notFoundResponse = NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
      trackPerformance(notFoundResponse, requestPath, method, startTime, false, 'Quiz not found');
      return notFoundResponse;
    }

    // Delete the image file if it exists
    if (quiz.imageUrl) {
      try {
        const imagePath = pathModule.join(process.cwd(), 'public', quiz.imageUrl);
        await fs.unlink(imagePath);
        console.log('Successfully deleted image file:', imagePath);
      } catch (error) {
        // Log error but continue with quiz deletion
        console.error('Error deleting image file:', error);
      }
    }

    // Use a transaction to handle both operations with connection retries
    await withConnectionRetry(async () => {
      await prisma.$transaction(async (tx) => {
        // Delete all associated scheduled posts first
        await tx.scheduledPost.deleteMany({
          where: { quizId: id }
        });

        // Then delete the quiz
        await tx.quiz.delete({
          where: { id }
        });
      });
    });

    // Invalidate cache
    const cacheKey = buildCacheKey(id);
    delete cache[cacheKey];

    const apiResponse = NextResponse.json({ success: true });
    trackPerformance(apiResponse, requestPath, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Error deleting quiz:', error);

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
        errorMessage = 'Quiz not found';
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