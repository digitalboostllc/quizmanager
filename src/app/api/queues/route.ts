import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // This is a placeholder implementation
        // In a real app, you would get actual queue information
        return NextResponse.json({
            queues: [
                {
                    id: "quiz-generation",
                    name: "Quiz Generation Queue",
                    status: "operational",
                    jobCount: 0,
                },
                {
                    id: "notifications",
                    name: "Notification Queue",
                    status: "operational",
                    jobCount: 0,
                },
            ]
        });
    } catch (error) {
        console.error("Error fetching queues:", error);
        return NextResponse.json(
            { error: "Failed to fetch queues information" },
            { status: 500 }
        );
    }
} 