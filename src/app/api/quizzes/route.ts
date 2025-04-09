import { trackPerformance } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { paginationParamsSchema, searchQuerySchema, validateQueryParams } from '@/lib/validations/api';
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma, QuizStatus, QuizType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";

// Enhanced cache implementation with dynamic TTL based on query complexity
const CACHE_TTL = {
  default: 5 * 60 * 1000, // 5 minutes for most queries
  search: 10 * 60 * 1000,  // 10 minutes for search results (less frequently changing)
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

// Connection pool management
let connectionFailures = 0;
const MAX_CONNECTION_FAILURES = 5;
const CONNECTION_BACKOFF_BASE = 250; // ms - reduced for faster retries

interface CreateQuizRequest {
  title: string;
  description?: string;
  quizType: QuizType;
  variables: Prisma.JsonValue;
  templateId: string;
  answer: string;
  solution?: string;
}

// Helper to build a cache key from request parameters
function buildCacheKey(url: string, params: URLSearchParams): string {
  // Create a deterministic order of params
  const sortedParams = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `quizzes_${sortedParams || 'all'}`;
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

      console.warn(`Connection failure in quizzes API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// Helper to extract content items from a quiz for tracking
function extractContentFromQuiz(quizData: any, quizType: QuizType): {
  contentType: string;
  value: string;
  format: string;
  metadata?: Record<string, any>;
}[] {
  const contentItems: {
    contentType: string;
    value: string;
    format: string;
    metadata?: Record<string, any>;
  }[] = [];

  // Handle different quiz types
  switch (quizType) {
    case QuizType.WORDLE:
      // Extract answer word if it exists and is a single word
      if (quizData.answer && typeof quizData.answer === 'string') {
        const answer = quizData.answer.trim().toUpperCase();
        if (answer.split(/\s+/).length === 1) {
          contentItems.push({
            contentType: 'WORD',
            value: answer,
            format: quizData.language || 'en', // Use the quiz language or default to English
            metadata: { usage: 'ANSWER' }
          });
        }
      }

      // Extract words from wordGrid for WORDLE quizzes
      if (quizData.variables?.wordGrid) {
        const grid = quizData.variables.wordGrid.toString();
        const gridWords = grid.split('\n').map((line: string) => line.trim())
          .filter((line: string) => line.length === 5 && /^[A-Z]+$/.test(line));

        gridWords.forEach((word: string) => {
          contentItems.push({
            contentType: 'WORD',
            value: word,
            format: quizData.language || 'en',
            metadata: { usage: 'GRID_WORD' }
          });
        });
      }
      break;

    case QuizType.NUMBER_SEQUENCE:
      // Extract number sequence if present
      if (quizData.answer && typeof quizData.answer === 'string') {
        contentItems.push({
          contentType: 'NUMBER_SEQUENCE',
          value: quizData.answer.trim(),
          format: 'SEQUENCE',
          metadata: { usage: 'ANSWER' }
        });
      }
      break;

    case QuizType.RHYME_TIME:
      // Extract rhyme pairs if present
      if (quizData.answer && typeof quizData.answer === 'string') {
        const answerText = quizData.answer.trim().toUpperCase();
        const rhymePairs = answerText.split(',').map((pair: string) => pair.trim());

        if (rhymePairs.length > 0) {
          contentItems.push({
            contentType: 'RHYME',
            value: rhymePairs.join(':'),
            format: quizData.language || 'en',
            metadata: { usage: 'RHYME_PAIRS', pairs: rhymePairs }
          });
        }
      }
      break;

    case QuizType.CONCEPT_CONNECTION:
      // Extract concept theme
      if (quizData.answer && typeof quizData.answer === 'string') {
        const theme = quizData.answer.trim().toUpperCase();
        // Try to extract concepts from variables or solution
        let concepts: string[] = [];

        if (quizData.variables?.conceptsGrid) {
          // Parse HTML to extract concepts
          const conceptsHtml = quizData.variables.conceptsGrid.toString();
          const conceptMatches = conceptsHtml.match(/<span class="concept-text">([^<]+)<\/span>/g);
          if (conceptMatches) {
            concepts = conceptMatches
              .map((match: string) => {
                const textMatch = match.match(/<span class="concept-text">([^<]+)<\/span>/);
                return textMatch ? textMatch[1].trim().toUpperCase() : null;
              })
              .filter(Boolean) as string[];
          }
        }

        if (concepts.length > 0) {
          contentItems.push({
            contentType: 'CONCEPT',
            value: `${theme}:${concepts.join(',')}`,
            format: quizData.language || 'en',
            metadata: {
              theme: theme,
              concepts: concepts,
              usage: 'CONCEPT_SET'
            }
          });
        }
      }
      break;

    default:
      // For other quiz types, still track words
      if (quizData.answer && typeof quizData.answer === 'string') {
        const answer = quizData.answer.trim().toUpperCase();
        if (answer.split(/\s+/).length === 1) {
          contentItems.push({
            contentType: 'WORD',
            value: answer,
            format: quizData.language || 'en',
            metadata: { usage: 'ANSWER' }
          });
        }
      }
  }

  return contentItems;
}

// Define the schema for quiz creation
const quizCreateSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.string(), z.any()),
  language: z.string(),
  answer: z.string().optional(),
  solution: z.string().optional(),
  title: z.string().optional(),
});

export async function GET(request: NextRequest) {
  console.log(`🔍 API: Quizzes GET request received at ${new Date().toISOString()}`);
  console.log(`🔍 API: URL: ${request.url}`);
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Set response headers for caching
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching for troubleshooting
  };

  try {
    const { searchParams } = new URL(request.url);
    console.log(`🔍 API: Query params: ${Array.from(searchParams.entries()).map(([k, v]) => `${k}=${v}`).join(', ')}`);

    // Validate query parameters
    const { limit, cursor } = await validateQueryParams(paginationParamsSchema, searchParams);
    const { query, type, status } = await validateQueryParams(searchQuerySchema, searchParams);
    console.log(`🔍 API: Validated params: limit=${limit}, cursor=${cursor}, query=${query}, type=${type}, status=${status}`);

    // Don't use cache for now (for debugging)
    let cacheHit = false;
    /* Disable cache during debugging
    if (!cursor) {
      const cacheKey = buildCacheKey(request.url, searchParams);
      if (isCacheValid(cacheKey)) {
        console.log(`Cache hit for ${cacheKey}`);
        const cachedResponse = NextResponse.json(cache[cacheKey].data, { headers });
        cacheHit = true;
        trackPerformance(cachedResponse, path, method, startTime, cacheHit);
        return cachedResponse;
      }
    }
    */

    // Build where conditions
    const where: Prisma.QuizWhereInput = {};

    if (query) {
      where.title = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.templateId = {
        // Match quizzes where templateId is in the list of templates with this quiz type
        in: await prisma.template.findMany({
          where: { quizType: type },
          select: { id: true }
        }).then(templates => templates.map(t => t.id))
      };
    }

    if (status) {
      where.status = status;
    }

    console.log(`🔍 API: Query conditions:`, JSON.stringify(where));

    // Optimize field selection (only select what's actually needed)
    const SELECT_FIELDS = {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      imageUrl: true,
      templateId: true,
      language: true,
      userId: true,
      batchId: true
    };

    // Set up cursor for pagination
    const cursorObj = cursor ? { id: cursor } : undefined;
    console.log(`🔍 API: Cursor object:`, cursorObj);

    console.log(`🔍 API: Testing Prisma connection before query...`);
    // Test connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`✅ API: Prisma connection is active`);
    } catch (connError) {
      console.error(`❌ API: Prisma connection test failed:`, connError);
      // Attempt reconnection
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        console.log(`✅ API: Prisma reconnection successful`);
      } catch (reconnectError) {
        console.error(`❌ API: Prisma reconnection failed:`, reconnectError);
        throw new Error('Database connection failed');
      }
    }

    console.log(`🔍 API: About to execute Prisma query...`);
    // Execute the query with connection retries
    const quizzes = await withConnectionRetry(async () => {
      const result = await prisma.quiz.findMany({
        where,
        take: limit,
        ...(cursorObj && { cursor: cursorObj, skip: 1 }), // Skip the cursor item
        orderBy: { createdAt: 'desc' },
        select: SELECT_FIELDS,
      });
      console.log(`🔍 API: Raw query result count: ${result.length}`);

      // Get unique template IDs from the quizzes
      const templateIds = [...new Set(result.map(quiz => quiz.templateId))];

      // Fetch all needed templates in a single query
      const templates = await prisma.template.findMany({
        where: {
          id: {
            in: templateIds
          }
        },
        select: {
          id: true,
          name: true,
          quizType: true,
        }
      });

      // Create a lookup map for quick template access
      const templateMap = templates.reduce((map, template) => {
        map[template.id] = template;
        return map;
      }, {} as Record<string, { id: string, name: string, quizType: string }>);

      // Combine quiz data with template data
      return result.map(quiz => ({
        ...quiz,
        template: templateMap[quiz.templateId] || null
      }));
    });
    console.log(`🔍 API: Query returned ${quizzes.length} quizzes`);

    // Determine if there are more items
    const lastItem = quizzes.length > 0 ? quizzes[quizzes.length - 1] : null;
    const nextCursor = lastItem?.id;
    const hasMore = quizzes.length === limit;
    console.log(`🔍 API: Pagination details: hasMore=${hasMore}, nextCursor=${nextCursor}`);

    // Format the response data
    const responseData = {
      data: quizzes,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };

    // Cache the results (only first page) - commented out for debugging
    /*
    if (!cursor) {
      const cacheKey = buildCacheKey(request.url, searchParams);
      // Use appropriate TTL based on query type
      const ttl = query ? CACHE_TTL.search : CACHE_TTL.default;

      cache[cacheKey] = {
        data: responseData,
        timestamp: Date.now(),
        ttl
      };
    }
    */

    console.log(`🔍 API: Sending response with ${quizzes.length} quizzes`);
    try {
      const apiResponse = NextResponse.json(responseData, { headers });
      trackPerformance(apiResponse, path, method, startTime, cacheHit);
      return apiResponse;
    } catch (err) {
      // If we have a problem creating the response, log it but don't fail
      console.error("Error creating response:", err);
      trackPerformance(null, path, method, startTime, cacheHit, "Error creating response");
      // Create a simple fallback response
      return NextResponse.json({
        data: [],
        pagination: { hasMore: false, nextCursor: null, limit }
      }, { status: 500 });
    }
  } catch (error) {
    console.error("🔴 Error in GET /quizzes:", error);

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
    } else if (error instanceof Error) {
      statusCode = 400;
      errorMessage = error.message;
      errorCode = 'VALIDATION_ERROR';
    }

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        data: [],
        pagination: { hasMore: false, nextCursor: null, limit: 20 }
      },
      { status: statusCode, headers }
    );

    trackPerformance(errorResponse, path, method, startTime, false, errorMessage);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = quizCreateSchema.parse(body);

    // Create the quiz in the database
    const quiz = await prisma.quiz.create({
      data: {
        id: crypto.randomUUID(),
        templateId: validatedData.templateId,
        variables: validatedData.variables,
        language: validatedData.language,
        answer: validatedData.answer || "",
        solution: validatedData.solution || "",
        title: validatedData.title || validatedData.variables.title || "Untitled Quiz",
        status: QuizStatus.DRAFT,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
} 