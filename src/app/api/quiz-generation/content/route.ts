import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Language, QuizType } from "@/lib/types";
import { SmartGeneratorAdapter } from "@/services/adapters/SmartGeneratorAdapter";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for content generation request
const contentRequestSchema = z.object({
    templateId: z.string().min(1, "Template ID is required"),
    language: z.string().min(2, "Language is required"),
    templateType: z.string().min(1, "Template type is required"),
    theme: z.string().optional(),
    difficulty: z.string().default("medium")
});

export async function POST(request: Request) {
    console.log("🔍 API: quiz-generation/content endpoint hit");

    try {
        // Get the current user
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

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

        // Validate the request
        const validationResult = contentRequestSchema.safeParse(body);
        if (!validationResult.success) {
            const formattedErrors = validationResult.error.format();
            console.error("❌ API: Validation errors:", JSON.stringify(formattedErrors, null, 2));
            return NextResponse.json({
                error: "Invalid parameters",
                validationErrors: formattedErrors
            }, { status: 400 });
        }

        // Get template info
        const template = await db.template.findUnique({
            where: { id: body.templateId }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Initialize adapter
        const adapter = new SmartGeneratorAdapter();

        // Generate content
        const result = await adapter.generateQuizContent({
            templateId: body.templateId,
            templateType: template.quizType as QuizType,
            language: body.language as Language,
            difficulty: body.difficulty,
            theme: body.theme,
            unique: `${Date.now()}-${Math.random().toString(36).substring(2)}`
        });

        console.log(`✅ API: Generated content for ${template.quizType} in ${body.language}`);

        // For Wordle quizzes, ensure we have a proper word based on language
        if (template.quizType === 'WORDLE') {
            console.log(`🔍 API: Checking Wordle word: ${result.answer}`);

            // If the answer doesn't look like a proper word or matches our placeholder
            if (!result.answer || result.answer.includes('LEVEL') || result.answer.includes('QUIZ')) {
                console.log('⚠️ API: Detected placeholder or invalid word, using fallback dictionary words');
                const wordLength = body.difficulty === 'easy' ? 4 : (body.difficulty === 'hard' ? 6 : 5);

                // Use fallback dictionary words instead of OpenAI
                const fallbackWords: Record<string, Record<string, string[]>> = {
                    'en': {
                        'easy': ['CAKE', 'GAME', 'TREE', 'BOOK', 'BLUE', 'FAST', 'NICE'],
                        'medium': ['GHOST', 'PLANT', 'MUSIC', 'BREAD', 'SMART', 'LIGHT', 'PHONE'],
                        'hard': ['PLANET', 'MIRROR', 'WINTER', 'GARDEN', 'COFFEE', 'SYSTEM', 'MONKEY']
                    },
                    'es': {
                        'easy': ['CASA', 'MESA', 'GATO', 'AZUL', 'VIDA', 'AMOR'],
                        'medium': ['PLAYA', 'LIBRO', 'COCHE', 'RELOJ', 'MUNDO', 'PAPEL'],
                        'hard': ['PUEBLO', 'AMARGO', 'FUTBOL', 'CAMINO', 'CIUDAD', 'TIEMPO']
                    },
                    'fr': {
                        'easy': ['CHAT', 'JOUR', 'MAIN', 'CAFÉ', 'BLEU', 'VENT'],
                        'medium': ['PLAGE', 'HEURE', 'ARBRE', 'MONDE', 'GRAND', 'PETIT'],
                        'hard': ['JARDIN', 'MAISON', 'CHEMIN', 'OISEAU', 'PAPIER', 'ÉTOILE']
                    },
                    'de': {
                        'easy': ['HAUS', 'BUCH', 'HAND', 'TIER', 'BLAU', 'BROT'],
                        'medium': ['MUSIK', 'SONNE', 'BAUM', 'WELT', 'GROSS', 'KLEIN'],
                        'hard': ['GARTEN', 'FENSTER', 'WASSER', 'HIMMEL', 'PAPIER', 'SCHULE']
                    },
                    'it': {
                        'easy': ['CASA', 'MARE', 'CANE', 'VITA', 'SOLE', 'ARTE'],
                        'medium': ['FESTA', 'TEMPO', 'LIBRO', 'CITTA', 'MONDO', 'CARTA'],
                        'hard': ['AMORE', 'CUCINA', 'STRADA', 'GIORNO', 'SCUOLA', 'ESTATE']
                    }
                };

                const language = (body.language as string) in fallbackWords ? (body.language as string) : 'en';
                const difficulty = ['easy', 'medium', 'hard'].includes(body.difficulty) ? body.difficulty : 'medium';
                
                // Get words of the correct difficulty
                const wordList = fallbackWords[language][difficulty];
                
                // Filter by length (if possible)
                const filteredWords = wordList.filter(word => word.length === wordLength);
                const finalWordList = filteredWords.length > 0 ? filteredWords : wordList;
                
                // Select a random word
                const randomWord = finalWordList[Math.floor(Math.random() * finalWordList.length)];
                console.log(`✅ API: Using fallback dictionary word: ${randomWord}`);
                result.answer = randomWord;
                
                // Update solution text if present
                if (result.solution) {
                    result.solution = result.solution.replace(/A MEDIUM LEVEL QUIZ|Wordle Quiz|Answer is:[^\.]+/i, `The answer is ${randomWord}`);
                }
            }
        }

        // Return the generated content
        return NextResponse.json(result);

    } catch (error) {
        console.error("❌ API: Server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 