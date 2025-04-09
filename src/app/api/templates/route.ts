import { prisma } from "@/lib/prisma";
import { Prisma, QuizType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
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

    // Get the current user from the session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const template = await withConnectionRetry(() =>
      prisma.template.create({
        data: {
          name: validatedData.name,
          html: validatedData.html,
          css: validatedData.css,
          quizType: validatedData.quizType,
          variables: validatedData.variables,
          userId: user.id, // Associate with the current user
          isPublic: false, // Default to private
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

export async function GET() {
  try {
    console.log('Fetching templates from database...');
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        quizType: true,
        imageUrl: true,
        previewImageUrl: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        isPublic: true,
      }
    });
    console.log('Found templates:', templates);
    console.log('Template count:', templates.length);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
} 