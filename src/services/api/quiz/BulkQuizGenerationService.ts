import { QuizType } from "@prisma/client";
import { ApiError } from "../errors/ApiError";
import { OpenAIService } from "../openai/OpenAIService";

interface GenerateContentParams {
    templateType: QuizType;
    theme: string;
    difficulty: "easy" | "medium" | "hard";
    language: string;
}

interface GenerationResult {
    title: string;
    answer: string;
    solution?: string;
    variables: Record<string, any>;
}

/**
 * @deprecated This service is deprecated and will be removed in a future release.
 * Please use SmartGeneratorAdapter with the centralized QuizGenerationService instead.
 * 
 * Service for generating multiple quizzes in bulk with AI
 */
export class BulkQuizGenerationService {
    private static instance: BulkQuizGenerationService;
    private openAIService: OpenAIService;

    private constructor() {
        console.warn('⚠️ BulkQuizGenerationService is deprecated. Please use SmartGeneratorAdapter with QuizGenerationService instead.');
        try {
            this.openAIService = OpenAIService.getInstance();
        } catch (error) {
            console.error("Failed to initialize OpenAIService:", error);
            throw new ApiError(
                "Failed to initialize OpenAI service. Please make sure your API key is set correctly.",
                500,
                "OPENAI_INIT_ERROR"
            );
        }
    }

    public static getInstance(): BulkQuizGenerationService {
        console.warn('⚠️ BulkQuizGenerationService.getInstance() is deprecated. Please use SmartGeneratorAdapter with QuizGenerationService instead.');
        if (!BulkQuizGenerationService.instance) {
            BulkQuizGenerationService.instance = new BulkQuizGenerationService();
        }
        return BulkQuizGenerationService.instance;
    }

    /**
     * Generate quiz content based on template type, theme, and difficulty
     */
    public async generateQuizContent(params: GenerateContentParams): Promise<GenerationResult> {
        const { templateType, theme, difficulty, language } = params;

        try {
            // Create an appropriate prompt based on the quiz type
            const prompt = this.createPromptForQuizType(templateType, theme, difficulty, language);

            // Call OpenAI to generate the quiz content
            const response = await this.openAIService.createChatCompletion(
                "You are a specialized quiz generator that creates high-quality, engaging quiz content.",
                prompt,
                {
                    temperature: 0.7
                }
            );

            // If the result is an error response
            if (response.error) {
                throw new ApiError('Failed to generate quiz content: ' + response.error, 500, 'GENERATION_ERROR');
            }

            if (!response.data) {
                throw new ApiError('No content generated from AI', 500, 'GENERATION_ERROR');
            }

            // Parse JSON response
            try {
                // Clean the response data to handle markdown code blocks
                let cleanedData = response.data;
                // Remove markdown code block syntax if present
                if (typeof cleanedData === 'string' && cleanedData.trim().startsWith('```')) {
                    // Extract just the JSON part from the markdown code block
                    cleanedData = cleanedData.replace(/^```(?:json)?\s*/, '');
                    cleanedData = cleanedData.replace(/\s*```\s*$/, '');
                }

                const result = JSON.parse(cleanedData) as GenerationResult;
                return this.validateAndFormatResult(result, templateType);
            } catch (error) {
                console.error('Error parsing AI response:', response.data);
                console.error('Parse error:', error);
                // Try to create a basic quiz if JSON parsing fails
                return {
                    title: `${theme} ${templateType.toLowerCase().replace('_', ' ')} quiz`,
                    answer: theme.substring(0, 5).toUpperCase().padEnd(5, 'X'),
                    solution: `This is a placeholder quiz about ${theme} since AI generation failed.`,
                    variables: {
                        description: `A quiz about ${theme}`,
                        theme: theme
                    }
                };
            }
        } catch (error) {
            console.error('Quiz generation error:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to generate quiz content: ' + (error instanceof Error ? error.message : 'Unknown error'), 500, 'GENERATION_ERROR');
        }
    }

    /**
     * Create type-specific prompts for the AI generator
     */
    private createPromptForQuizType(
        type: QuizType,
        theme: string,
        difficulty: string,
        language: string
    ): string {
        const difficultyGuidance = this.getDifficultyGuidance(difficulty);
        const languageGuidance = language === 'en' ? '' : `Generate the quiz in ${language} language.`;

        switch (type) {
            case 'WORDLE':
                return `
          Generate a Wordle-style quiz with the theme: "${theme}". ${difficultyGuidance} ${languageGuidance}
          
          The response should be in JSON format with the following fields:
          - title: A catchy title for the quiz
          - answer: A 5-letter word that fits the theme
          - solution: A brief explanation of the word and how it relates to the theme
          - variables: An object containing:
            - subtitle: A brief subtitle for the quiz
            - hint: A hint that helps guess the word without being too obvious
            - description: A brief description of the quiz
            - theme: The theme of the quiz
            - wordLength: Should be 5
            - maxAttempts: Number of attempts allowed (6 is standard)
            - correctHint: Text explaining that a letter is in the correct position (e.g., "Letter is in the word and in the correct position")
            - misplacedHint: Text explaining that a letter is in the wrong position (e.g., "Letter is in the word but in the wrong position")
            - wrongHint: Text explaining that a letter is not in the word (e.g., "Letter is not in the word")
            - brandingText: A short branding text for the footer (e.g., "Word puzzles by FB Quiz")
            
          Make sure the word is exactly 5 letters, common enough to be known by most people, and related to the theme.
        `;

            case 'NUMBER_SEQUENCE':
                return `
          Generate a Number Sequence quiz with the theme: "${theme}". ${difficultyGuidance} ${languageGuidance}
          
          The response should be in JSON format with the following fields:
          - title: A catchy title for the quiz
          - answer: The next number in the sequence (as a string)
          - solution: An explanation of the pattern in the sequence
          - variables: An object containing:
            - subtitle: A brief subtitle for the quiz
            - sequence: An array of numbers forming a logical sequence (at least 5 numbers)
            - hint: A subtle hint about the pattern
            - description: A brief description of the quiz
            - theme: The theme of the quiz
            - brandingText: A short branding text for the footer (e.g., "Number puzzles by FB Quiz")
            
          Make sure the sequence follows a clear logical pattern matching the difficulty level.
        `;

            case 'RHYME_TIME':
                return `
          Generate a Rhyme Time quiz with the theme: "${theme}". ${difficultyGuidance} ${languageGuidance}
          
          The response should be in JSON format with the following fields:
          - title: A catchy title for the quiz
          - answer: The word that rhymes with the clue and fits the definition
          - solution: An explanation of the rhyme and why the answer fits
          - variables: An object containing:
            - subtitle: A brief subtitle for the quiz
            - rhymeWord: The word to rhyme with
            - clue: A definition or description of the answer word
            - hint: A helpful hint for finding the answer
            - description: A brief description of the quiz
            - theme: The theme of the quiz
            - brandingText: A short branding text for the footer (e.g., "Rhyme puzzles by FB Quiz")
            - rhymeGrid: If you want to provide a custom HTML for the rhymes, otherwise we'll generate one
            
          Make sure the rhyming words have a clear and satisfying rhyme pattern.
        `;

            case 'CONCEPT_CONNECTION':
                return `
          Generate a Concept Connection quiz with the theme: "${theme}". ${difficultyGuidance} ${languageGuidance}
          
          The response should be in JSON format with the following fields:
          - title: A catchy title for the quiz
          - answer: The common concept that connects all the words
          - solution: An explanation of how each word relates to the common concept
          - variables: An object containing:
            - subtitle: A brief subtitle for the quiz
            - words: An array of 4 words that are all connected by a common concept
            - hint: A subtle hint about the connection
            - description: A brief description of the quiz
            - theme: The theme of the quiz
            - brandingText: A short branding text for the footer (e.g., "Connection puzzles by FB Quiz")
            - conceptsGrid: If you want to provide a custom HTML for the concepts, otherwise we'll generate one
            
          Make sure all words are clearly connected by the common concept but not too obviously.
        `;

            default:
                return `
          Generate a quiz with the theme: "${theme}". ${difficultyGuidance} ${languageGuidance}
          
          The response should be in JSON format with the following fields:
          - title: A catchy title for the quiz
          - answer: The correct answer
          - solution: An explanation of the answer
          - variables: An object containing all necessary data for the quiz
            - description: A brief description of the quiz
            - theme: The theme of the quiz
        `;
        }
    }

    /**
     * Get appropriate difficulty guidance text for the prompt
     */
    private getDifficultyGuidance(difficulty: string): string {
        switch (difficulty) {
            case 'easy':
                return 'Make the quiz easy enough for beginners, using common concepts and straightforward patterns.';
            case 'medium':
                return 'Create a moderately challenging quiz that requires some thinking but is solvable with reasonable effort.';
            case 'hard':
                return 'Design a challenging quiz that will require significant critical thinking and may include less common knowledge.';
            default:
                return 'Create a moderately challenging quiz.';
        }
    }

    /**
     * Validate and format the AI response based on quiz type
     */
    private validateAndFormatResult(result: GenerationResult, type: QuizType): GenerationResult {
        // Ensure variables object exists
        if (!result.variables) {
            result.variables = {};
        }

        // Common variables for all quiz types
        result.variables.subtitle = result.variables.subtitle || result.variables.description || 'Test your skills!';
        result.variables.brandingText = result.variables.brandingText || 'Powered by FB Quiz';

        // Ensure required properties exist and are properly formatted
        switch (type) {
            case 'WORDLE':
                // Ensure answer is a 5-letter word
                if (!result.answer || result.answer.length !== 5) {
                    result.answer = result.answer?.substring(0, 5).padEnd(5, 'x') || 'think';
                }
                result.answer = result.answer.toUpperCase();

                // Set default values if missing
                result.variables.wordLength = 5;
                result.variables.maxAttempts = 6;
                result.variables.hint = result.variables.hint || 'Think carefully!';
                result.variables.correctHint = result.variables.correctHint || 'Letter is in the word and in the correct position';
                result.variables.misplacedHint = result.variables.misplacedHint || 'Letter is in the word but in the wrong position';
                result.variables.wrongHint = result.variables.wrongHint || 'Letter is not in the word';
                break;

            case 'NUMBER_SEQUENCE':
                // Ensure sequence is an array of numbers
                if (!Array.isArray(result.variables.sequence)) {
                    result.variables.sequence = [1, 2, 3, 5, 8];
                }
                break;

            case 'RHYME_TIME':
                // Ensure rhyme word exists
                if (!result.variables.rhymeWord) {
                    result.variables.rhymeWord = 'cat';
                }
                break;

            case 'CONCEPT_CONNECTION':
                // Ensure words array exists
                if (!Array.isArray(result.variables.words)) {
                    result.variables.words = ['apple', 'banana', 'orange', 'grape'];
                }
                break;
        }

        // Ensure description exists
        result.variables.description = result.variables.description || `A ${type.toLowerCase().replace('_', ' ')} quiz`;

        return result;
    }

    public async verifyServiceAvailable(): Promise<boolean> {
        try {
            const response = await this.openAIService.createChatCompletion(
                "System test",
                "This is a test message to verify OpenAI connectivity.",
                { temperature: 0.1 }
            );

            return !response.error;
        } catch (error) {
            console.error("OpenAI service verification failed:", error);
            return false;
        }
    }
} 