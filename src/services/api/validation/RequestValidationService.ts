import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponseService } from '../base/ApiResponseService';

/**
 * Centralized request validation service
 * Provides consistent validation across API endpoints
 */
export class RequestValidationService {
    private static instance: RequestValidationService;
    private apiResponse: ApiResponseService;

    private constructor() {
        this.apiResponse = ApiResponseService.getInstance();
    }

    public static getInstance(): RequestValidationService {
        if (!RequestValidationService.instance) {
            RequestValidationService.instance = new RequestValidationService();
        }
        return RequestValidationService.instance;
    }

    /**
     * Validate data against a Zod schema
     * @param data The data to validate
     * @param schema The Zod schema to validate against
     * @returns Validation result with parsed data or error response
     */
    public validateRequest<T>(
        data: any,
        schema: z.ZodType<any, any, any>
    ): { success: true; data: T } | { success: false; response: NextResponse } {
        try {
            const result = schema.parse(data);
            return { success: true, data: result as T };
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = this.formatZodErrors(error);
                return {
                    success: false,
                    response: this.apiResponse.error('Validation failed', {
                        status: 400,
                        code: 'VALIDATION_ERROR',
                        details: formattedErrors,
                    }),
                };
            }

            return {
                success: false,
                response: this.apiResponse.error('Invalid request data', {
                    status: 400,
                    code: 'INVALID_REQUEST',
                }),
            };
        }
    }

    /**
     * Format Zod validation errors into a more readable structure
     * @param error The Zod error
     * @returns Formatted error object
     */
    private formatZodErrors(error: z.ZodError): Record<string, string> {
        const errors: Record<string, string> = {};

        for (const issue of error.errors) {
            const path = issue.path.join('.');
            errors[path || 'value'] = issue.message;
        }

        return errors;
    }

    /**
     * Validate the JSON body of a request
     * @param request The Next.js request
     * @param schema The Zod schema to validate against
     * @returns Validation result with parsed data or error response
     */
    public async validateBody<T>(
        request: NextRequest,
        schema: z.ZodType<any, any, any>
    ): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
        try {
            const body = await request.json();
            return this.validateRequest<T>(body, schema);
        } catch (error) {
            return {
                success: false,
                response: this.apiResponse.error('Invalid JSON body', {
                    status: 400,
                    code: 'INVALID_JSON',
                }),
            };
        }
    }

    /**
     * Validate request parameters
     * @param params The parameters to validate
     * @param schema The Zod schema to validate against
     * @returns Validation result with parsed data or error response
     */
    public async validateParams<T>(
        params: Record<string, any>,
        schema: z.ZodType<any, any, any>
    ): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
        return Promise.resolve(this.validateRequest<T>(params, schema));
    }
} 