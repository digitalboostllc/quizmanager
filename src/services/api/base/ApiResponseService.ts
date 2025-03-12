import { NextResponse } from "next/server";
import { ErrorHandlingService } from "./ErrorHandlingService";

type ApiResponseOptions = {
    status?: number;
    headers?: Record<string, string>;
};

/**
 * Centralized service for consistent API responses
 * This service standardizes response formats across all API endpoints
 */
export class ApiResponseService {
    private static instance: ApiResponseService;
    private errorHandler: ErrorHandlingService;

    private constructor() {
        this.errorHandler = ErrorHandlingService.getInstance();
    }

    public static getInstance(): ApiResponseService {
        if (!ApiResponseService.instance) {
            ApiResponseService.instance = new ApiResponseService();
        }
        return ApiResponseService.instance;
    }

    /**
     * Create a success response
     * @param data The data to include in the response
     * @param options Optional response options
     * @returns NextResponse object
     */
    public success<T>(data: T, options: ApiResponseOptions = {}): NextResponse {
        const { status = 200, headers = {} } = options;

        return NextResponse.json({
            success: true,
            data
        }, {
            status,
            headers
        });
    }

    /**
     * Create an error response
     * @param message Error message
     * @param options Optional response options
     * @returns NextResponse object
     */
    public error(message: string, options: ApiResponseOptions & { code?: string; details?: unknown } = {}): NextResponse {
        const { status = 500, headers = {}, code, details } = options;

        return NextResponse.json({
            success: false,
            error: {
                message,
                code: code || 'ERROR',
                details
            }
        }, {
            status,
            headers
        });
    }

    /**
     * Create an error response from an Error object
     * @param error Error object
     * @param context Context information for logging
     * @param options Optional response options
     * @returns NextResponse object
     */
    public errorFromException(error: unknown, context: string, options: ApiResponseOptions = {}): NextResponse {
        // Log the error
        this.errorHandler.logError(error, context);

        // Get error message
        const message = this.errorHandler.getErrorMessage(error);

        // Determine if this is a specific type of error
        if (this.errorHandler.isNotFoundError(error)) {
            return this.notFound(message);
        }

        if (this.errorHandler.isAuthError(error)) {
            return this.unauthorized(message);
        }

        // Default to server error
        return this.error(message, options);
    }

    /**
     * Create a not found response
     * @param message Not found message
     * @returns NextResponse object
     */
    public notFound(message = 'Resource not found'): NextResponse {
        return this.error(message, { status: 404, code: 'NOT_FOUND' });
    }

    /**
     * Create an unauthorized response
     * @param message Unauthorized message
     * @returns NextResponse object
     */
    public unauthorized(message = 'Unauthorized'): NextResponse {
        return this.error(message, { status: 401, code: 'UNAUTHORIZED' });
    }

    /**
     * Create a bad request response
     * @param message Bad request message
     * @param details Additional error details
     * @returns NextResponse object
     */
    public badRequest(message = 'Bad request', details?: unknown): NextResponse {
        return this.error(message, { status: 400, code: 'BAD_REQUEST', details });
    }

    /**
     * Create a too many requests response
     * @param message The error message
     * @param headers Optional headers to include in the response
     * @returns NextResponse with a 429 status
     */
    public tooManyRequests(message: string = 'Too many requests', headers?: Record<string, string>): NextResponse {
        return this.error(message, { status: 429, headers });
    }
} 