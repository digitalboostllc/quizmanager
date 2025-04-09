import { decrypt } from "@/lib/crypto";
import { trackPerformance } from '@/lib/monitoring';
import { prisma } from "@/lib/prisma";
import { ApiError } from '@/services/api/errors/ApiError';
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Set runtime to Node.js since this file uses crypto module indirectly via decrypt
export const runtime = 'nodejs';

// Cache implementation with dynamic TTL
const CACHE_TTL = {
  settings: 5 * 60 * 1000,  // 5 minutes for settings
};

// Cache interface for type safety
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache object
const cache: Record<string, CacheEntry<any>> = {};

// Helper to build a cache key
function buildCacheKey(key: string, params?: Record<string, any>): string {
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

      console.warn(`Connection failure in Facebook test-db API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestPath = req.nextUrl.pathname;
  const method = req.method;

  try {
    // Check cache first
    const cacheKey = buildCacheKey('facebook_settings');
    if (isCacheValid(cacheKey)) {
      console.log('Cache hit for Facebook settings');
      const cachedResponse = NextResponse.json(cache[cacheKey].data);
      trackPerformance(cachedResponse, requestPath, method, startTime, true);
      return cachedResponse;
    }

    // Get the latest Facebook settings
    const settings = await withConnectionRetry(async () => {
      return prisma.facebookSettings.findFirst({
        orderBy: { createdAt: 'desc' }
      });
    });

    if (!settings || !settings.isConnected) {
      const errorResponse = NextResponse.json({
        error: "Facebook integration is not configured",
        code: "FACEBOOK_NOT_CONFIGURED",
        hasSettings: !!settings,
        isConnected: settings?.isConnected
      }, { status: 400 });
      trackPerformance(errorResponse, requestPath, method, startTime, false, "Facebook not configured");
      return errorResponse;
    }

    // Decrypt the page access token
    const pageAccessToken = decrypt(settings.pageAccessToken);

    // Test the token by getting basic page info
    try {
      const pageUrl = `https://graph.facebook.com/v18.0/${settings.pageId}?fields=name,id&access_token=${pageAccessToken}`;

      const pageResponse = await fetch(pageUrl, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 0 } // Disable caching for this request
      });

      if (!pageResponse.ok) {
        const error = await pageResponse.json();
        const errorResponse = NextResponse.json({
          error: error.error?.message || "Failed to fetch page data",
          code: "FACEBOOK_PAGE_ERROR",
          details: error.error
        }, { status: 400 });
        trackPerformance(errorResponse, requestPath, method, startTime, false, "Facebook page error");
        return errorResponse;
      }

      const pageData = await pageResponse.json();

      const result = {
        message: "Successfully connected to Facebook page",
        page: {
          id: pageData.id,
          name: pageData.name
        },
        settings: {
          isConnected: settings.isConnected,
          pageId: settings.pageId,
          pageName: settings.pageName
        }
      };

      // Cache the results
      cache[cacheKey] = {
        data: result,
        timestamp: Date.now(),
        ttl: CACHE_TTL.settings
      };

      const apiResponse = NextResponse.json(result);
      trackPerformance(apiResponse, requestPath, method, startTime, false);
      return apiResponse;

    } catch (error) {
      console.error('Error fetching Facebook page data:', error);
      const errorResponse = NextResponse.json(
        {
          error: 'Failed to fetch Facebook page data',
          code: 'FACEBOOK_API_ERROR',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 503 }
      );
      trackPerformance(errorResponse, requestPath, method, startTime, false, 'Facebook API error');
      return errorResponse;
    }
  } catch (error) {
    console.error("Error testing Facebook connection:", error);

    let statusCode = 500;
    let errorMessage = "Failed to test Facebook connection";
    let errorCode = "INTERNAL_SERVER_ERROR";

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = 503;
      errorMessage = "Database operation failed";
      errorCode = error.code;
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      statusCode = 503;
      errorMessage = "Database connection failed";
      errorCode = "DATABASE_CONNECTION_ERROR";
    } else if (isConnectionError(error)) {
      statusCode = 503;
      errorMessage = "Database connection issues, please try again later";
      errorCode = "CONNECTION_ERROR";
    }

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: statusCode }
    );
    trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
    return errorResponse;
  }
} 