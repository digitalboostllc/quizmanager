import { trackPerformance } from '@/lib/monitoring';
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/services/api/errors/ApiError";
import { Prisma, QuizType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

// Enhanced cache implementation with longer TTL for better performance
const CACHE_TTL = {
  default: 30 * 60 * 1000,    // 30 minutes for most queries
  search: 15 * 60 * 1000,     // 15 minutes for search results
  minimal: 5 * 60 * 1000      // 5 minutes for frequently changing data
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
  // Create a deterministic order of params
  const sortedParams = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `templates_${sortedParams || 'all'}`;
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

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  html: z.string().min(1, "HTML template is required"),
  css: z.string().optional(),
  quizType: z.enum(Object.values(QuizType) as [QuizType, ...QuizType[]]),
  variables: z.record(z.string(), z.any()).refine((data) => Object.keys(data).length > 0, {
    message: "At least one variable is required",
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await withConnectionRetry(() =>
      prisma.template.create({
        data: {
          name: validatedData.name,
          html: validatedData.html,
          css: validatedData.css,
          quizType: validatedData.quizType,
          variables: validatedData.variables,
        },
      })
    );

    // Invalidate templates cache when a new template is created
    Object.keys(cache).forEach(key => {
      if (key.startsWith('templates_')) {
        delete cache[key];
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestPath = new URL(request.url).pathname;
  const method = request.method;

  // Set response headers for caching
  const headers = {
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 minutes, stale for 1 hour
  };

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50
    const quizType = searchParams.get('type') as QuizType | null;
    const search = searchParams.get('search')?.trim() || '';
    const cursor = searchParams.get('cursor') || undefined;

    // Don't use cache for cursor-based pagination requests after the first page
    let cacheHit = false;
    if (!cursor) {
      const cacheKey = buildCacheKey(request.url, searchParams);
      if (isCacheValid(cacheKey)) {
        console.log(`Cache hit for ${cacheKey}`);
        const cachedResponse = NextResponse.json(cache[cacheKey].data, { headers });
        trackPerformance(cachedResponse, requestPath, method, startTime, true);
        return cachedResponse;
      }
    }

    // Build where conditions
    const where: Prisma.TemplateWhereInput = {};

    if (quizType) {
      where.quizType = quizType;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Optimize field selection (only select what's actually needed)
    const SELECT_FIELDS = {
      id: true,
      name: true,
      quizType: true,
      imageUrl: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          quizzes: true,
        },
      },
    };

    // Set up cursor for pagination
    const cursorObj = cursor ? { id: cursor } : undefined;

    // Fix the orderBy to use proper Prisma types
    const orderBy: Prisma.TemplateOrderByWithRelationInput[] = quizType
      ? [
        { quizType: 'asc' as Prisma.SortOrder },
        { createdAt: 'desc' as Prisma.SortOrder }
      ]
      : [{ createdAt: 'desc' as Prisma.SortOrder }];

    // Execute the query with connection retries
    const templates = await withConnectionRetry(async () => {
      return prisma.template.findMany({
        where,
        take: limit,
        ...(cursorObj && { cursor: { id: cursor }, skip: 1 }),
        orderBy,
        select: SELECT_FIELDS,
      });
    });

    // Get total count for first page only
    let total = undefined;
    if (!cursor) {
      total = await withConnectionRetry(() =>
        prisma.template.count({ where })
      );
    }

    // Determine if there are more items
    const lastItem = templates[templates.length - 1];
    const nextCursor = templates.length === limit ? lastItem?.id : undefined;
    const hasMore = templates.length === limit;

    // Format the response
    const response = {
      data: templates,
      pagination: {
        hasMore,
        nextCursor,
        limit,
        total
      },
    };

    // Cache the results (only first page)
    if (!cursor) {
      const cacheKey = buildCacheKey(request.url, searchParams);
      // Use appropriate TTL based on query type
      const ttl = search ? CACHE_TTL.search : CACHE_TTL.default;

      cache[cacheKey] = {
        data: response,
        timestamp: Date.now(),
        ttl
      };
    }

    const apiResponse = NextResponse.json(response, { headers });
    trackPerformance(apiResponse, requestPath, method, startTime, cacheHit);
    return apiResponse;

  } catch (error) {
    console.error("Error fetching templates:", error);

    let statusCode = 500;
    let errorMessage = "Failed to fetch templates";
    let errorCode = "INTERNAL_SERVER_ERROR";

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = 400;
      errorMessage = "Invalid query parameters";
      errorCode = error.code;
    } else if (isConnectionError(error)) {
      statusCode = 503;
      errorMessage = "Database connection issues";
      errorCode = "CONNECTION_ERROR";
    }

    const errorResponse = NextResponse.json(
      { error: errorMessage, code: errorCode },
      { status: statusCode, headers }
    );
    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 