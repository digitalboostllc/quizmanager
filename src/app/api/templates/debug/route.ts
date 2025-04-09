import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Basic database connection test
        const dbTest = await prisma.$queryRaw`SELECT 1 as connected`;

        // Direct query to count templates
        const templateCount = await prisma.template.count();

        // Get a sample of templates if any exist
        const templates = templateCount > 0
            ? await prisma.template.findMany({
                take: 5,
                select: {
                    id: true,
                    name: true,
                    quizType: true,
                    createdAt: true,
                    updatedAt: true,
                    isPublic: true
                }
            })
            : [];

        // Return diagnostic info
        return NextResponse.json({
            databaseConnected: !!dbTest,
            templateCount,
            sampleTemplates: templates,
            prismaProvider: prisma._engineConfig?.activeProvider,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Database diagnostic error:", error);
        return NextResponse.json(
            {
                error: "Database connection error",
                message: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
} 