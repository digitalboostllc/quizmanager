import { QuizStatus, QuizType } from '@prisma/client';
import { z } from 'zod';

// Base quiz schema
const quizBaseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    description: z.string().optional(),
    variables: z.record(z.any()),
    answer: z.string().min(1, 'Answer is required'),
    solution: z.string().optional(),
    language: z.string().default('en'),
});

// Create quiz schema
export const createQuizSchema = quizBaseSchema.extend({
    templateId: z.string().min(1, 'Template ID is required'),
    quizType: z.nativeEnum(QuizType),
});

// Update quiz schema
export const updateQuizSchema = quizBaseSchema.partial().extend({
    templateId: z.string().min(1, 'Template ID is required').optional(),
    status: z.nativeEnum(QuizStatus).optional(),
});

// Search query schema
export const searchQuerySchema = z.object({
    query: z.string().optional(),
    type: z.nativeEnum(QuizType).optional(),
    status: z.nativeEnum(QuizStatus).optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

// Pagination params schema
export const paginationParamsSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

// Helper to validate request body
export async function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): Promise<T> {
    try {
        return await schema.parseAsync(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
        }
        throw error;
    }
}

// Helper to validate query parameters
export async function validateQueryParams<T>(schema: z.ZodSchema<T>, params: URLSearchParams): Promise<T> {
    try {
        const query = Object.fromEntries(params.entries());
        return await schema.parseAsync(query);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
        }
        throw error;
    }
} 