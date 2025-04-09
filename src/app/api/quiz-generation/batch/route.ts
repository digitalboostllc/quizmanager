import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SmartGeneratorAdapter } from "@/services/adapters/SmartGeneratorAdapter";
import { PostStatus } from "@prisma/client";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Define QuizGenerationOptions interface to match the SmartGeneratorAdapter
interface QuizGenerationOptions {
    count: number;
    difficulty: string;
    theme?: string;
    topic?: string;
    language: string;
    variety?: number;
    timeSlotDistribution?: Array<{
        date: string;
        slotId: string;
        weight: number;
    }>;
    scheduling?: {
        strategy: string;
        distribution: Array<{
            date: string;
            slotId: string;
            weight: number;
        }>;
    };
}

// Store batches in memory for development or in KV store for production
const batchStore = new Map();

// Define schema for validation with detailed error messages
const batchRequestSchema = z.object({
    templateIds: z.array(z.string()).min(1, "At least one template ID must be provided"),
    count: z.number().int().positive("Count must be a positive integer"),
    timeSlotDistribution: z.array(z.object({
        date: z.string(),
        slotId: z.string(),
        weight: z.number().positive()
    })).min(1, "At least one time slot distribution entry must be provided"),
    theme: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard", "progressive"]),
    variety: z.number().min(0).max(100),
    language: z.string()
});

export async function POST(request: Request) {
    console.log("🔍 API: quiz-generation/batch endpoint hit");

    try {
        // Get the current user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        const userId = session.user.id;

        // Parse request body
        const rawBody = await request.text();
        console.log("📥 API: Received raw request body:", rawBody);

        let body;
        try {
            body = JSON.parse(rawBody);
            console.log("📦 API: Parsed request body:", JSON.stringify(body, null, 2));
        } catch (err) {
            console.error("❌ API: Error parsing JSON:", err);
            return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
        }

        // Log received parameters
        console.log("🧩 API: Checking received parameters:");
        console.log(`- templateIds: ${body.templateIds ? `[${body.templateIds.join(', ')}]` : 'MISSING'}`);
        console.log(`- count: ${body.count !== undefined ? body.count : 'MISSING'}`);
        console.log(`- timeSlotDistribution: ${body.timeSlotDistribution ? `(${body.timeSlotDistribution.length} items)` : 'MISSING'}`);
        console.log(`- difficulty: ${body.difficulty || 'MISSING'}`);
        console.log(`- variety: ${body.variety !== undefined ? body.variety : 'MISSING'}`);
        console.log(`- language: ${body.language || 'MISSING'}`);
        console.log(`- theme: ${body.theme || 'N/A (optional)'}`);

        // Perform validation
        const validationResult = batchRequestSchema.safeParse(body);

        if (!validationResult.success) {
            const formattedErrors = validationResult.error.format();
            console.error("❌ API: Validation errors:", JSON.stringify(formattedErrors, null, 2));

            // Collect specific missing required fields
            const missingFields = [];
            if (!body.templateIds || !body.templateIds.length) missingFields.push("templateIds");
            if (body.count === undefined) missingFields.push("count");
            if (!body.timeSlotDistribution || !body.timeSlotDistribution.length) missingFields.push("timeSlotDistribution");

            return NextResponse.json({
                error: `Missing required parameters: ${missingFields.join(", ")}`,
                validationErrors: formattedErrors
            }, { status: 400 });
        }

        // If validation passed, proceed with the request
        console.log("✅ API: Validation successful, processing request");

        // Create a new QuizBatch record in the database
        const batch = await db.quizBatch.create({
            data: {
                id: uuidv4(),
                userId,
                templateIds: body.templateIds,
                count: body.count,
                theme: body.theme || null,
                difficulty: body.difficulty,
                variety: body.variety,
                language: body.language,
                timeSlotDistribution: body.timeSlotDistribution,
                status: "PROCESSING",
                currentStage: "preparing",
                updatedAt: new Date()
            }
        });

        console.log(`✅ API: Created QuizBatch with ID ${batch.id}`);

        // Start the generation process in the background (don't await)
        generateQuizzes(batch.id, body.templateIds, {
            count: body.count,
            difficulty: body.difficulty,
            theme: body.theme,
            topic: body.theme, // Use theme as topic for compatibility
            language: body.language,
            variety: body.variety,
            timeSlotDistribution: body.timeSlotDistribution,
            scheduling: {
                strategy: "DISTRIBUTE_EVENLY",
                distribution: body.timeSlotDistribution
            }
        }).catch((error: Error) => {
            console.error(`Error generating quizzes for batch ${batch.id}:`, error);
            // Update batch status to failed
            db.quizBatch.update({
                where: { id: batch.id },
                data: {
                    status: "FAILED",
                    currentStage: "complete",
                    errorMessage: error.message || "An unknown error occurred"
                }
            }).catch((updateError: Error) => {
                console.error(`Failed to update batch ${batch.id} status:`, updateError);
            });
        });

        // Return the batch ID
        return NextResponse.json({
            batchId: batch.id,
            message: "Batch generation started"
        });

    } catch (error) {
        console.error("❌ API: Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * Background process to generate quizzes using the SmartGeneratorAdapter
 */
async function generateQuizzes(
    batchId: string,
    templateIds: string[],
    options: QuizGenerationOptions
) {
    console.log(`🚀 API: Starting quiz generation for batch ${batchId}`);
    console.log(`📊 API: Using templates:`, templateIds);
    console.log(`⚙️ API: With options:`, JSON.stringify(options));

    try {
        // Update batch status to PROCESSING and set current stage
        await db.quizBatch.update({
            where: { id: batchId },
            data: {
                status: "PROCESSING",
                currentStage: "preparing",
            }
        });

        // Process each template
        let generatedCount = 0;
        const totalQuizzes = options.count;

        // Get the first template to start with
        const templateId = templateIds[0];
        await db.quizBatch.update({
            where: { id: batchId },
            data: { currentStage: "generating" }
        });

        // Use the SmartGeneratorAdapter for actual generation
        const adapter = new SmartGeneratorAdapter();

        // Configure the adapter with the proper options
        const generationResult = await adapter.generateQuizBatch({
            templateId,
            count: options.count,
            topic: options.topic,
            difficulty: options.difficulty || "MEDIUM",
            scheduling: options.scheduling
        });

        // Process the results and save to the database
        console.log(`✅ API: Generated ${generationResult.quizzes.length} quizzes`);

        // Update quizzes in the database - first save them without images
        const quizPromises = generationResult.quizzes.map(async (quizData, index) => {
            try {
                // Get template info first
                const template = await db.template.findUnique({
                    where: { id: templateId },
                    select: { quizType: true }
                });

                if (!template) {
                    throw new Error(`Template ${templateId} not found`);
                }

                // Create variations for each quiz to ensure uniqueness
                const variationSuffixes = [
                    'challenge', 'puzzle', 'brain teaser', 'riddle', 'mystery',
                    'problem', 'exercise', 'test', 'game', 'question'
                ];

                // Use index to create varied themes and add uniqueness markers
                const variedTheme = options.topic
                    ? `${options.topic} ${variationSuffixes[index % variationSuffixes.length]}`
                    : `Quiz ${index + 1}`;

                // Add slight variations to difficulty based on index
                const difficulties = ['easy', 'medium', 'hard'];
                let baseDifficulty = options.difficulty?.toLowerCase() || "medium";

                // For progressive difficulty, adjust based on position in the batch
                if (baseDifficulty === 'progressive') {
                    const difficultyIndex = Math.floor((index / options.count) * difficulties.length);
                    baseDifficulty = difficulties[Math.min(difficultyIndex, difficulties.length - 1)];
                }

                // Add uniqueness markers for the content generation
                const uniqueMarker = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;

                console.log(`🔄 API: Generating unique content for quiz ${index + 1} with theme: ${variedTheme}`);

                // Get the complete quiz content from the adapter to ensure we have all variables
                const quizContent = await adapter.generateQuizContent({
                    templateId,
                    templateType: template.quizType,
                    theme: variedTheme,
                    difficulty: baseDifficulty,
                    language: options.language || "en",
                    unique: uniqueMarker // Pass this to ensure unique generation
                });

                console.log(`✅ API: Generated content for quiz ${index + 1}: ${quizContent.title}`);
                console.log(`📝 API: Variables for quiz ${index + 1}:`, quizContent.variables);

                // Basic quiz data with required fields
                const quiz = await db.quiz.create({
                    data: {
                        id: uuidv4(),
                        title: quizData.title || quizContent.title,
                        answer: quizContent.answer || "Generated answer",
                        solution: quizContent.solution,
                        status: "DRAFT",
                        templateId: templateId, // Direct reference to template
                        batchId: batchId, // Direct reference to batch
                        language: options.language || "en",
                        updatedAt: new Date(),
                        // Store all quiz content in variables, including template-specific data
                        variables: {
                            description: quizData.description || quizContent.subtitle || "",
                            hint: quizContent.hint || "",
                            brandingText: quizContent.brandingText || "",
                            // Include template-specific variables needed for rendering
                            ...quizContent.variables,
                            // Also include questions for compatibility
                            questions: quizData.questions.map(q => ({
                                text: q.text,
                                type: q.type || "MULTIPLE_CHOICE",
                                options: q.options
                            }))
                        }
                    }
                });

                // If scheduling data exists, create a scheduled post
                if (quizData.scheduledAt) {
                    await db.scheduledPost.create({
                        data: {
                            id: uuidv4(),
                            quizId: quiz.id,
                            scheduledAt: new Date(quizData.scheduledAt),
                            status: "PENDING" as PostStatus,
                            updatedAt: new Date()
                        }
                    });
                }

                console.log(`✅ API: Saved quiz ${index + 1}/${quizData.title}`);
                return quiz;
            } catch (error) {
                console.error(`❌ API: Error saving quiz ${index + 1}:`, error);
                throw error;
            }
        });

        // Wait for all quizzes to be saved
        const savedQuizzes = await Promise.all(quizPromises);
        generatedCount = savedQuizzes.length;

        // Update the batch with completion information
        await db.quizBatch.update({
            where: { id: batchId },
            data: {
                completedCount: generatedCount,
                currentStage: "processing-images"
            }
        });

        console.log(`🖼️ API: Beginning image generation for ${savedQuizzes.length} quizzes`);

        // Now process images for each quiz
        for (let i = 0; i < savedQuizzes.length; i++) {
            const quiz = savedQuizzes[i];

            try {
                console.log(`🖼️ API: Generating image for quiz ${i + 1}/${savedQuizzes.length}: ${quiz.title}`);
                const imageResult = await adapter.generateImageForQuiz({
                    quizId: quiz.id,
                    title: quiz.title,
                });

                if (imageResult.imageUrl) {
                    // Update the quiz with the image URL
                    await db.quiz.update({
                        where: { id: quiz.id },
                        data: { imageUrl: imageResult.imageUrl }
                    });
                    console.log(`✅ API: Saved image for quiz ${i + 1}: ${imageResult.imageUrl}`);
                } else {
                    console.warn(`⚠️ API: No image generated for quiz ${i + 1}`);
                }
            } catch (error) {
                console.error(`❌ API: Error generating image for quiz ${i + 1}:`, error);
                // Continue with the next quiz even if this one fails
            }

            // Add a delay between image generations to prevent overloading
            if (i < savedQuizzes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Wait a bit longer to ensure all images are processed and saved
        console.log('📸 API: Waiting for images to finish processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Fetch updated quiz data with images
        const updatedQuizzes = await db.quiz.findMany({
            where: {
                batchId: batchId
            },
            select: {
                id: true,
                title: true,
                imageUrl: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Log all image URLs for debugging
        console.log('📊 API: Final image status:');
        updatedQuizzes.forEach((quiz, index) => {
            console.log(`  - Quiz ${index + 1}: ${quiz.title}, imageUrl=${quiz.imageUrl || 'NO IMAGE'}`);
        });

        // Mark the batch as complete
        await db.quizBatch.update({
            where: { id: batchId },
            data: {
                status: "COMPLETE",
                currentStage: "complete",
                completedAt: new Date()
            }
        });

        console.log(`🎉 API: Quiz generation complete for batch ${batchId}`);

        return {
            success: true,
            message: `Successfully generated ${generatedCount} quizzes`,
            batchId
        };
    } catch (error) {
        console.error(`❌ API: Error in quiz generation:`, error);

        // Update batch status to ERROR
        await db.quizBatch.update({
            where: { id: batchId },
            data: {
                status: "FAILED",
                errorMessage: error instanceof Error ? error.message : "Unknown error during quiz generation"
            }
        });

        throw error;
    }
}

/**
 * Creates a scheduled date from a date string and time slot
 */
function createScheduledDate(dateStr: string, timeSlotId: string): Date {
    const date = new Date(dateStr);

    // Set time based on time slot ID
    switch (timeSlotId) {
        case 'morning':
            date.setHours(9, 0, 0, 0);
            break;
        case 'lunch':
            date.setHours(12, 0, 0, 0);
            break;
        case 'afternoon':
            date.setHours(15, 0, 0, 0);
            break;
        case 'evening':
            date.setHours(18, 0, 0, 0);
            break;
        case 'night':
            date.setHours(21, 0, 0, 0);
            break;
        default:
            // Default to noon
            date.setHours(12, 0, 0, 0);
    }

    return date;
}

async function simulateGenerationProcess(batchId: string) {
    // Get the batch data
    let batchData;
    if (process.env.VERCEL_ENV === "production" && kv) {
        const data = await kv.get(`batch:${batchId}`);
        batchData = data ? JSON.parse(data as string) : null;
    } else {
        batchData = batchStore.get(batchId);
    }

    if (!batchData) return;

    // Update status to processing
    batchData.status = "processing";
    batchData.stage = "generating";

    // Update the stored data
    if (process.env.VERCEL_ENV === "production" && kv) {
        await kv.set(`batch:${batchId}`, JSON.stringify(batchData), { ex: 86400 });
    } else {
        batchStore.set(batchId, batchData);
    }

    // Simulate the generation process
    const simulateGeneration = async () => {
        const totalQuizzes = batchData.totalCount;
        const templateIds = batchData.templateIds;
        const timeSlotDistribution = batchData.timeSlotDistribution;

        // Generate quizzes one by one with delays
        for (let i = 0; i < totalQuizzes; i++) {
            // Wait for a random time between 1-3 seconds to simulate generation
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

            // Get batch data again to ensure it's the latest
            let currentBatch;
            if (process.env.VERCEL_ENV === "production" && kv) {
                const data = await kv.get(`batch:${batchId}`);
                currentBatch = data ? JSON.parse(data as string) : null;
            } else {
                currentBatch = batchStore.get(batchId);
            }

            if (!currentBatch) return;

            // If the batch was cancelled, stop processing
            if (currentBatch.status === "cancelled") {
                return;
            }

            // Select a template for this quiz
            const templateIndex = i % templateIds.length;
            const templateId = templateIds[templateIndex];

            // Create a quiz based on the template and theme
            const timeSlot = timeSlotDistribution[i % timeSlotDistribution.length];
            const quiz = {
                id: uuidv4(),
                title: generateQuizTitle(templateId, batchData.theme, i + 1),
                type: getQuizType(templateId, templateIds),
                scheduledAt: generateScheduledDate(timeSlot.date, timeSlot.slotId),
                imageUrl: Math.random() > 0.7 ? `https://source.unsplash.com/random/600x400?quiz&sig=${i}` : undefined
            };

            // Update batch data
            currentBatch.completedCount = i + 1;
            currentBatch.currentTemplate = templateId;
            currentBatch.generatedQuizzes = [...currentBatch.generatedQuizzes, quiz];

            // Store updated batch data
            if (process.env.VERCEL_ENV === "production" && kv) {
                await kv.set(`batch:${batchId}`, JSON.stringify(currentBatch), { ex: 86400 });
            } else {
                batchStore.set(batchId, currentBatch);
            }
        }

        // Final stages - scheduling and processing images
        let finalBatch;
        if (process.env.VERCEL_ENV === "production" && kv) {
            const data = await kv.get(`batch:${batchId}`);
            finalBatch = data ? JSON.parse(data as string) : null;
        } else {
            finalBatch = batchStore.get(batchId);
        }

        if (!finalBatch) return;

        // Scheduling stage
        finalBatch.stage = "scheduling";
        if (process.env.VERCEL_ENV === "production" && kv) {
            await kv.set(`batch:${batchId}`, JSON.stringify(finalBatch), { ex: 86400 });
        } else {
            batchStore.set(batchId, finalBatch);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Image processing stage
        finalBatch.stage = "processing-images";
        if (process.env.VERCEL_ENV === "production" && kv) {
            await kv.set(`batch:${batchId}`, JSON.stringify(finalBatch), { ex: 86400 });
        } else {
            batchStore.set(batchId, finalBatch);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Complete
        finalBatch.stage = "complete";
        finalBatch.isComplete = true;
        finalBatch.status = "completed";

        if (process.env.VERCEL_ENV === "production" && kv) {
            await kv.set(`batch:${batchId}`, JSON.stringify(finalBatch), { ex: 86400 });
        } else {
            batchStore.set(batchId, finalBatch);
        }
    };

    // Start the simulation without awaiting it
    simulateGeneration().catch(error => {
        console.error(`Error simulating generation for batch ${batchId}:`, error);
    });
}

// Helper functions
function getQuizType(templateId: string, templateIds: string[]) {
    const quizTypes = ["CONCEPT_CONNECTION", "WORDLE", "NUMBER_SEQUENCE", "RHYME_TIME"];
    const index = templateIds.indexOf(templateId);
    return quizTypes[index % quizTypes.length];
}

function generateQuizTitle(templateName: string, theme: string | null, index: number) {
    const themeText = theme ? `${theme}` : templateName;
    const templates = [
        `${themeText} Challenge #${index}`,
        `${themeText} Quiz ${index}`,
        `${theme || templateName} #${index}`,
        `${theme || "Daily"} Quiz ${index}`
    ];
    return templates[index % templates.length];
}

function generateScheduledDate(dateStr: string, timeSlotId: string) {
    const date = new Date(dateStr);

    // Set the time based on the slot
    switch (timeSlotId) {
        case "morning":
            date.setHours(9, 0, 0);
            break;
        case "lunch":
            date.setHours(12, 0, 0);
            break;
        case "afternoon":
            date.setHours(15, 0, 0);
            break;
        case "evening":
            date.setHours(18, 0, 0);
            break;
        case "night":
            date.setHours(21, 0, 0);
            break;
        default:
            date.setHours(12, 0, 0);
    }

    return date.toISOString();
} 