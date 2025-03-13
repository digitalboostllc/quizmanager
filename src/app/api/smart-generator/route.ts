import { authOptions } from "@/lib/auth/auth-options";
import { trackPerformance } from '@/lib/monitoring';
import { prisma } from "@/lib/prisma";
import { SmartGeneratorAdapter } from "@/services/adapters/SmartGeneratorAdapter";
import { ApiError } from '@/services/api/errors/ApiError';
import { ImageGenerationService } from "@/services/api/quiz/ImageGenerationService";
import { PostStatus, Prisma, QuizStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Cache implementation with dynamic TTL
const CACHE_TTL = {
    templates: 5 * 60 * 1000,  // 5 minutes for templates
    systemUser: 30 * 60 * 1000 // 30 minutes for system user
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

            console.warn(`Connection failure in smart generator API, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`, error.message);

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

// Schema for smart generator requests
const smartGenerateSchema = z.object({
    templates: z.array(z.string()),
    count: z.number().min(1).max(20),
    theme: z.string().optional(),
    startDate: z.string(), // ISO date string
    difficulty: z.enum(["easy", "medium", "hard", "progressive"]),
    variety: z.number().min(0).max(100),
    timeSlots: z.array(z.object({
        id: z.string(),
        multiplier: z.number().min(1).max(5)
    })),
    language: z.enum(["en", "es", "fr", "de", "it", "pt", "nl"]).default("en"),
});

// Define type for time slot with multiplier
interface TimeSlotWithMultiplier {
    id: string;
    multiplier: number;
}

// Helper to get random time within a time slot
function getRandomTimeInSlot(slot: string, date: Date): Date {
    const result = new Date(date);

    switch (slot) {
        case 'morning':
            result.setHours(8 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            break;
        case 'lunch':
            result.setHours(11 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            break;
        case 'afternoon':
            result.setHours(14 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            break;
        case 'evening':
            result.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            break;
        case 'night':
            result.setHours(20 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            break;
        default:
            result.setHours(12, 0);
    }

    return result;
}

// Generate a quiz title based on template and difficulty
function generateQuizTitle(templateName: string, difficulty: string, index: number, count: number): string {
    const templateType = templateName.split(' ')[0]; // Get first word of template name

    // For progression, add level indicators
    if (count > 1) {
        const progressionTerms = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
        const difficultyIndex = Math.min(Math.floor((index / count) * progressionTerms.length), progressionTerms.length - 1);
        return `${templateType} Quiz: ${progressionTerms[difficultyIndex]} Level`;
    }

    return `${templateType} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`;
}

// Helper to get or create system user with caching
async function getOrCreateSystemUser(): Promise<string> {
    const cacheKey = 'system_user';

    // Check cache first
    if (isCacheValid(cacheKey)) {
        return cache[cacheKey].data;
    }

    try {
        const systemUser = await withConnectionRetry(async () => {
            return prisma.user.findFirst({
                where: {
                    email: "system@fbquiz.local"
                }
            });
        });

        if (systemUser) {
            // Cache the result
            cache[cacheKey] = {
                data: systemUser.id,
                timestamp: Date.now(),
                ttl: CACHE_TTL.systemUser
            };
            return systemUser.id;
        }

        // Create a system user
        const newSystemUser = await withConnectionRetry(async () => {
            return prisma.user.create({
                data: {
                    email: "system@fbquiz.local",
                    name: "System User",
                    role: "ADMIN", // Using admin role to ensure access
                }
            });
        });

        // Cache the result
        cache[cacheKey] = {
            data: newSystemUser.id,
            timestamp: Date.now(),
            ttl: CACHE_TTL.systemUser
        };
        return newSystemUser.id;
    } catch (error) {
        console.error("Error getting/creating system user:", error);
        throw new ApiError("Failed to create system user for quiz generation", 500, "SYSTEM_USER_ERROR");
    }
}

// Interface for quiz details
interface QuizDetails {
    id: string;
    title: string;
    type: QuizType;
    difficulty: "easy" | "medium" | "hard" | "progressive";
    scheduledAt: string;
    timeSlot: string;
    imageUrl?: string;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const requestPath = req.nextUrl.pathname;
    const method = req.method || 'POST';

    try {
        // Verify OpenAI API key is set
        if (!process.env.OPENAI_API_KEY) {
            const errorResponse = NextResponse.json(
                { error: "OpenAI API key is not configured. Smart Generator requires an API key to function." },
                { status: 500 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, "OpenAI API key missing");
            return errorResponse;
        }

        // Create an instance of the adapter
        const smartGeneratorAdapter = new SmartGeneratorAdapter();

        const session = await getServerSession(authOptions);

        // Get user ID (either from session or system user)
        let userId: string;
        try {
            userId = session?.user?.id || await getOrCreateSystemUser();
        } catch (error) {
            const errorResponse = NextResponse.json(
                { error: "Failed to get or create user" },
                { status: 500 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, "User creation failed");
            return errorResponse;
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            const errorResponse = NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, "Invalid JSON");
            return errorResponse;
        }

        const validatedData = smartGenerateSchema.safeParse(body);

        if (!validatedData.success) {
            const errorResponse = NextResponse.json(
                { error: "Invalid request data", details: validatedData.error.format() },
                { status: 400 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, "Validation failed");
            return errorResponse;
        }

        const { templates, count, theme, startDate, difficulty, variety, timeSlots, language } = validatedData.data;

        // Check templates cache first
        const templatesCacheKey = buildCacheKey('templates', { ids: templates });
        let templateRecords;

        if (isCacheValid(templatesCacheKey)) {
            templateRecords = cache[templatesCacheKey].data;
        } else {
            try {
                templateRecords = await withConnectionRetry(async () => {
                    return prisma.template.findMany({
                        where: {
                            id: {
                                in: templates
                            }
                        }
                    });
                });

                // Cache the results
                cache[templatesCacheKey] = {
                    data: templateRecords,
                    timestamp: Date.now(),
                    ttl: CACHE_TTL.templates
                };
            } catch (e) {
                console.error("Database error while fetching templates", e);
                const errorResponse = NextResponse.json(
                    { error: "Failed to fetch templates from database" },
                    { status: 500 }
                );
                trackPerformance(errorResponse, requestPath, method, startTime, false, "Template fetch failed");
                return errorResponse;
            }
        }

        if (templateRecords.length !== templates.length) {
            const errorResponse = NextResponse.json(
                { error: "One or more templates not found" },
                { status: 404 }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, "Templates not found");
            return errorResponse;
        }

        // Create schedule for publishing
        const startDateTime = new Date(startDate);
        const createdQuizzes: any[] = [];
        const scheduledPosts: any[] = [];
        const generatedQuizDetails: QuizDetails[] = [];

        try {
            // Use transaction for batch operations
            await withConnectionRetry(async () => {
                return prisma.$transaction(async (tx) => {
                    for (let i = 0; i < count; i++) {
                        // Pick a template - if variety is low, use templates in sequence, if high use more randomness
                        const useRandomSelection = Math.random() * 100 < variety;
                        const templateIndex = useRandomSelection
                            ? Math.floor(Math.random() * templateRecords.length)
                            : i % templateRecords.length;

                        const selectedTemplate = templateRecords[templateIndex];

                        // Calculate difficulty based on progression or selected difficulty
                        let quizDifficulty = difficulty;
                        if (difficulty === "progressive") {
                            const difficulties = ["easy", "medium", "hard"] as const;
                            const progressIndex = Math.min(Math.floor((i / count) * difficulties.length), difficulties.length - 1);
                            quizDifficulty = difficulties[progressIndex];
                        }

                        // Generate quiz content using the adapter
                        let quizContent;
                        try {
                            let generationResult = await smartGeneratorAdapter.generateQuizContent({
                                templateType: selectedTemplate.quizType,
                                difficulty: quizDifficulty === "progressive" ? "medium" : quizDifficulty,
                                language: language,
                                templateId: selectedTemplate.id
                            });

                            // Enhanced logging for WORDLE quizzes
                            if (selectedTemplate.quizType === 'WORDLE') {
                                console.log(`📊 Generated WORDLE quiz content:`, {
                                    title: generationResult.title,
                                    answer: generationResult.answer,
                                    hasAnswer: !!generationResult.answer,
                                    hasVariables: !!generationResult.variables,
                                    variableKeys: generationResult.variables ? Object.keys(generationResult.variables) : [],
                                    hasWordGrid: generationResult.variables?.wordGrid ? true : false
                                });

                                // Fix missing wordGrid for WORDLE quizzes
                                if (generationResult.answer && (!generationResult.variables?.wordGrid)) {
                                    console.warn(`⚠️ WORDLE quiz is missing wordGrid. Fixing with answer: ${generationResult.answer}`);
                                    if (!generationResult.variables) {
                                        generationResult.variables = {};
                                    }
                                    generationResult.variables.wordGrid = generationResult.answer;
                                }
                            }

                            quizContent = {
                                title: generationResult.title,
                                answer: generationResult.answer,
                                solution: generationResult.solution,
                                variables: {
                                    ...generationResult.variables,
                                    subtitle: generationResult.subtitle,
                                    hint: generationResult.hint,
                                    brandingText: generationResult.brandingText
                                }
                            };
                        } catch (error) {
                            if (error instanceof Error &&
                                (error.message.includes('Country, region, or territory not supported') ||
                                    error.message.includes('unsupported_country_region_territory'))) {
                                throw new ApiError("OpenAI services are not available in your region", 403, "REGION_RESTRICTED");
                            }
                            throw error;
                        }

                        // Validate quiz content
                        if (!quizContent || typeof quizContent !== 'object') {
                            throw new ApiError("Quiz content is missing or invalid", 500, "INVALID_QUIZ_CONTENT");
                        }

                        if (!quizContent.title || !quizContent.answer || !quizContent.variables) {
                            throw new ApiError("Quiz content is missing required fields", 500, "MISSING_REQUIRED_FIELDS");
                        }

                        // Create the quiz
                        const title = quizContent?.title || generateQuizTitle(
                            selectedTemplate.name,
                            quizDifficulty,
                            i,
                            count
                        );

                        const quiz = await tx.quiz.create({
                            data: {
                                title: title,
                                answer: quizContent.answer,
                                solution: quizContent.solution,
                                variables: quizContent.variables as any,
                                templateId: selectedTemplate.id,
                                status: QuizStatus.SCHEDULED,
                                language: language,
                                userId: userId
                            }
                        });

                        createdQuizzes.push(quiz);

                        // Calculate scheduling
                        const totalSlotsPerDay = timeSlots.reduce((sum, slot) => sum + slot.multiplier, 0);
                        let expandedTimeSlots: TimeSlotWithMultiplier[] = [];
                        timeSlots.forEach(slot => {
                            for (let j = 0; j < slot.multiplier; j++) {
                                expandedTimeSlots.push(slot);
                            }
                        });

                        const scheduledDate = new Date(startDateTime);
                        scheduledDate.setDate(scheduledDate.getDate() + Math.floor(i / totalSlotsPerDay));
                        const timeSlot = expandedTimeSlots[i % expandedTimeSlots.length];
                        const scheduledDateTime = getRandomTimeInSlot(timeSlot.id, scheduledDate);

                        // Create scheduled post
                        const scheduledPost = await tx.scheduledPost.create({
                            data: {
                                quizId: quiz.id,
                                scheduledAt: scheduledDateTime,
                                status: PostStatus.PENDING
                            }
                        });

                        scheduledPosts.push(scheduledPost);

                        // Create quiz details for response
                        const quizDetails = {
                            id: quiz.id,
                            title: quiz.title,
                            type: selectedTemplate.quizType,
                            difficulty: quizDifficulty,
                            scheduledAt: scheduledDateTime.toISOString(),
                            timeSlot: timeSlot.id
                        };

                        // Generate image (outside transaction)
                        try {
                            console.log(`📸 Generating image for quiz ${quiz.id}...`);
                            const imageService = ImageGenerationService.getInstance();
                            const { imageUrl } = await imageService.generateQuizImage(quiz.id);
                            console.log(`✅ Image generated successfully: ${imageUrl}`);
                            (quizDetails as any).imageUrl = imageUrl;
                        } catch (imageError) {
                            console.error(`❌ Error generating image for quiz ${quiz.id}:`, imageError);
                        }

                        generatedQuizDetails.push(quizDetails);
                    }
                });
            });

            const apiResponse = NextResponse.json({
                success: true,
                message: `Successfully generated ${count} quizzes with AI and scheduled them`,
                quizzes: createdQuizzes.length,
                schedules: scheduledPosts.length,
                generatedQuizzes: generatedQuizDetails
            });
            trackPerformance(apiResponse, requestPath, method, startTime, false);
            return apiResponse;

        } catch (error) {
            console.error("Error during generation process:", error);

            let statusCode = 500;
            let errorMessage = "Generation process failed";
            let errorCode = "GENERATION_FAILED";

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
                    partialSuccess: createdQuizzes.length > 0 ? {
                        quizzes: createdQuizzes.length,
                        schedules: scheduledPosts.length,
                        generatedQuizzes: generatedQuizDetails
                    } : undefined
                },
                { status: statusCode }
            );
            trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
            return errorResponse;
        }
    } catch (error) {
        console.error("Smart generator error:", error);

        let statusCode = 500;
        let errorMessage = "Failed to process quiz generation request";
        let errorCode = "INTERNAL_SERVER_ERROR";

        if (error instanceof ApiError) {
            statusCode = error.statusCode;
            errorMessage = error.message;
            errorCode = error.code;
        }

        const errorResponse = NextResponse.json(
            {
                error: errorMessage,
                code: errorCode
            },
            { status: statusCode }
        );
        trackPerformance(errorResponse, requestPath, method, startTime, false, errorMessage);
        return errorResponse;
    }
} 