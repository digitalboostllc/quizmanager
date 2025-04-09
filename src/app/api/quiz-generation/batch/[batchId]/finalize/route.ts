import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: { batchId: string } }
) {
    // Await the params object to avoid "params should be awaited" warning
    const { batchId } = await params;

    console.log("🔍 API: Batch finalize endpoint hit for batch:", batchId);

    try {
        if (!batchId) {
            console.error("❌ API: Missing batchId in finalize request");
            return NextResponse.json({ error: "Missing batchId parameter" }, { status: 400 });
        }

        // Get batch data from the database
        const batch = await db.quizBatch.findUnique({
            where: { id: batchId },
            include: {
                quizzes: true
            }
        });

        if (!batch) {
            console.error(`❌ API: Batch ${batchId} not found`);
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        // If the batch isn't already complete, update to complete
        if (batch.status !== "COMPLETE") {
            // Update the batch status
            await db.quizBatch.update({
                where: { id: batchId },
                data: {
                    status: "COMPLETE",
                    currentStage: "complete",
                    completedAt: new Date()
                }
            });

            // Update all quizzes to SCHEDULED status if they are in DRAFT
            await db.quiz.updateMany({
                where: {
                    batchId: batchId,
                    status: "DRAFT"
                },
                data: {
                    status: "SCHEDULED"
                }
            });

            console.log(`✅ API: Updated batch ${batchId} to COMPLETE`);
            console.log(`✅ API: Updated all quizzes in batch ${batchId} to SCHEDULED`);
        }

        console.log(`✅ API: Successfully finalized batch: ${batchId}`);

        // Return success response
        return NextResponse.json({
            batchId: batch.id,
            message: "Batch finalized successfully",
            status: "completed"
        });
    } catch (error) {
        console.error("❌ API: Server error in batch finalize endpoint:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 