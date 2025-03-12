import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseService } from '../base/ApiResponseService';

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
    // Maximum number of requests allowed in the window
    maxRequests: number;
    // Time window in seconds
    windowSizeInSeconds: number;
    // Whether to include the path in the rate limit key (path-specific limits)
    perPath: boolean;
}

/**
 * Default rate limit configurations for different endpoints
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
    default: {
        maxRequests: 100,
        windowSizeInSeconds: 60,
        perPath: false,
    },
    // More strict limits for generation endpoints
    generation: {
        maxRequests: 20,
        windowSizeInSeconds: 60,
        perPath: true,
    },
    // Very strict limits for high-resource operations
    'image-generation': {
        maxRequests: 10,
        windowSizeInSeconds: 60,
        perPath: true,
    }
};

/**
 * Service for rate limiting API requests
 * Helps prevent abuse and ensures fair usage of resources
 */
export class RateLimitingService {
    private static instance: RateLimitingService;
    private apiResponse: ApiResponseService;

    // In-memory store for rate limiting
    // In a production environment, this would be replaced with Redis or similar
    private requestStore: Map<string, { count: number, resetTime: number }> = new Map();

    private constructor() {
        this.apiResponse = ApiResponseService.getInstance();

        // Clean up expired entries periodically (every minute)
        setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
    }

    public static getInstance(): RateLimitingService {
        if (!RateLimitingService.instance) {
            RateLimitingService.instance = new RateLimitingService();
        }
        return RateLimitingService.instance;
    }

    /**
     * Check if a request is within rate limits
     * @param request The Next.js request
     * @param limitType The type of rate limit to apply
     * @returns NextResponse if limit exceeded, undefined if within limits
     */
    public async checkRateLimit(
        request: NextRequest,
        limitType: keyof typeof DEFAULT_RATE_LIMITS = 'default'
    ): Promise<NextResponse | undefined> {
        try {
            const clientIp = this.getClientIp(request);
            if (!clientIp) {
                console.warn('No client IP found for rate limiting');
                return undefined; // Can't rate limit without an IP
            }

            const config = DEFAULT_RATE_LIMITS[limitType] || DEFAULT_RATE_LIMITS.default;
            const path = config.perPath ? new URL(request.url).pathname : '';
            const key = `${clientIp}:${limitType}:${path}`;

            const now = Math.floor(Date.now() / 1000);
            let record = this.requestStore.get(key);

            // Initialize or reset if window expired
            if (!record || now > record.resetTime) {
                record = {
                    count: 0,
                    resetTime: now + config.windowSizeInSeconds
                };
            }

            // Increment and check
            record.count++;
            this.requestStore.set(key, record);

            // Calculate remaining and reset time
            const remaining = Math.max(0, config.maxRequests - record.count);
            const resetInSeconds = record.resetTime - now;

            // Set headers regardless of limit status
            const headers = new Headers();
            headers.set('X-RateLimit-Limit', config.maxRequests.toString());
            headers.set('X-RateLimit-Remaining', remaining.toString());
            headers.set('X-RateLimit-Reset', resetInSeconds.toString());

            // Check if limit exceeded
            if (record.count > config.maxRequests) {
                // Convert Headers to Record<string, string>
                const headerRecord: Record<string, string> = {};
                headers.forEach((value, key) => {
                    headerRecord[key] = value;
                });

                return this.apiResponse.tooManyRequests(
                    `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
                    headerRecord
                );
            }

            return undefined;
        } catch (error) {
            console.error('Rate limiting error:', error);
            return undefined; // Don't block requests if rate limiting fails
        }
    }

    /**
     * Extract client IP from request
     * Handles various headers that might contain the real IP behind proxies
     */
    private getClientIp(request: NextRequest): string | undefined {
        // Try various headers that might contain the client IP
        return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            // In some Next.js deployments like Vercel, request.ip is not available
            // So use other headers or a default for local development
            (process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1');
    }

    /**
     * Clean up expired rate limit entries to prevent memory leaks
     */
    private cleanupExpiredEntries(): void {
        const now = Math.floor(Date.now() / 1000);

        for (const [key, record] of this.requestStore.entries()) {
            if (now > record.resetTime) {
                this.requestStore.delete(key);
            }
        }
    }

    /**
     * Reset the rate limiting store
     * Mainly used for testing
     */
    public resetStore(): void {
        this.requestStore.clear();
    }
} 