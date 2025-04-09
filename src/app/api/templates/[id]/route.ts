import { getTemplateCache, setTemplateCache } from "@/lib/cache";
import { trackPerformance } from '@/lib/monitoring';
import { prisma } from "@/lib/prisma";
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from "next/server";
import pathModule from 'path';
import { z } from "zod";

const updateTemplateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    html: z.string().min(1, "HTML template is required"),
    css: z.string().optional(),
    variables: z.record(z.string(), z.string()).refine((data) => Object.keys(data).length > 0, {
        message: "At least one variable is required",
    }),
});

// Add a schema for PATCH operations
const patchTemplateSchema = z.object({
    previewImageUrl: z.string().nullable().optional(),
    isPublic: z.boolean().optional(),
    planId: z.string().nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});

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

// Helper to build a cache key from template ID
function buildCacheKey(id: string): string {
    return `template_${id}`;
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

            console.warn(`Connection failure in templates API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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
        const validatedData = updateTemplateSchema.parse(body);

        // Use a transaction for updating to ensure atomicity
        const updatedTemplate = await withConnectionRetry(async () => {
            return prisma.template.update({
                where: { id },
                data: {
                    name: validatedData.name,
                    html: validatedData.html,
                    css: validatedData.css,
                    variables: validatedData.variables,
                },
            });
        });

        // Invalidate cache
        const cacheKey = buildCacheKey(id);
        delete cache[cacheKey];

        const apiResponse = NextResponse.json(updatedTemplate);
        trackPerformance(apiResponse, requestPath, method, startTime);
        return apiResponse;
    } catch (error) {
        console.error('Error updating template:', error);

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
                errorMessage = 'Template not found';
                errorCode = 'NOT_FOUND';
            } else {
                statusCode = 400;
                errorMessage = 'Database operation failed';
                errorCode = error.code;
            }
        } else if (error instanceof z.ZodError) {
            statusCode = 400;
            errorMessage = error.errors.map(e => e.message).join(', ');
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

export async function GET(request: Request, context: { params: { id: string } }) {
    console.log(`Fetching template by ID: ${await context.params.id}`);

    try {
        const id = await context.params.id;

        // Check cache first
        let cacheHit = false;
        const cachedTemplate = getTemplateCache(id);

        if (cachedTemplate) {
            console.log(`Cache hit for template: ${id}`);
            cacheHit = true;
            return NextResponse.json(cachedTemplate);
        }

        // If not in cache, fetch from DB
        console.log(`Cache miss for template: ${id}, fetching from database`);
        const template = await prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        // Cache the template for future requests
        if (!cacheHit) {
            setTemplateCache(id, template);
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        return NextResponse.json(
            { error: "Failed to fetch template" },
            { status: 500 }
        );
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

        // First check if the template exists with optimized field selection
        const template = await withConnectionRetry(async () => {
            return prisma.template.findUnique({
                where: { id },
                select: {
                    id: true,
                    imageUrl: true
                },
            });
        });

        if (!template) {
            const notFoundResponse = NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
            trackPerformance(notFoundResponse, requestPath, method, startTime, false, 'Template not found');
            return notFoundResponse;
        }

        // Check if template is being used by any quizzes
        const quizCount = await prisma.quiz.count({
            where: {
                templateId: id
            }
        });

        if (quizCount > 0) {
            const conflictResponse = NextResponse.json(
                { error: 'Cannot delete template that is being used by quizzes' },
                { status: 409 }
            );
            trackPerformance(conflictResponse, requestPath, method, startTime, false, 'Template in use');
            return conflictResponse;
        }

        // Delete the image file if it exists
        if (template.imageUrl) {
            try {
                const imagePath = pathModule.join(process.cwd(), 'public', template.imageUrl);
                await fs.unlink(imagePath);
                console.log('Successfully deleted image file:', imagePath);
            } catch (error) {
                // Log error but continue with template deletion
                console.error('Error deleting image file:', error);
            }
        }

        // Use a transaction to handle both operations with connection retries
        await withConnectionRetry(async () => {
            await prisma.$transaction(async (tx) => {
                // Delete the template
                await tx.template.delete({
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
        console.error('Error deleting template:', error);

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
                errorMessage = 'Template not found';
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

export async function PATCH(
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
        const validatedData = patchTemplateSchema.parse(body);

        // Use a transaction for updating to ensure atomicity
        const updatedTemplate = await withConnectionRetry(async () => {
            return prisma.template.update({
                where: { id },
                data: validatedData,
            });
        });

        // Invalidate cache
        const cacheKey = buildCacheKey(id);
        delete cache[cacheKey];

        const apiResponse = NextResponse.json(updatedTemplate);
        trackPerformance(apiResponse, requestPath, method, startTime);
        return apiResponse;
    } catch (error) {
        console.error('Error patching template:', error);

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
                errorMessage = 'Template not found';
                errorCode = 'NOT_FOUND';
            } else {
                statusCode = 400;
                errorMessage = 'Database operation failed';
                errorCode = error.code;
            }
        } else if (error instanceof z.ZodError) {
            statusCode = 400;
            errorMessage = error.errors.map(e => e.message).join(', ');
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