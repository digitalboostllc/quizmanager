import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { QuizGenerationService } from "@/services/api/quiz/QuizGenerationService";
import { ContentType, QuizType } from "@prisma/client";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Create a string enum schema for language instead of using z.nativeEnum
const languageEnum = z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl']).default('en');

const generateQuizSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  templateType: z.enum([
    QuizType.WORDLE,
    QuizType.NUMBER_SEQUENCE,
    QuizType.RHYME_TIME,
    QuizType.CONCEPT_CONNECTION
  ]),
  language: languageEnum,
  content: z.string().optional(),
  checkOnly: z.boolean().optional().default(false),
  includeImage: z.boolean().optional().default(true)
});

// Helper function to extract content from quiz data based on quiz type
function extractContentFromQuiz(quizData: any, quizType: QuizType): {
  contentType: ContentType;
  value: string;
  format: string;
  metadata?: Record<string, any>;
}[] {
  const items: {
    contentType: ContentType;
    value: string;
    format: string;
    metadata?: Record<string, any>;
  }[] = [];

  // For concept connection quizzes, track the concept set
  if (quizType === "CONCEPT_CONNECTION" && quizData.variables?.conceptsGrid) {
    const concepts = quizData.variables.conceptsGrid
      .match(/<span class="concept-text">([^<]+)<\/span>/g)
      ?.map((match: string) => match.replace(/<[^>]+>/g, ""))
      .filter(Boolean) || [];

    if (concepts.length > 0) {
      items.push({
        contentType: ContentType.CONCEPT,
        value: `${quizData.variables.theme}:${concepts.join(",")}`,
        format: quizData.language || "en",
        metadata: {
          theme: quizData.variables.theme,
          concepts,
          usage: "CONCEPT_SET"
        }
      });
    }
  }

  // For word-based quizzes, track the answer word
  if (quizData.answer && typeof quizData.answer === "string") {
    const answer = quizData.answer.trim().toUpperCase();
    if (answer.split(/\s+/).length === 1) {
      items.push({
        contentType: ContentType.WORD,
        value: answer,
        format: quizData.language || "en",
      });
    }
  }

  // For sequence-based quizzes, track the sequence
  if (quizData.answer && typeof quizData.answer === "string") {
    items.push({
      contentType: ContentType.SEQUENCE,
      value: quizData.answer.trim(),
      format: "SEQUENCE",
    });
  }

  // For rhyme-based quizzes, track the rhyme pair
  if (quizData.answer && typeof quizData.answer === "string") {
    const answer = quizData.answer.trim().toUpperCase();
    const rhymeMatch = quizData.answer.match(/rhymes with (\w+)/i);
    if (rhymeMatch && rhymeMatch[1]) {
      const pair = [answer, rhymeMatch[1].toUpperCase()];
      items.push({
        contentType: ContentType.RHYME,
        value: pair.sort().join("_"), // Sort for consistency
        format: quizData.language || "en",
      });
    }
  }

  return items;
}

export async function POST(request: Request) {
  try {
    let body;
    // Handle empty or null body
    try {
      body = await request.json();
      if (!body) {
        return NextResponse.json({
          success: false,
          error: {
            message: "Request body is empty",
            code: "VALIDATION_ERROR"
          }
        }, { status: 400 });
      }
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json({
        success: false,
        error: {
          message: "Invalid JSON in request body",
          code: "VALIDATION_ERROR"
        }
      }, { status: 400 });
    }

    const validatedData = generateQuizSchema.parse(body);

    console.log('📊 Quiz generation request:', {
      templateId: validatedData.templateId,
      templateType: validatedData.templateType,
      language: validatedData.language,
      checkOnly: validatedData.checkOnly,
      includeImage: validatedData.includeImage
    });

    // Check if the template exists before proceeding
    const template = await prisma.template.findUnique({
      where: {
        id: validatedData.templateId,
      },
      select: {
        id: true,
        name: true,
        quizType: true,
        variables: true,
        html: true,
        css: true
      }
    });

    if (!template) {
      console.error(`❌ Template not found with ID: ${validatedData.templateId}`);
      return NextResponse.json({
        success: false,
        error: {
          message: `Template not found with ID: ${validatedData.templateId}`,
          code: "NOT_FOUND"
        }
      }, { status: 404 });
    }

    // Verify template quiz type matches the requested type
    if (template.quizType !== validatedData.templateType) {
      console.error(`❌ Template quiz type mismatch: ${template.quizType} vs ${validatedData.templateType}`);
      return NextResponse.json({
        success: false,
        error: {
          message: `Template quiz type mismatch: ${template.quizType} vs ${validatedData.templateType}`,
          code: "VALIDATION_ERROR"
        }
      }, { status: 400 });
    }

    console.log(`✅ Found template: ${template.name} (${template.id})`);

    const quizService = QuizGenerationService.getInstance();
    const result = await quizService.generateCompleteQuiz({
      templateId: validatedData.templateId,
      quizType: validatedData.templateType,
      language: validatedData.language,
      content: validatedData.content,
      options: {
        checkOnly: validatedData.checkOnly,
        includeImage: validatedData.includeImage
      }
    });

    if (!result.success || !result.data) {
      throw new Error('Failed to generate quiz content');
    }

    console.log('✨ Generation completed successfully');
    console.log('📊 Result data:', JSON.stringify(result.data));

    // If user is authenticated and this is NOT a checkOnly request, track content usage
    const session = await getServerSession(authOptions);
    if (session?.user?.id && !validatedData.checkOnly) {
      try {
        // Extract content based on quiz type
        const contentItems = extractContentFromQuiz(result.data, validatedData.templateType);
        console.log(`Found ${contentItems.length} content items to track:`, contentItems);

        // Track content usage in ContentUsage table
        if (contentItems.length > 0) {
          await Promise.all(contentItems.map(async (item) => {
            try {
              // Add to ContentUsage
              await prisma.contentUsage.upsert({
                where: {
                  userId_contentType_value_format: {
                    userId: session.user.id,
                    contentType: item.contentType as ContentType,
                    value: item.value,
                    format: item.format
                  }
                },
                update: {
                  isUsed: true,
                  usedAt: new Date(),
                  metadata: item.metadata || {}
                },
                create: {
                  id: crypto.randomUUID(),
                  userId: session.user.id,
                  contentType: item.contentType as ContentType,
                  value: item.value,
                  format: item.format,
                  isUsed: true,
                  metadata: item.metadata || {}
                }
              });
              console.log(`✅ Added ${item.contentType} '${item.value}' to ContentUsage`);
            } catch (contentUsageError) {
              console.error(`⚠️ Error updating ContentUsage for ${item.contentType}:`, contentUsageError);
              // Continue with other items
            }
          }));
          console.log(`✅ Successfully tracked ${contentItems.length} content items`);
        }
      } catch (error) {
        console.error('⚠️ Error tracking content usage:', error);
        // Continue with the response even if tracking content fails
      }
    } else if (validatedData.checkOnly) {
      console.log('🔍 checkOnly mode - skipping content usage tracking');
    }

    const quiz = await prisma.quiz.create({
      data: {
        id: crypto.randomUUID(),
        templateId: validatedData.templateId,
        variables: result.data.variables as any,
        language: validatedData.language,
        answer: result.data.answer || "",
        solution: result.data.solution || "",
        title: result.data.title || "Untitled Quiz",
        status: "DRAFT",
        updatedAt: new Date(),
        userId: session?.user?.id || null
      }
    });

    return NextResponse.json({
      success: true,
      data: result.data // Make sure to return the actual data
    });
  } catch (error) {
    console.error('❌ Error generating quiz:', error);

    // Return a more descriptive error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate quiz',
          details: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    );
  }
} 