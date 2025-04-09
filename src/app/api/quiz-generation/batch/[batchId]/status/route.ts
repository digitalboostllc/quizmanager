import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { batchId: string } }
) {
    // Await the params object to avoid "params should be awaited" warning
    const { batchId } = await params;

    console.log("🔍 API: Batch status endpoint hit for batch:", batchId);

    try {
        if (!batchId) {
            console.error("❌ API: Missing batchId in request");
            return NextResponse.json({ error: "Missing batchId parameter" }, { status: 400 });
        }

        // First, get the batch without quizzes
        const batch = await db.quizBatch.findUnique({
            where: { id: batchId }
        });

        if (!batch) {
            console.error(`❌ API: Batch ${batchId} not found`);
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        console.log(`✅ API: Found batch ${batchId} with status ${batch.status}`);

        // Now get quizzes separately with proper fields
        const quizzes = await db.quiz.findMany({
            where: {
                batchId: batchId
            },
            select: {
                id: true,
                title: true,
                status: true,
                imageUrl: true,
                createdAt: true,
                templateId: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Get scheduled posts for these quizzes in a separate query
        const scheduledPosts = await db.scheduledPost.findMany({
            where: {
                quizId: {
                    in: quizzes.map(quiz => quiz.id)
                }
            },
            select: {
                quizId: true,
                scheduledAt: true,
                status: true
            }
        });

        // Create a map for quick access to scheduled posts
        const scheduledPostMap = scheduledPosts.reduce((map, post) => {
            map[post.quizId] = post;
            return map;
        }, {} as Record<string, any>);

        console.log(`✅ API: Found ${quizzes.length} quizzes for batch ${batchId}`);

        // Get unique template IDs from the quizzes
        const templateIds = [...new Set(quizzes.map(quiz => quiz.templateId))];

        // Fetch the templates in a single query
        const templates = await db.template.findMany({
            where: {
                id: {
                    in: templateIds
                }
            },
            select: {
                id: true,
                quizType: true
            }
        });

        // Create a map for quick template lookup
        const templateMap = templates.reduce((map, template) => {
            map[template.id] = template;
            return map;
        }, {} as Record<string, any>);

        // Log all quizzes and their image URLs for debugging
        quizzes.forEach(quiz => {
            console.log(`  - Quiz ${quiz.id}: title=${quiz.title}, imageUrl=${quiz.imageUrl || 'NO IMAGE'}`);
        });

        // Format the quizzes for the response and add cache-busting parameter to image URLs
        const generatedQuizzes = quizzes.map(quiz => {
            // Find the scheduled post for this quiz
            const scheduledPost = scheduledPostMap[quiz.id];

            // Add timestamp as a cache-busting parameter to image URLs
            const imageUrl = quiz.imageUrl
                ? `${quiz.imageUrl}${quiz.imageUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
                : undefined;

            // Get the template from the map
            const template = templateMap[quiz.templateId];

            return {
                id: quiz.id,
                title: quiz.title,
                type: template?.quizType || "QUIZ",
                scheduledAt: scheduledPost?.scheduledAt?.toISOString() || new Date().toISOString(),
                imageUrl: imageUrl,
                createdAt: quiz.createdAt.toISOString()
            };
        });

        // Calculate completion metrics
        const quizzesWithImages = quizzes.filter(quiz => quiz.imageUrl).length;

        console.log(`✅ API: Quizzes with images: ${quizzesWithImages}/${quizzes.length}`);
        console.log(`✅ API: Batch completion: ${batch.completedCount}/${batch.count}`);

        // Return the batch status with additional image information
        return NextResponse.json({
            batchId: batch.id,
            isComplete: batch.status === "COMPLETE",
            completedCount: batch.completedCount,
            totalCount: batch.count,
            currentTemplate: batch.templateIds[0], // Just use the first template as current
            stage: batch.currentStage,
            generatedQuizzes,
            imagesCompleted: quizzesWithImages,
            errorMessage: batch.errorMessage || undefined
        });
    } catch (error) {
        console.error("❌ API: Server error in batch status endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 