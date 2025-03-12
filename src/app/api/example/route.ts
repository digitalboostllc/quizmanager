import { ApiResponseService } from '@/services/api/base/ApiResponseService';
import { RateLimitingService } from '@/services/api/security/RateLimitingService';
import { RequestValidationService } from '@/services/api/validation/RequestValidationService';
import { ConfigurationService } from '@/services/config/ConfigurationService';
import { FeatureFlag, FeatureFlagService } from '@/services/config/FeatureFlagService';
import { LoggingService } from '@/services/logging/LoggingService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Initialize services
const apiResponse = ApiResponseService.getInstance();
const validation = RequestValidationService.getInstance();
const rateLimit = RateLimitingService.getInstance();
const logger = LoggingService.getInstance();
const config = ConfigurationService.getInstance();
const featureFlags = FeatureFlagService.getInstance();

// Request validation schema
const requestSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['basic', 'advanced']),
    options: z.array(z.string()).optional(),
});

type RequestData = z.infer<typeof requestSchema>;

/**
 * Example API endpoint that demonstrates the use of centralized services
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        logger.info('Example API called', 'api/example');

        // Check rate limit (use stricter limits for resource-intensive endpoints)
        const rateLimitResponse = await rateLimit.checkRateLimit(request, 'generation');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Validate request body against schema
        const validationResult = await validation.validateBody<RequestData>(request, requestSchema);
        if (!validationResult.success) {
            return validationResult.response;
        }

        // Extract validated data
        const { name, type, options } = validationResult.data;

        // Check feature flags for advanced features
        if (type === 'advanced' && !featureFlags.isEnabled(FeatureFlag.ENABLE_ADVANCED_TEMPLATES)) {
            return apiResponse.error('Advanced templates are not available at this time', {
                status: 403,
                code: 'FEATURE_DISABLED'
            });
        }

        // Log the request details
        logger.debug('Processing request', 'api/example', { name, type, options });

        // Process the request
        const result = await processRequest(name, type, options);

        // Return success response
        return apiResponse.success({
            id: result.id,
            name: result.name,
            processed: true,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        // Use centralized error handling
        return apiResponse.errorFromException(error, 'api/example');
    }
}

/**
 * Example function that processes the request
 * In a real application, this would contain business logic
 */
async function processRequest(
    name: string,
    type: string,
    options?: string[]
): Promise<{ id: string; name: string }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Example of config service usage
    const serviceUrl = config.getString('SERVICE_URL', 'https://api.example.com');

    // Simulate an API call or database operation
    logger.info(`Making request to ${serviceUrl}`, 'processRequest');

    // Return processed data
    return {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: name,
    };
} 