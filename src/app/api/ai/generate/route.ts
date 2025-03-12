import { NextResponse } from "next/server";
import { z } from "zod";
import { QuizGenerationService } from "@/services/api/quiz/QuizGenerationService";

const generateRequestSchema = z.object({
  field: z.string(),
  context: z.string(),
  templateType: z.string(),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl']).default('en'),
  wordOnly: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    let parsedBody;
    try {
      const body = await request.json();
      parsedBody = generateRequestSchema.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Get quiz generation service instance
    const quizGenerationService = QuizGenerationService.getInstance();

    // Generate quiz content
    const result = await quizGenerationService.generateQuizContent(parsedBody);

    if (!result.success) {
        return NextResponse.json(
        { error: result.error?.message || 'Quiz generation failed' },
        { status: result.error?.code === 'VALIDATION_ERROR' ? 400 : 500 }
      );
    }

    // Return appropriate response format
    if (parsedBody.wordOnly && result.data?.answer) {
      return NextResponse.json({ answer: result.data.answer });
        }
        
        return NextResponse.json({
      content: result.data?.content,
      answer: result.data?.answer,
      theme: result.data?.theme
    });

  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 