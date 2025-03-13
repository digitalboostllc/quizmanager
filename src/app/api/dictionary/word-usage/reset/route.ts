import { authOptions } from '@/lib/auth/auth-options';
import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma } from "@prisma/client";
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Cache interface for type safety
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Shared cache object with the main word-usage route
declare const globalThis: {
    wordUsageCache?: Record<string, CacheEntry<any>>;
};

// Initialize global cache if not exists
if (!globalThis.wordUsageCache) {
    globalThis.wordUsageCache = {};
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

            console.warn(`Connection failure in word usage reset API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// Validation schema for reset operation
const resetSchema = z.object({
    language: z.string().default('fr')
});

// POST - Reset all word usage for a user
export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const requestPath = request.nextUrl.pathname;
    const method = request.method;

    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            const errorResponse = NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, 'Unauthorized');
            return errorResponse;
        }

        const body = await request.json();
        const validatedData = await resetSchema.parseAsync(body);
        const { language } = validatedData;

        // Delete all word usage entries for this user and language with retry logic
        const result = await withConnectionRetry(async () => {
            return prisma.wordUsage.deleteMany({
                where: {
                    userId: session.user.id,
                    language,
                },
            });
        });

        // Invalidate all word usage caches for this user
        const cachePrefix = `word_usage_${session.user.id}`;
        Object.keys(globalThis.wordUsageCache || {}).forEach(key => {
            if (key.startsWith(cachePrefix)) {
                delete globalThis.wordUsageCache![key];
            }
        });

        const apiResponse = NextResponse.json({
            message: `Reset ${result.count} words to available status`,
            count: result.count,
        });
        trackPerformance(apiResponse, requestPath, method, startTime);
        return apiResponse;
    } catch (error) {
        console.error('Error resetting word usage:', error);

        let statusCode = 500;
        let errorMessage = 'Internal server error';
        let errorCode = 'INTERNAL_SERVER_ERROR';

        if (error instanceof z.ZodError) {
            statusCode = 400;
            errorMessage = 'Invalid input data';
            errorCode = 'VALIDATION_ERROR';
        } else if (error instanceof ApiError) {
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