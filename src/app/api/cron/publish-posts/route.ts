import { FacebookService } from '@/lib/facebook';
import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { PostStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from 'next/server';

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

      console.warn(`Connection failure in publish-posts cron, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// This endpoint should be called by a cron job every minute
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestPath = request.nextUrl.pathname;
  const method = request.method;

  try {
    // Get all pending posts that are due
    const pendingPosts = await withConnectionRetry(async () => {
      return prisma.scheduledPost.findMany({
        where: {
          status: PostStatus.PENDING,
          scheduledAt: {
            lte: new Date(), // Posts that are due or overdue
          },
        },
        include: {
          quiz: true,
        },
        take: 5, // Process 5 posts at a time to avoid overload
      });
    });

    const results = [];

    for (const post of pendingPosts) {
      try {
        // Mark as processing
        await withConnectionRetry(async () => {
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { status: PostStatus.PROCESSING },
          });
        });

        // Create Facebook post
        const fbPostId = await FacebookService.createPost({
          message: post.caption || `Quiz: ${post.quiz.title}`,
          imageUrl: post.quiz.imageUrl!,
          scheduledTime: post.scheduledAt.toISOString(),
        });

        // Mark as published
        await withConnectionRetry(async () => {
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: {
              status: PostStatus.PUBLISHED,
              fbPostId,
              publishedAt: new Date(),
            },
          });
        });

        results.push({
          id: post.id,
          status: 'success',
          fbPostId,
        });
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);

        // Update retry count and status
        const updatedPost = await withConnectionRetry(async () => {
          return prisma.scheduledPost.update({
            where: { id: post.id },
            data: {
              status: PostStatus.FAILED,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              retryCount: { increment: 1 },
              lastRetryAt: new Date(),
            },
          });
        });

        results.push({
          id: post.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: updatedPost.retryCount,
        });
      }
    }

    const apiResponse = NextResponse.json({
      processed: results.length,
      results,
    });
    trackPerformance(apiResponse, requestPath, method, startTime);
    return apiResponse;
  } catch (error) {
    console.error('Error processing scheduled posts:', error);

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
      { status: statusCode }
    );

    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 