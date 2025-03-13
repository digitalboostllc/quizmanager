import { authOptions } from '@/lib/auth/auth-options';
import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma } from "@prisma/client";
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Cache implementation with dynamic TTL
const CACHE_TTL = {
    default: 5 * 60 * 1000,  // 5 minutes for most queries
    minimal: 60 * 1000       // 1 minute for frequently changing data
};

// Cache interface for type safety
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Shared cache object with reset route
declare const globalThis: {
    wordUsageCache?: Record<string, CacheEntry<any>>;
};

// Initialize global cache if not exists
if (!globalThis.wordUsageCache) {
    globalThis.wordUsageCache = {};
}

// Helper to build a cache key
function buildCacheKey(userId: string, method: string, params?: Record<string, any>): string {
    const key = `word_usage_${userId}_${method}`;
    if (!params) return key;
    return `${key}_${JSON.stringify(params)}`;
}

// Helper to check if cache entry is still valid
function isCacheValid(key: string): boolean {
    if (!globalThis.wordUsageCache?.[key]) return false;
    const now = Date.now();
    return now - globalThis.wordUsageCache[key].timestamp < globalThis.wordUsageCache[key].ttl;
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

            console.warn(`Connection failure in word usage API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// Validation schema for word operations
const wordOperationSchema = z.object({
    word: z.string().min(1, "Word is required"),
    language: z.string().default('fr')
});

// GET - Retrieve word usage for a user
export async function GET(request: NextRequest) {
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

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language') || 'fr';
        const word = searchParams.get('word');

        // Check cache first
        const cacheKey = buildCacheKey(session.user.id, 'GET', { language, word });
        if (isCacheValid(cacheKey)) {
            console.log('Cache hit for word usage');
            const cachedResponse = NextResponse.json(globalThis.wordUsageCache![cacheKey].data);
            trackPerformance(cachedResponse, requestPath, method, startTime, true);
            return cachedResponse;
        }

        // If a specific word is requested, return its usage status
        if (word) {
            const wordUsage = await withConnectionRetry(async () => {
                return prisma.wordUsage.findUnique({
                    where: {
                        userId_word_language: {
                            userId: session.user.id,
                            word,
                            language,
                        },
                    },
                });
            });

            const result = { isUsed: !!wordUsage };

            // Cache the result
            globalThis.wordUsageCache![cacheKey] = {
                data: result,
                timestamp: Date.now(),
                ttl: CACHE_TTL.minimal
            };

            const apiResponse = NextResponse.json(result);
            trackPerformance(apiResponse, requestPath, method, startTime, false);
            return apiResponse;
        }

        // Otherwise return all used words for this user and language
        const usedWords = await withConnectionRetry(async () => {
            return prisma.wordUsage.findMany({
                where: {
                    userId: session.user.id,
                    language,
                },
                orderBy: {
                    usedAt: 'desc',
                },
                select: {
                    id: true,
                    word: true,
                    language: true,
                    isUsed: true,
                    usedAt: true,
                }
            });
        });

        // Cache the results
        globalThis.wordUsageCache![cacheKey] = {
            data: usedWords,
            timestamp: Date.now(),
            ttl: CACHE_TTL.default
        };

        const apiResponse = NextResponse.json(usedWords);
        trackPerformance(apiResponse, requestPath, method, startTime, false);
        return apiResponse;
    } catch (error) {
        console.error('Error fetching word usage:', error);

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

// POST - Mark a word as used
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
        const validatedData = await wordOperationSchema.parseAsync(body);
        const { word, language } = validatedData;

        // Create or update word usage entry with retry logic
        const wordUsage = await withConnectionRetry(async () => {
            return prisma.wordUsage.upsert({
                where: {
                    userId_word_language: {
                        userId: session.user.id,
                        word,
                        language,
                    },
                },
                update: {
                    isUsed: true,
                    usedAt: new Date(),
                },
                create: {
                    userId: session.user.id,
                    word,
                    language,
                    isUsed: true,
                },
            });
        });

        // Invalidate relevant caches
        const cachePrefix = `word_usage_${session.user.id}`;
        Object.keys(globalThis.wordUsageCache || {}).forEach(key => {
            if (key.startsWith(cachePrefix)) {
                delete globalThis.wordUsageCache![key];
            }
        });

        const apiResponse = NextResponse.json(wordUsage);
        trackPerformance(apiResponse, requestPath, method, startTime);
        return apiResponse;
    } catch (error) {
        console.error('Error marking word as used:', error);

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

// PUT - Toggle word usage status
export async function PUT(request: NextRequest) {
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
        const validatedData = await wordOperationSchema.parseAsync(body);
        const { word, language } = validatedData;

        // Use transaction to ensure atomicity
        const result = await withConnectionRetry(async () => {
            return prisma.$transaction(async (tx) => {
                const existingWordUsage = await tx.wordUsage.findUnique({
                    where: {
                        userId_word_language: {
                            userId: session.user.id,
                            word,
                            language,
                        },
                    },
                });

                if (existingWordUsage && existingWordUsage.isUsed) {
                    await tx.wordUsage.delete({
                        where: { id: existingWordUsage.id },
                    });
                    return { word, isUsed: false };
                }

                const wordUsage = await tx.wordUsage.create({
                    data: {
                        userId: session.user.id,
                        word,
                        language,
                        isUsed: true,
                    },
                });
                return wordUsage;
            });
        });

        // Invalidate relevant caches
        const cachePrefix = `word_usage_${session.user.id}`;
        Object.keys(globalThis.wordUsageCache || {}).forEach(key => {
            if (key.startsWith(cachePrefix)) {
                delete globalThis.wordUsageCache![key];
            }
        });

        const apiResponse = NextResponse.json(result);
        trackPerformance(apiResponse, requestPath, method, startTime);
        return apiResponse;
    } catch (error) {
        console.error('Error toggling word usage:', error);

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