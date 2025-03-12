import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Language, LANGUAGES } from "@/lib/types";
import { QuizGenerationService } from "@/services/api/quiz/QuizGenerationService";
import { QuizType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const generateQuizSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  templateType: z.enum([
    QuizType.WORDLE,
    QuizType.NUMBER_SEQUENCE,
    QuizType.RHYME_TIME,
    QuizType.CONCEPT_CONNECTION
  ]),
  language: z.enum(Object.keys(LANGUAGES) as [Language, ...Language[]]).default('en' as Language),
  content: z.string().optional()
});

// Helper function to extract words from quiz content
function extractWordsFromQuiz(quizData: any): string[] {
  const words: string[] = [];

  // Extract answer word if it exists and is a single word
  if (quizData.answer && typeof quizData.answer === 'string') {
    // For wordle quizzes, the answer is usually a single word
    if (quizData.answer.trim().split(/\s+/).length === 1) {
      words.push(quizData.answer.trim().toUpperCase());
    }
  }

  // Extract words from variables if it exists
  if (quizData.variables) {
    // For WORDLE quizzes, check wordGrid
    if (quizData.variables.wordGrid) {
      // Extract 5-letter words from the grid
      const grid = quizData.variables.wordGrid.toString();
      const gridWords = grid.split('\n').map((line: string) => line.trim())
        .filter((line: string) => line.length === 5 && /^[A-Z]+$/.test(line));
      words.push(...gridWords);
    }

    // For all quiz types, check if there's a theme word
    if (quizData.variables.theme && typeof quizData.variables.theme === 'string') {
      const themeWord = quizData.variables.theme.toString().trim().toUpperCase();
      if (themeWord.length > 0 && themeWord.split(/\s+/).length === 1) {
        words.push(themeWord);
      }
    }
  }

  return [...new Set(words)]; // Remove duplicates
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = generateQuizSchema.parse(body);

    const quizService = QuizGenerationService.getInstance();
    const result = await quizService.generateCompleteQuiz({
      templateId: validatedData.templateId,
      quizType: validatedData.templateType,
      language: validatedData.language,
      content: validatedData.content
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to generate quiz content');
    }

    console.log('✨ Generation completed successfully');

    // If user is authenticated, mark words as used
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      try {
        const words = extractWordsFromQuiz(result.data);
        console.log(`Found ${words.length} words to mark as used:`, words);

        // Mark each word as used
        if (words.length > 0) {
          await Promise.all(words.map(async (word) => {
            await prisma.wordUsage.upsert({
              where: {
                userId_word_language: {
                  userId: session.user.id,
                  word,
                  language: validatedData.language,
                },
              },
              update: {
                isUsed: true,
                usedAt: new Date(),
              },
              create: {
                userId: session.user.id,
                word,
                language: validatedData.language,
                isUsed: true,
              },
            });
          }));
          console.log(`✅ Successfully marked ${words.length} words as used`);
        }
      } catch (error) {
        console.error('⚠️ Error marking words as used:', error);
        // Continue with the response even if marking words fails
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error("❌ Error in quiz generation:", error);

    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to generate complete quiz',
          details: error instanceof Error ? error.message : 'Failed to generate quiz content'
        }
      },
      { status: 500 }
    );
  }
} 