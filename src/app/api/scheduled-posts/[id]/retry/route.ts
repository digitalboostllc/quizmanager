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

            console.warn(`Connection failure in scheduled post retry API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const startTime = Date.now();
    const requestPath = request.nextUrl.pathname;
    const method = request.method;

    try {
        const { id } = params;

        // Find the post first to check if it exists and is in FAILED status
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

        if (post.status !== PostStatus.FAILED) {
            const errorResponse = NextResponse.json(
                { error: 'Only failed posts can be retried' },
                { status: 400 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, 'Invalid post status');
            return errorResponse;
        }

        // Check if we've exceeded the maximum retry attempts
        const MAX_RETRY_ATTEMPTS = 3;
        if (post.retryCount >= MAX_RETRY_ATTEMPTS) {
            const errorResponse = NextResponse.json(
                {
                    error: 'Maximum retry attempts exceeded',
                    details: `This post has already been retried ${MAX_RETRY_ATTEMPTS} times`
                },
                { status: 400 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, 'Max retries exceeded');
            return errorResponse;
        }

        // Update the post status back to PENDING
        const updatedPost = await withConnectionRetry(async () => {
            return prisma.scheduledPost.update({
                where: { id },
                data: {
                    status: PostStatus.PENDING,
                    errorMessage: null,
                    lastRetryAt: new Date(),
                    retryCount: { increment: 1 }
                },
                include: {
                    quiz: true
                }
            });
        });

        const apiResponse = NextResponse.json(updatedPost);
        trackPerformance(apiResponse, requestPath, method, startTime);
        return apiResponse;
    } catch (error) {
        console.error('Error retrying scheduled post:', error);

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