import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { SmartGeneratorAdapter } from "@/services/adapters/SmartGeneratorAdapter";
import { ImageGenerationService } from "@/services/api/quiz/ImageGenerationService";
import { PostStatus, QuizStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

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

export async function POST(req: Request) {
    try {
        // Verify OpenAI API key is set
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured. Smart Generator requires an API key to function." },
                { status: 500 }
            );
        }

        // Create an instance of the adapter
        const smartGeneratorAdapter = new SmartGeneratorAdapter();

        const session = await getServerSession(authOptions);

        // Temporarily disable authentication requirement as requested
        // We'll add this back in the final authentication step
        /* 
        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        */

        // Get or create a system user for anonymous operations
        let userId: string;

        if (session?.user?.id) {
            // Use authenticated user if available
            userId = session.user.id;
        } else {
            // Check if a system user exists or create one
            try {
                const systemUser = await prisma.user.findFirst({
                    where: {
                        email: "system@fbquiz.local"
                    }
                });

                if (systemUser) {
                    userId = systemUser.id;
                } else {
                    // Create a system user
                    const newSystemUser = await prisma.user.create({
                        data: {
                            email: "system@fbquiz.local",
                            name: "System User",
                            role: "ADMIN", // Using admin role to ensure access
                        }
                    });
                    userId = newSystemUser.id;
                }
            } catch (error) {
                console.error("Error getting/creating system user:", error);
                return NextResponse.json(
                    { error: "Failed to create system user for quiz generation" },
                    { status: 500 }
                );
            }
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("Failed to parse request body", e);
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const validatedData = smartGenerateSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validatedData.error.format() },
                { status: 400 }
            );
        }

        const { templates, count, theme, startDate, difficulty, variety, timeSlots, language } = validatedData.data;

        // Verify that all templates exist
        let templateRecords;
        try {
            templateRecords = await prisma.template.findMany({
                where: {
                    id: {
                        in: templates
                    }
                }
            });
        } catch (e) {
            console.error("Database error while fetching templates", e);
            return NextResponse.json(
                { error: "Failed to fetch templates from database" },
                { status: 500 }
            );
        }

        if (templateRecords.length !== templates.length) {
            return NextResponse.json(
                { error: "One or more templates not found" },
                { status: 404 }
            );
        }

        // Create schedule for publishing
        const startDateTime = new Date(startDate);
        let currentDateTime = new Date(startDateTime);

        // Create quizzes and schedule them
        const createdQuizzes = [];
        const scheduledPosts = [];
        const generatedQuizDetails = [];

        try {
            // Use the pre-initialized service instead of getting it inside the loop
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
                    // Use the centralized generation system via the adapter
                    let generationResult;
                    try {
                        generationResult = await smartGeneratorAdapter.generateQuizContent({
                            templateType: selectedTemplate.quizType,
                            difficulty: quizDifficulty === "progressive" ? "medium" : quizDifficulty,
                            language: language,
                            templateId: selectedTemplate.id
                        });
                    } catch (error) {
                        console.error(`Error generating quiz content for template ${selectedTemplate.id}:`, error);

                        // Check if it's a region restriction error
                        if (error instanceof Error &&
                            (error.message.includes('Country, region, or territory not supported') ||
                                error.message.includes('unsupported_country_region_territory'))) {

                            return NextResponse.json(
                                {
                                    error: "OpenAI services are not available in your region. Please use a VPN or try a different location.",
                                    code: "REGION_RESTRICTED"
                                },
                                { status: 403 }
                            );
                        }

                        return NextResponse.json(
                            { error: `Error generating quiz content: ${error instanceof Error ? error.message : "Unknown error"}` },
                            { status: 500 }
                        );
                    }

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
                    } else {
                        console.log(`📊 Generated quiz content:`, {
                            title: generationResult.title,
                            hasVariables: !!generationResult.variables,
                            variableKeys: generationResult.variables ? Object.keys(generationResult.variables) : [],
                        });
                    }

                    // For WORDLE quizzes, ensure the answer from dictionary is reflected in the wordGrid
                    if (selectedTemplate.quizType === 'WORDLE' &&
                        generationResult.answer &&
                        (!generationResult.variables?.wordGrid)) {

                        console.warn(`⚠️ WORDLE quiz is missing wordGrid. Attempting to fix with answer: ${generationResult.answer}`);

                        // Ensure variables.wordGrid is present
                        if (!generationResult.variables) {
                            generationResult.variables = {};
                        }

                        if (!generationResult.variables.wordGrid) {
                            generationResult.variables.wordGrid = generationResult.answer;
                        }
                    }

                    // Convert the result format to match what the rest of the code expects
                    quizContent = {
                        title: generationResult.title,
                        answer: generationResult.answer,
                        solution: generationResult.solution,
                        variables: {
                            ...generationResult.variables,
                            // Add these explicitly to ensure they're available
                            subtitle: generationResult.subtitle,
                            hint: generationResult.hint,
                            brandingText: generationResult.brandingText
                        }
                    };
                } catch (error) {
                    console.error(`Error generating quiz content for template ${selectedTemplate.id}:`, error);
                    return NextResponse.json(
                        { error: `Error generating quiz content: ${error instanceof Error ? error.message : "Unknown error"}` },
                        { status: 500 }
                    );
                }

                // Create the quiz with AI-generated content
                let quiz;
                try {
                    // Validate that quizContent exists and has required properties
                    if (!quizContent || typeof quizContent !== 'object') {
                        throw new Error("Quiz content is missing or invalid");
                    }

                    // Ensure all required fields are present
                    if (!quizContent.title || !quizContent.answer || !quizContent.variables) {
                        throw new Error("Quiz content is missing required fields");
                    }

                    // Create the quiz with the generated content
                    // No need for additional variable merging since QuizGenerationService handles that
                    const title = quizContent?.title || generateQuizTitle(
                        selectedTemplate.name,
                        quizDifficulty,
                        i,
                        count
                    );

                    quiz = await prisma.quiz.create({
                        data: {
                            title: title,
                            answer: quizContent.answer,
                            solution: quizContent.solution,
                            variables: quizContent.variables as any, // Safely cast for Prisma
                            templateId: selectedTemplate.id,
                            status: QuizStatus.SCHEDULED,
                            language: language,
                            userId: userId
                        }
                    });
                } catch (error) {
                    console.error("Error creating quiz:", error);
                    return NextResponse.json(
                        { error: `Failed to create quiz: ${error instanceof Error ? error.message : "Database error"}` },
                        { status: 500 }
                    );
                }

                createdQuizzes.push(quiz);

                // Calculate total slots per day based on multipliers
                const totalSlotsPerDay = timeSlots.reduce((sum, slot) => sum + slot.multiplier, 0);

                // Expand time slots based on multipliers
                let expandedTimeSlots: TimeSlotWithMultiplier[] = [];
                timeSlots.forEach(slot => {
                    for (let j = 0; j < slot.multiplier; j++) {
                        expandedTimeSlots.push(slot);
                    }
                });

                // Calculate the scheduled date - add days based on index
                const scheduledDate = new Date(startDateTime);
                scheduledDate.setDate(scheduledDate.getDate() + Math.floor(i / totalSlotsPerDay));

                // Choose a time slot from expanded array (which includes multipliers)
                const timeSlot = expandedTimeSlots[i % expandedTimeSlots.length];
                const scheduledDateTime = getRandomTimeInSlot(timeSlot.id, scheduledDate);

                // Create scheduled post
                let scheduledPost;
                try {
                    scheduledPost = await prisma.scheduledPost.create({
                        data: {
                            quizId: quiz.id,
                            scheduledAt: scheduledDateTime,
                            status: PostStatus.PENDING
                        }
                    });
                } catch (error) {
                    console.error("Error scheduling post:", error);
                    // If scheduling fails, we'll still return the quizzes but with an error message
                    return NextResponse.json(
                        {
                            warning: `Created ${createdQuizzes.length} quizzes but failed to schedule them: ${error instanceof Error ? error.message : "Database error"}`,
                            quizzes: createdQuizzes.length,
                            schedules: scheduledPosts.length,
                            generatedQuizzes: generatedQuizDetails
                        },
                        { status: 207 } // 207 Multi-Status
                    );
                }

                scheduledPosts.push(scheduledPost);

                // Create quiz details object for response
                const quizDetails: {
                    id: string;
                    title: string;
                    type: QuizType;
                    difficulty: "easy" | "medium" | "hard" | "progressive";
                    scheduledAt: string;
                    timeSlot: string;
                    imageUrl?: string;
                } = {
                    id: quiz.id,
                    title: quiz.title,
                    type: selectedTemplate.quizType,
                    difficulty: quizDifficulty,
                    scheduledAt: scheduledDateTime.toISOString(),
                    timeSlot: timeSlot.id
                };

                // Generate image for the quiz
                try {
                    console.log(`📸 Generating image for quiz ${quiz.id}...`);

                    // Use our centralized image generation service directly
                    const imageService = ImageGenerationService.getInstance();
                    const { imageUrl } = await imageService.generateQuizImage(quiz.id);

                    console.log(`✅ Image generated successfully: ${imageUrl}`);

                    // Add image URL to the quiz details
                    quizDetails.imageUrl = imageUrl;
                } catch (imageError) {
                    console.error(`❌ Error generating image for quiz ${quiz.id}:`, imageError);
                    // Continue with quiz creation even if image generation fails
                }

                // Add details to the response array
                generatedQuizDetails.push(quizDetails);
            }
        } catch (error) {
            console.error("Unexpected error during generation process:", error);
            return NextResponse.json(
                { error: `Generation process failed: ${error instanceof Error ? error.message : "Unknown error"}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${count} quizzes with AI and scheduled them`,
            quizzes: createdQuizzes.length,
            schedules: scheduledPosts.length,
            generatedQuizzes: generatedQuizDetails
        });
    } catch (error) {
        console.error("Smart generator error:", error);
        return NextResponse.json(
            { error: `Failed to process quiz generation request: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 }
        );
    }
} 