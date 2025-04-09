import { prisma } from "@/lib/prisma";
import { QuizType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // Check if any templates exist
        const templateCount = await prisma.template.count();

        if (templateCount > 0) {
            return NextResponse.json({
                success: false,
                message: "Templates already exist, skipping seed",
                count: templateCount
            });
        }

        // Find a user to associate with the template
        const user = await prisma.user.findFirst({
            where: { role: "ADMIN" }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "No admin user found to create template"
            }, { status: 400 });
        }

        // Create a sample template
        const template = await prisma.template.create({
            data: {
                name: "Sample Template",
                html: `<div class="quiz-container">
          <h1>{{title}}</h1>
          <h2>{{subtitle}}</h2>
          <div class="question">{{question}}</div>
          <div class="hint">{{hint}}</div>
        </div>`,
                css: `
          .quiz-container {
            padding: 20px;
            background-color: #f5f5f5;
            border-radius: 8px;
          }
          h1 { color: #333; }
          h2 { color: #666; }
          .question { margin: 20px 0; font-size: 18px; }
          .hint { font-style: italic; color: #888; }
        `,
                quizType: QuizType.CONCEPT_CONNECTION,
                variables: {
                    title: "Sample Quiz",
                    subtitle: "Test your knowledge",
                    question: "What is the connection between these concepts?",
                    hint: "Think about common traits"
                },
                userId: user.id,
                isPublic: true,
                description: "A sample template created by the seeder"
            }
        });

        return NextResponse.json({
            success: true,
            message: "Sample template created successfully",
            template: {
                id: template.id,
                name: template.name,
                quizType: template.quizType
            }
        });
    } catch (error) {
        console.error("Template seeding error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to seed template",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 