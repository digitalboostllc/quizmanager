import { AuthUserRole } from '@/lib/auth';
import { ApiResponseService } from '@/services/api/base/ApiResponseService';
import { RateLimitingService } from '@/services/api/security/RateLimitingService';
import { RequestValidationService } from '@/services/api/validation/RequestValidationService';
import { AuthenticationService } from '@/services/auth/AuthenticationService';
import { CachingService } from '@/services/cache/CachingService';
import { ConfigurationService } from '@/services/config/ConfigurationService';
import { FeatureFlag, FeatureFlagService } from '@/services/config/FeatureFlagService';
import { LoggingService } from '@/services/logging/LoggingService';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Initialize services
const apiResponse = ApiResponseService.getInstance();
const validation = RequestValidationService.getInstance();
const rateLimit = RateLimitingService.getInstance();
const logger = LoggingService.getInstance();
const config = ConfigurationService.getInstance();
const featureFlags = FeatureFlagService.getInstance();
const auth = AuthenticationService.getInstance();
const cache = CachingService.getInstance();

// Request validation schema
const requestSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    includeArchived: z.coerce.boolean().optional().default(false),
});

type RequestData = z.infer<typeof requestSchema>;

/**
 * Example API endpoint that demonstrates the use of all centralized services
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Logging
        logger.info('Example centralized API called', 'api/example-centralized');

        // 2. Rate limiting
        const rateLimitResponse = await rateLimit.checkRateLimit(request, 'default');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // 3. Authentication and authorization
        const authResult = await auth.authenticateAndAuthorize(request, AuthUserRole.USER);
        if (!authResult.success) {
            return authResult.response;
        }

        // 4. Request validation
        const url = new URL(request.url);
        const params = {
            query: url.searchParams.get('query') || '',
            limit: url.searchParams.get('limit') || '10',
            includeArchived: url.searchParams.get('includeArchived') || 'false',
        };

        const validationResult = await validation.validateParams<RequestData>(params, requestSchema);
        if (!validationResult.success) {
            return validationResult.response;
        }

        // 5. Feature flag checking
        if (!featureFlags.isEnabled(FeatureFlag.ENABLE_ADVANCED_TEMPLATES) &&
            validationResult.data.includeArchived) {
            return apiResponse.error('Including archived items is not available', {
                status: 403,
                code: 'FEATURE_DISABLED'
            });
        }

        // 6. Configuration
        const maxResults = config.getNumber('MAX_SEARCH_RESULTS', 100);
        const actualLimit = Math.min(validationResult.data.limit, maxResults);

        // 7. Caching
        const cacheKey = `search:${validationResult.data.query}:${actualLimit}:${validationResult.data.includeArchived}`;
        const userId = authResult.session?.userId;

        // Simulate database results
        const results = await cache.getOrSet(
            cacheKey,
            async () => {
                logger.debug('Cache miss, generating mock results', 'api/example-centralized');

                // Simulate database delay
                await new Promise(resolve => setTimeout(resolve, 100));

                // Generate mock results
                return Array.from({ length: Math.min(actualLimit, 5) }, (_, i) => ({
                    id: `item-${i + 1}`,
                    title: `Result ${i + 1} for "${validationResult.data.query}"`,
                    createdAt: new Date().toISOString(),
                    archived: i % 3 === 0, // Every third item is archived
                })).filter(item => validationResult.data.includeArchived || !item.archived);
            },
            { ttl: 300, namespace: `user:${userId}` }
        );

        // 9. API response
        return apiResponse.success({
            query: validationResult.data.query,
            limit: actualLimit,
            includeArchived: validationResult.data.includeArchived,
            count: results.length,
            results,
        });
    } catch (error) {
        // 10. Error handling
        return apiResponse.errorFromException(error, 'api/example-centralized');
    }
} 