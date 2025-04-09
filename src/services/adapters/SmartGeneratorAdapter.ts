import { LANGUAGE_CONFIG } from '@/lib/i18n';
import { Language } from '@/lib/types';
import { ImageGenerationService } from '@/services/api/quiz/ImageGenerationService';
import { CompleteQuizGenerationResult, QuizGenerationService } from '@/services/api/quiz/QuizGenerationService';
import { QuizType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Simple mock for the dictionary service functionality
class MockDictionaryService {
    private static instance: MockDictionaryService;
    private quizGenerationService = QuizGenerationService.getInstance();

    public static getInstance(): MockDictionaryService {
        if (!MockDictionaryService.instance) {
            MockDictionaryService.instance = new MockDictionaryService();
        }
        return MockDictionaryService.instance;
    }

    public async initialize(): Promise<void> {
        console.log('📚 Mock Dictionary Service initialized');
    }

    public async getRandomWord(language: Language, options: any): Promise<string> {
        try {
            // Generate a word using the quiz generation service
            const result = await this.quizGenerationService.generateQuizContent({
                field: 'word',
                context: `Generate a single word in ${LANGUAGE_CONFIG[language].name} that:
                - Is 4-7 letters long
                - Is a common word that native speakers know
                - No proper nouns or abbreviations
                - Must be appropriate for the language
                
                Rules:
                - Return ONLY the word in CAPITAL LETTERS
                - No explanations or additional text
                - Just the single word`,
                templateType: 'WORDLE',
                language: language,
                wordOnly: true
            });

            if (result.data?.content) {
                const word = result.data.content.trim().toUpperCase();
                console.log(`📚 Mock Dictionary: Generated "${word}" for ${language}`);
                return word;
            }

            throw new Error('Failed to generate word');
        } catch (error) {
            console.error('❌ Error generating word:', error);
            // Fallback to a simple word based on language
            const fallbackWords: Record<Language, string> = {
                en: 'QUIZ',
                fr: 'JEUX',
                es: 'JUEGO',
                de: 'WORT',
                it: 'GIOCO',
                pt: 'QUIZ',
                nl: 'QUIZ' // Default to QUIZ for Dutch
            };
            return fallbackWords[language] || 'QUIZ';
        }
    }

    public async markWordAsUsed(word: string, language: Language): Promise<void> {
        console.log(`📚 Mock Dictionary: Marked "${word}" as used in ${language}`);
    }
}

/**
 * Interface for quiz batch generation options
 */
export interface QuizBatchGenerationOptions {
    templateId: string;
    count: number;
    topic?: string;
    difficulty?: string;
    scheduling?: {
        strategy: string;
        distribution: Array<{
            date: string;
            slotId: string;
            weight: number;
        }>;
    };
}

/**
 * Interface for generated quiz with questions and options
 */
export interface GeneratedQuiz {
    title: string;
    description?: string;
    scheduledAt?: string;
    questions: Array<{
        text: string;
        type?: string;
        options: Array<{
            text: string;
            isCorrect: boolean;
        }>;
    }>;
}

/**
 * Adapter for connecting the Smart Generator to the centralized QuizGenerationService
 * This allows the Smart Generator to use the same generation logic as the regular quiz creator
 */
export class SmartGeneratorAdapter {
    private quizGenerationService = QuizGenerationService.getInstance();
    // Replace with the mock dictionary service
    private dictionaryService = MockDictionaryService.getInstance();
    private imageGenerationService = ImageGenerationService.getInstance();

    /**
     * Generates a batch of quizzes for the Smart Generator
     * @param options Options for generating the quiz batch
     * @returns Generated quizzes with scheduling information
     */
    async generateQuizBatch(options: QuizBatchGenerationOptions): Promise<{ quizzes: GeneratedQuiz[] }> {
        console.log('📊 SmartGeneratorAdapter: Generating quiz batch with options:', JSON.stringify(options));

        try {
            const { templateId, count, topic, difficulty = 'medium', scheduling } = options;

            // Initialize mock dictionary service
            try {
                await this.dictionaryService.initialize();
            } catch (error) {
                console.warn('⚠️ SmartGeneratorAdapter: Dictionary initialization failed. Continuing without dictionary support:', error);
            }

            // Generate multiple quizzes
            const quizzes: GeneratedQuiz[] = [];

            // Get template to determine quiz type
            const template = await this.getTemplate(templateId);
            if (!template) {
                throw new Error(`Template not found: ${templateId}`);
            }

            const quizType = template.quizType;

            // Generate quizzes
            for (let i = 0; i < count; i++) {
                console.log(`📝 SmartGeneratorAdapter: Generating quiz ${i + 1}/${count}`);

                try {
                    // Generate content based on quiz type and difficulty
                    const quizContent = await this.generateQuizContent({
                        templateId,
                        templateType: quizType,
                        theme: topic,
                        difficulty: difficulty.toLowerCase(),
                        language: 'en'
                    });

                    // Create quiz object with questions and options
                    const quiz: GeneratedQuiz = {
                        title: quizContent.title,
                        description: quizContent.subtitle || '',
                        questions: [
                            {
                                text: quizContent.title,
                                type: 'MULTIPLE_CHOICE',
                                options: [
                                    { text: quizContent.answer, isCorrect: true },
                                    // Generate some fake options for multiple choice
                                    { text: `Option ${i + 2}`, isCorrect: false },
                                    { text: `Option ${i + 3}`, isCorrect: false },
                                    { text: `Option ${i + 4}`, isCorrect: false }
                                ]
                            }
                        ]
                    };

                    // Add scheduling information if provided
                    if (scheduling && scheduling.distribution && scheduling.distribution.length > 0) {
                        const slotIndex = i % scheduling.distribution.length;
                        const slot = scheduling.distribution[slotIndex];

                        // Create scheduled date from slot data
                        quiz.scheduledAt = this.createScheduledDate(slot.date, slot.slotId);
                    }

                    quizzes.push(quiz);
                    console.log(`✅ SmartGeneratorAdapter: Generated quiz ${i + 1}/${count}: ${quiz.title}`);
                } catch (error) {
                    console.error(`❌ SmartGeneratorAdapter: Error generating quiz ${i + 1}/${count}:`, error);
                    // Create a fallback quiz if generation fails
                    const fallbackQuiz: GeneratedQuiz = {
                        title: `${this.getQuizTypeName(quizType)} Quiz ${i + 1}`,
                        description: `A ${difficulty} level quiz`,
                        questions: [
                            {
                                text: 'Fallback question',
                                type: 'MULTIPLE_CHOICE',
                                options: [
                                    { text: 'Correct Answer', isCorrect: true },
                                    { text: 'Wrong Answer 1', isCorrect: false },
                                    { text: 'Wrong Answer 2', isCorrect: false },
                                    { text: 'Wrong Answer 3', isCorrect: false }
                                ]
                            }
                        ]
                    };
                    quizzes.push(fallbackQuiz);
                }
            }

            console.log(`✅ SmartGeneratorAdapter: Generated ${quizzes.length} quizzes`);
            return { quizzes };
        } catch (error) {
            console.error('❌ SmartGeneratorAdapter: Error generating quiz batch:', error);
            throw error;
        }
    }

    /**
     * Generates an image for a quiz using the ImageGenerationService
     * @param params Parameters for image generation
     * @returns Object containing the image URL
     */
    async generateImageForQuiz(params: { quizId: string; title: string }): Promise<{ imageUrl: string }> {
        console.log('🖼️ SmartGeneratorAdapter: Generating image for quiz:', params.quizId);

        try {
            // Use the centralized image generation service
            const result = await this.imageGenerationService.generateQuizImage(params.quizId);

            console.log(`✅ SmartGeneratorAdapter: Generated image for quiz ${params.quizId}: ${result.imageUrl}`);
            return result;
        } catch (error) {
            console.error(`❌ SmartGeneratorAdapter: Error generating image for quiz ${params.quizId}:`, error);
            // Return a fallback image URL
            return { imageUrl: `/images/fallback-quiz-image.png` };
        }
    }

    /**
     * Creates a scheduled date string from date and time slot
     */
    private createScheduledDate(dateStr: string, timeSlotId: string): string {
        const date = new Date(dateStr);

        // Set default time based on time slot
        switch (timeSlotId) {
            case 'morning':
                date.setHours(9, 0, 0, 0);
                break;
            case 'lunch':
                date.setHours(12, 0, 0, 0);
                break;
            case 'afternoon':
                date.setHours(15, 0, 0, 0);
                break;
            case 'evening':
                date.setHours(18, 0, 0, 0);
                break;
            case 'night':
                date.setHours(21, 0, 0, 0);
                break;
            default:
                date.setHours(12, 0, 0, 0);
                break;
        }

        return date.toISOString();
    }

    /**
     * Gets a template by ID
     */
    private async getTemplate(templateId: string) {
        try {
            // Use the Prisma client to fetch the template
            const { db } = await import('@/lib/db');
            const template = await db.template.findUnique({
                where: { id: templateId }
            });

            return template;
        } catch (error) {
            console.error('❌ SmartGeneratorAdapter: Error fetching template:', error);
            return null;
        }
    }

    /**
     * Generates quiz content using the centralized quiz generation service
     */
    async generateQuizContent(params: {
        templateType: QuizType,
        theme?: string,
        difficulty: string,
        language: string,
        templateId: string,
        unique?: string // Optional unique marker to generate varied content
    }): Promise<CompleteQuizGenerationResult> {
        console.log('📊 SmartGeneratorAdapter: Generating quiz content with params:', {
            templateType: params.templateType,
            theme: params.theme,
            difficulty: params.difficulty,
            language: params.language,
            unique: params.unique ? 'provided' : 'not provided' // Log if unique marker was provided
        });

        try {
            // Initialize mock dictionary service
            try {
                await this.dictionaryService.initialize();
            } catch (dictionaryError) {
                console.warn('⚠️ SmartGeneratorAdapter: Dictionary initialization failed. Continuing without dictionary support:', dictionaryError);
            }

            // Generate content based on template type, difficulty, and theme
            let result: CompleteQuizGenerationResult;

            // Use the centralized quiz generation service to get base content
            // First we'll call the complete quiz generation to get all required fields
            const quizResponse = await this.quizGenerationService.generateCompleteQuiz({
                templateId: params.templateId,
                quizType: params.templateType,
                language: params.language as Language,
                content: params.theme || ''  // Don't use default text that can become the answer
            });

            if (!quizResponse.data) {
                throw new Error('Failed to generate quiz content');
            }

            // Use the API response data
            result = quizResponse.data;

            // Enhance the result with additional content and metadata
            result = this.enhanceResult(
                result,
                params.difficulty,
                params.templateType,
                params.unique
            );

            console.log(`✅ SmartGeneratorAdapter: Generated quiz content with theme: ${params.theme || 'none'}`);
            return result;
        } catch (error) {
            console.error('❌ SmartGeneratorAdapter: Error generating quiz content:', error);
            return this.createFallbackQuizResult(
                params.templateType,
                params.theme || 'General Knowledge',
                params.difficulty,
                params.language as Language
            );
        }
    }

    /**
     * Gets a word from AI generation or uses a fallback mechanism
     * @param language Language for the word
     * @param wordLength Approximate desired word length
     * @param difficulty Difficulty level
     */
    private async getWordFromDictionary(language: Language, wordLength: number, difficulty: string): Promise<string | null | undefined> {
        console.log(`Getting word from dictionary: ${language}, length: ${wordLength}, difficulty: ${difficulty}`);

        try {
            // Check if dictionary service is initialized
            if (!this.dictionaryService) {
                console.error("Dictionary service not initialized");
                return null;
            }

            // Get a random word from the dictionary
            const word = await this.dictionaryService.getRandomWord(language, {
                wordLength,
                difficulty
            });

            if (!word) {
                console.warn(`No word found for ${language}, length ${wordLength}, difficulty ${difficulty}`);
                return null;
            }

            // Mark this word as used to avoid duplicates
            await this.dictionaryService.markWordAsUsed(word, language);

            // Return the word in uppercase
            return word.toUpperCase();
        } catch (error) {
            console.error("Error getting word from dictionary:", error);
            return null;
        }
    }

    /**
     * Maps difficulty level to word difficulty
     */
    private mapDifficultyLevel(difficulty: string): 'easy' | 'medium' | 'hard' {
        switch (difficulty) {
            case 'easy':
                return 'easy';
            case 'medium':
                return 'medium';
            case 'hard':
                return 'hard';
            case 'progressive':
                return 'medium';
            default:
                return 'medium';
        }
    }

    /**
     * Determines word length based on difficulty
     */
    private getWordLengthBasedOnDifficulty(difficulty: string): number {
        switch (difficulty) {
            case 'easy':
                return 4; // Shorter words for easier puzzles
            case 'medium':
                return 5; // Standard WORDLE length
            case 'hard':
                return 6; // Longer words for harder puzzles
            case 'progressive':
                return 5; // Default to standard length
            default:
                return 5; // Default to standard length
        }
    }

    /**
     * Enhances the generation result to ensure all required fields are present
     */
    private enhanceResult(
        result: CompleteQuizGenerationResult,
        difficulty: string,
        quizType: QuizType,
        uniqueMarker?: string
    ): CompleteQuizGenerationResult {
        // Ensure variables object exists
        if (!result.variables) {
            result.variables = {};
        }

        // Get quiz type name for variations
        const quizTypeName = this.getQuizTypeName(quizType);

        // Calculate variation seed if uniqueMarker is provided
        const variationSeed = uniqueMarker ?
            this.calculateVariationSeed(uniqueMarker) :
            Math.floor(Math.random() * 1000);

        // Ensure subtitle is present with variation
        if (!result.subtitle || result.subtitle.trim() === '') {
            result.subtitle = `Test your ${difficulty} level ${quizTypeName} skills`;
        } else {
            // Remove any quotation marks from existing subtitles
            result.subtitle = result.subtitle.replace(/["']/g, '');
        }

        // Ensure branding text is present
        if (!result.brandingText || result.brandingText.trim() === '') {
            result.brandingText = `${quizTypeName} Quiz by FB Quiz`;
        }

        // Ensure hint is present with variation
        if (!result.hint || result.hint.trim() === '') {
            result.hint = "Look carefully at the pattern to solve this puzzle.";
        }

        // Ensure solution includes context
        if (!result.solution || result.solution.trim() === '') {
            result.solution = `This is a ${difficulty} level ${quizTypeName} quiz`;
        }

        return result;
    }

    private calculateVariationSeed(uniqueMarker: string): number {
        let hash = 0;
        for (let i = 0; i < uniqueMarker.length; i++) {
            const char = uniqueMarker.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private getQuizTypeName(quizType: QuizType): string {
        switch (quizType) {
            case QuizType.WORDLE:
                return 'Word Puzzle';
            case QuizType.NUMBER_SEQUENCE:
                return 'Number Sequence';
            case QuizType.RHYME_TIME:
                return 'Rhyme Time';
            case QuizType.CONCEPT_CONNECTION:
                return 'Concept Connection';
            default:
                return 'Quiz';
        }
    }

    /**
     * Creates enhanced content incorporating difficulty
     */
    private async createEnhancedContent(difficulty: string, quizType: QuizType = QuizType.WORDLE): Promise<string> {
        // Add difficulty context for better AI understanding
        let difficultyContext = '';

        switch (difficulty) {
            case 'easy':
                difficultyContext = 'simple and straightforward';
                break;
            case 'medium':
                difficultyContext = 'moderately challenging';
                break;
            case 'hard':
                difficultyContext = 'complex and difficult';
                break;
            case 'progressive':
                difficultyContext = 'gradually increasing in difficulty';
                break;
            default:
                difficultyContext = 'moderately challenging';
        }

        // Create quiz type specific content
        switch (quizType) {
            case QuizType.NUMBER_SEQUENCE:
                // For NUMBER_SEQUENCE quizzes, we generate actual numeric sequences
                const sequence = await this.generateNumberSequence(difficulty);
                return sequence.join(', ');

            case QuizType.RHYME_TIME:
                // For RHYME_TIME, generate rhyming word pairs and track usage
                const rhymePair = await this.generateRhymePairs(difficulty);
                return rhymePair.join(', ');

            case QuizType.CONCEPT_CONNECTION:
                // For CONCEPT_CONNECTION, generate concept sets and track usage
                const { concepts, theme } = await this.generateConceptSet(difficulty);
                // Return a string that includes both concepts and theme
                return `${concepts.join(', ')} - THEME: ${theme}`;

            case QuizType.WORDLE:
            default:
                // Create a general prompt that will help the AI generate appropriate content
                return `Create a ${difficultyContext} quiz. The quiz should be engaging for users.`;
        }
    }

    /**
     * Generates a numeric sequence based on difficulty
     * Also tracks sequence usage in ContentUsage
     */
    private async generateNumberSequence(difficulty: string): Promise<number[]> {
        // Define available sequences with their patterns
        const sequenceOptions = {
            easy: [
                { sequence: [2, 4, 6, 8, 10], pattern: '+2' },
                { sequence: [5, 10, 15, 20, 25], pattern: '+5' },
                { sequence: [1, 3, 5, 7, 9], pattern: '+2' }
            ],
            medium: [
                { sequence: [3, 6, 9, 12, 15], pattern: '+3' },
                { sequence: [1, 4, 9, 16, 25], pattern: 'squares' },
                { sequence: [2, 6, 12, 20, 30], pattern: 'increasing differences' }
            ],
            hard: [
                { sequence: [2, 4, 8, 16, 32], pattern: '×2' },
                { sequence: [3, 4, 7, 11, 18], pattern: 'Fibonacci-like' },
                { sequence: [1, 3, 6, 10, 15], pattern: 'triangular numbers' }
            ],
            default: [
                { sequence: [1, 2, 3, 4, 5], pattern: '+1' }
            ]
        };

        // Get the appropriate options based on difficulty
        const options = sequenceOptions[difficulty as keyof typeof sequenceOptions] || sequenceOptions.default;

        // Select a random sequence from the options
        const selectedOption = options[Math.floor(Math.random() * options.length)];
        const selectedSequence = selectedOption.sequence;
        const pattern = selectedOption.pattern;

        // Try to track this sequence in ContentUsage
        try {
            const { db } = await import('@/lib/db');
            const { auth } = await import('@/lib/auth');
            const session = await auth();

            if (session?.user?.id) {
                // Create a string representation of the sequence for storage
                const sequenceString = selectedSequence.join(',');

                // Add to ContentUsage
                await db.contentUsage.upsert({
                    where: {
                        userId_contentType_value_format: {
                            userId: session.user.id,
                            contentType: 'SEQUENCE',
                            value: sequenceString,
                            format: difficulty
                        }
                    },
                    update: {
                        isUsed: true,
                        usedAt: new Date(),
                        metadata: { pattern, nextNumber: selectedSequence[selectedSequence.length - 1] + parseInt(pattern.startsWith('+') ? pattern.substring(1) : '1') }
                    },
                    create: {
                        id: uuidv4(), // Add UUID for id field
                        userId: session.user.id,
                        contentType: 'SEQUENCE',
                        value: sequenceString,
                        format: difficulty,
                        isUsed: true,
                        metadata: { pattern, nextNumber: selectedSequence[selectedSequence.length - 1] + parseInt(pattern.startsWith('+') ? pattern.substring(1) : '1') }
                    }
                });

                console.log(`✅ SmartGeneratorAdapter: Added number sequence ${sequenceString} to ContentUsage`);
            }
        } catch (error) {
            console.error(`❌ SmartGeneratorAdapter: Error adding sequence to ContentUsage:`, error);
            // Don't fail sequence generation if tracking fails
        }

        return selectedSequence;
    }

    /**
     * Creates a fallback quiz result when the generation service fails
     */
    private async createFallbackQuizResult(
        quizType: QuizType,
        content: string,
        difficulty: string,
        language: Language
    ): Promise<CompleteQuizGenerationResult> {
        console.log("Creating fallback quiz result");

        // Basic result structure
        const result: CompleteQuizGenerationResult = {
            title: `${this.getQuizTypeName(quizType)} Quiz`,
            subtitle: `Test your ${difficulty} level ${this.getQuizTypeName(quizType)} skills`,
            hint: "Look carefully at the pattern to solve this puzzle.",
            brandingText: `${this.getQuizTypeName(quizType)} Quiz by FB Quiz`,
            answer: "",
            solution: `This is a ${difficulty} level ${this.getQuizTypeName(quizType)} quiz`,
            variables: {}
        };

        // Set specific properties based on quiz type
        switch (quizType) {
            case QuizType.WORDLE:
                // Initialization for WORDLE
                if (!result.variables) result.variables = {};

                // Get the word (either from parameter or dictionary)
                const word = content && content.trim().length > 0
                    ? content.toUpperCase()
                    : await this.getWordFromDictionary(language, this.getWordLengthBasedOnDifficulty(difficulty), difficulty);

                console.log('🔄 Creating WORDLE fallback result:', {
                    inputContent: content,
                    generatedWord: word,
                    language,
                    difficulty,
                    wordLength: word?.length
                });

                // Set up Wordle-specific variables
                result.title = `Word Puzzle`;
                result.subtitle = `Test your ${difficulty} level word skills`;
                result.hint = "Guess the hidden word. Each letter appears only once.";
                result.brandingText = "Word Puzzle by FB Quiz";
                result.answer = word || "PUZZLE";
                result.variables.wordGrid = this.generateBasicWordGrid(word);

                // Set metadata variables
                result.variables.quizType = "WORDLE";
                result.variables.language = language;
                result.variables.difficulty = difficulty;
                result.variables.title = result.title;
                result.variables.subtitle = result.subtitle;
                result.variables.hint = result.hint;
                result.variables.brandingText = result.brandingText;

                console.log('✅ Created WORDLE fallback result:', {
                    title: result.title,
                    answer: result.answer,
                    hasWordGrid: !!result.variables.wordGrid,
                    wordGridLength: result.variables.wordGrid?.length,
                    variables: Object.keys(result.variables)
                });
                break;

            case QuizType.NUMBER_SEQUENCE:
                // Basic sequence (fallback if content is empty)
                const sequence = content ? content.split(',').map(n => parseInt(n.trim())) : await this.generateNumberSequence(difficulty);
                const rule = this.getFallbackSequenceRule(difficulty);

                // Set up NUMBER_SEQUENCE specific variables
                result.title = `Number Sequence`;
                result.subtitle = `Find the pattern in this ${difficulty} number sequence`;
                result.hint = "Look for a mathematical pattern in the sequence.";
                result.brandingText = "Number Puzzle by FB Quiz";

                if (!result.variables) result.variables = {};
                result.variables.sequence = sequence.join(', ');
                result.answer = String(sequence[sequence.length - 1]);
                result.solution = `The pattern is: ${rule}`;

                // Set metadata variables
                result.variables.quizType = "NUMBER_SEQUENCE";
                result.variables.language = language;
                result.variables.difficulty = difficulty;
                result.variables.title = result.title;
                result.variables.subtitle = result.subtitle;
                result.variables.hint = result.hint;
                result.variables.brandingText = result.brandingText;
                break;

            case QuizType.RHYME_TIME:
                // Generate rhyme pairs or use content
                const rhymes = content ? content.split(',').map(word => word.trim()) : await this.generateRhymePairs(difficulty);

                // Set up RHYME_TIME specific variables
                result.title = `Rhyme Time`;
                result.subtitle = `Find words that rhyme in this ${difficulty} challenge`;
                result.hint = "Focus on the final sound of each word.";
                result.brandingText = "Rhyming Puzzle by FB Quiz";

                if (!result.variables) result.variables = {};
                result.variables.rhymes = rhymes;
                result.answer = rhymes[rhymes.length - 1];
                result.solution = `The words that rhyme are: ${rhymes.join(', ')}`;

                // Set metadata variables
                result.variables.quizType = "RHYME_TIME";
                result.variables.language = language;
                result.variables.difficulty = difficulty;
                result.variables.title = result.title;
                result.variables.subtitle = result.subtitle;
                result.variables.hint = result.hint;
                result.variables.brandingText = result.brandingText;
                break;

            case QuizType.CONCEPT_CONNECTION:
                // Generate concept set or use content
                const concepts = content ? content.split(',').map(concept => concept.trim()) :
                    (await this.generateConceptSet(difficulty, language)).concepts;

                // Set up CONCEPT_CONNECTION specific variables
                result.title = `Concept Connection`;
                result.subtitle = `Find what connects these concepts in this ${difficulty} puzzle`;
                result.hint = "Look for a common category or theme.";
                result.brandingText = "Concept Puzzle by FB Quiz";

                if (!result.variables) result.variables = {};
                result.variables.concepts = concepts;
                result.answer = "Common theme connecting these concepts";
                result.solution = `These concepts are all related to a common theme`;

                // Set metadata variables
                result.variables.quizType = "CONCEPT_CONNECTION";
                result.variables.language = language;
                result.variables.difficulty = difficulty;
                result.variables.title = result.title;
                result.variables.subtitle = result.subtitle;
                result.variables.hint = result.hint;
                result.variables.brandingText = result.brandingText;
                break;
        }

        return result;
    }

    /**
     * Generate a basic WORDLE grid for fallback content
     */
    private generateBasicWordGrid(word: string | null | undefined): string {
        console.log('🔄 Generating basic word grid:', {
            inputWord: word,
            wordLength: word?.length,
            hasWord: !!word
        });

        if (!word) {
            console.log('⚠️ No word provided, using fallback QUIZ grid');
            return `<div class="word-grid-container">
                <div class="word-attempt">
                    <div class="word-grid-row">
                        <div class="letter-box">Q</div>
                        <div class="letter-box">U</div>
                        <div class="letter-box">I</div>
                        <div class="letter-box">Z</div>
                    </div>
                </div>
            </div>`;
        }

        const gridHtml = `<div class="word-grid-container">
            <div class="word-attempt">
                <div class="word-grid-row">
                    ${word.split('').map(letter =>
            `<div class="letter-box">${letter}</div>`).join('')}
                </div>
            </div>
        </div>`;

        console.log('✅ Generated word grid:', {
            word,
            gridHtml,
            letterCount: word.length,
            gridStructure: {
                container: true,
                attempt: true,
                row: true,
                letterBoxes: word.length
            }
        });

        return gridHtml;
    }

    /**
     * Get a description of the sequence rule
     */
    private getFallbackSequenceRule(difficulty: string): string {
        switch (difficulty) {
            case 'easy':
                return "Add 2 to each number";
            case 'medium':
                return "Add 3 to each number";
            case 'hard':
                return "Multiply each number by 2";
            default:
                return "Add 1 to each number";
        }
    }

    /**
     * Generates rhyming word pairs for RHYME_TIME quizzes
     * Also tracks rhyme usage in ContentUsage
     * @param difficulty Difficulty level of the generated pairs
     * @returns Array containing a rhyming word pair
     */
    private async generateRhymePairs(difficulty: string): Promise<string[]> {
        // Define available rhyme pairs with their difficulty
        const rhymeOptions = {
            easy: [
                { pair: ['CAT', 'HAT'], pattern: 'short vowel' },
                { pair: ['DOG', 'FOG'], pattern: 'short vowel' },
                { pair: ['CAKE', 'LAKE'], pattern: 'long vowel' }
            ],
            medium: [
                { pair: ['FLIGHT', 'NIGHT'], pattern: 'consonant blend' },
                { pair: ['DREAM', 'STREAM'], pattern: 'consonant blend' },
                { pair: ['CHANCE', 'DANCE'], pattern: 'vowel-consonant' }
            ],
            hard: [
                { pair: ['SOUGHT', 'THOUGHT'], pattern: 'irregular spelling' },
                { pair: ['COUGH', 'ROUGH'], pattern: 'irregular spelling' },
                { pair: ['WEIGH', 'PREY'], pattern: 'diphthong' }
            ],
            default: [
                { pair: ['BLUE', 'TRUE'], pattern: 'long vowel' }
            ]
        };

        // Get the appropriate options based on difficulty
        const options = rhymeOptions[difficulty as keyof typeof rhymeOptions] || rhymeOptions.default;

        // Select a random pair from the options
        const selectedOption = options[Math.floor(Math.random() * options.length)];
        const selectedPair = selectedOption.pair;
        const pattern = selectedOption.pattern;

        // Try to track this rhyme pair in ContentUsage
        try {
            const { db } = await import('@/lib/db');
            const { auth } = await import('@/lib/auth');
            const session = await auth();

            if (session?.user?.id) {
                // Create a string representation of the rhyme pair for storage
                const rhymeString = selectedPair.join(':');

                // Add to ContentUsage
                await db.contentUsage.upsert({
                    where: {
                        userId_contentType_value_format: {
                            userId: session.user.id,
                            contentType: 'RHYME',
                            value: rhymeString,
                            format: difficulty
                        }
                    },
                    update: {
                        isUsed: true,
                        usedAt: new Date(),
                        metadata: {
                            pattern,
                            firstWord: selectedPair[0],
                            secondWord: selectedPair[1]
                        }
                    },
                    create: {
                        id: uuidv4(), // Add UUID for id field
                        userId: session.user.id,
                        contentType: 'RHYME',
                        value: rhymeString,
                        format: difficulty,
                        isUsed: true,
                        metadata: {
                            pattern,
                            firstWord: selectedPair[0],
                            secondWord: selectedPair[1]
                        }
                    }
                });

                console.log(`✅ SmartGeneratorAdapter: Added rhyme pair ${rhymeString} to ContentUsage`);
            }
        } catch (error) {
            console.error(`❌ SmartGeneratorAdapter: Error adding rhyme pair to ContentUsage:`, error);
            // Don't fail rhyme generation if tracking fails
        }

        return selectedPair;
    }

    /**
     * Generates concepts for CONCEPT_CONNECTION quizzes
     * Also tracks concept usage in ContentUsage
     * @param difficulty Difficulty level
     * @param language Language for the concepts
     * @returns Array of related concepts and their theme
     */
    private async generateConceptSet(difficulty: string, language: Language = 'en'): Promise<{ concepts: string[], theme: string }> {
        // Define available concept sets with their themes
        const conceptSets: Record<Language, Record<string, Array<{ concepts: string[], theme: string }>>> = {
            'en': {
                easy: [
                    { concepts: ['APPLE', 'BANANA', 'ORANGE', 'GRAPE'], theme: 'FRUITS' },
                    { concepts: ['DOG', 'CAT', 'BIRD', 'FISH'], theme: 'PETS' },
                    { concepts: ['RED', 'BLUE', 'GREEN', 'YELLOW'], theme: 'COLORS' }
                ],
                medium: [
                    { concepts: ['PARIS', 'ROME', 'LONDON', 'BERLIN'], theme: 'EUROPEAN CAPITALS' },
                    { concepts: ['TENNIS', 'GOLF', 'SOCCER', 'BASKETBALL'], theme: 'SPORTS' },
                    { concepts: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'], theme: 'SEASONS' }
                ],
                hard: [
                    { concepts: ['RUBY', 'EMERALD', 'SAPPHIRE', 'DIAMOND'], theme: 'GEMSTONES' },
                    { concepts: ['CALCIUM', 'IRON', 'POTASSIUM', 'ZINC'], theme: 'MINERALS' },
                    { concepts: ['MOZART', 'BEETHOVEN', 'BACH', 'CHOPIN'], theme: 'CLASSICAL COMPOSERS' }
                ]
            },
            'fr': {
                easy: [
                    { concepts: ['POMME', 'BANANE', 'ORANGE', 'RAISIN'], theme: 'FRUITS' },
                    { concepts: ['CHIEN', 'CHAT', 'OISEAU', 'POISSON'], theme: 'ANIMAUX' },
                    { concepts: ['ROUGE', 'BLEU', 'VERT', 'JAUNE'], theme: 'COULEURS' }
                ],
                medium: [
                    { concepts: ['PARIS', 'LYON', 'MARSEILLE', 'BORDEAUX'], theme: 'VILLES FRANÇAISES' },
                    { concepts: ['TENNIS', 'GOLF', 'FOOTBALL', 'BASKETBALL'], theme: 'SPORTS' },
                    { concepts: ['PRINTEMPS', 'ÉTÉ', 'AUTOMNE', 'HIVER'], theme: 'SAISONS' }
                ],
                hard: [
                    { concepts: ['RUBIS', 'ÉMERAUDE', 'SAPHIR', 'DIAMANT'], theme: 'PIERRES PRÉCIEUSES' },
                    { concepts: ['CALCIUM', 'FER', 'POTASSIUM', 'ZINC'], theme: 'MINÉRAUX' },
                    { concepts: ['MOZART', 'BEETHOVEN', 'BACH', 'CHOPIN'], theme: 'COMPOSITEURS CLASSIQUES' }
                ]
            },
            'es': {
                easy: [
                    { concepts: ['MANZANA', 'PLÁTANO', 'NARANJA', 'UVA'], theme: 'FRUTAS' },
                    { concepts: ['PERRO', 'GATO', 'PÁJARO', 'PEZ'], theme: 'MASCOTAS' },
                    { concepts: ['ROJO', 'AZUL', 'VERDE', 'AMARILLO'], theme: 'COLORES' }
                ],
                medium: [],
                hard: []
            },
            'de': {
                easy: [
                    { concepts: ['APFEL', 'BANANE', 'ORANGE', 'TRAUBE'], theme: 'OBST' },
                    { concepts: ['HUND', 'KATZE', 'VOGEL', 'FISCH'], theme: 'HAUSTIERE' },
                    { concepts: ['ROT', 'BLAU', 'GRÜN', 'GELB'], theme: 'FARBEN' }
                ],
                medium: [],
                hard: []
            },
            'it': {
                easy: [
                    { concepts: ['MELA', 'BANANA', 'ARANCIA', 'UVA'], theme: 'FRUTTA' },
                    { concepts: ['CANE', 'GATTO', 'UCCELLO', 'PESCE'], theme: 'ANIMALI' },
                    { concepts: ['ROSSO', 'BLU', 'VERDE', 'GIALLO'], theme: 'COLORI' }
                ],
                medium: [],
                hard: []
            },
            'pt': {
                easy: [
                    { concepts: ['MAÇÃ', 'BANANA', 'LARANJA', 'UVA'], theme: 'FRUTAS' },
                    { concepts: ['CÃO', 'GATO', 'PÁSSARO', 'PEIXE'], theme: 'ANIMAIS' },
                    { concepts: ['VERMELHO', 'AZUL', 'VERDE', 'AMARELO'], theme: 'CORES' }
                ],
                medium: [],
                hard: []
            },
            'nl': {
                easy: [
                    { concepts: ['APPEL', 'BANAAN', 'SINAASAPPEL', 'DRUIF'], theme: 'FRUIT' },
                    { concepts: ['HOND', 'KAT', 'VOGEL', 'VIS'], theme: 'HUISDIEREN' },
                    { concepts: ['ROOD', 'BLAUW', 'GROEN', 'GEEL'], theme: 'KLEUREN' }
                ],
                medium: [],
                hard: []
            }
        };

        // Get the appropriate options based on language and difficulty
        const langOptions = conceptSets[language] || conceptSets['en'];
        const difficultyOptions = langOptions[difficulty] || langOptions['easy'] || conceptSets['en']['easy'];

        if (difficultyOptions.length === 0) {
            // Fallback to English if no options for this language/difficulty
            return this.generateConceptSet(difficulty, 'en');
        }

        // Select a random concept set
        const selectedSet = difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)];

        // Try to track this concept set in ContentUsage
        try {
            const { db } = await import('@/lib/db');
            const { auth } = await import('@/lib/auth');
            const session = await auth();

            if (session?.user?.id) {
                // Create a string representation of the concept set
                const conceptString = selectedSet.concepts.join(':');

                // Add to ContentUsage
                await db.contentUsage.upsert({
                    where: {
                        userId_contentType_value_format: {
                            userId: session.user.id,
                            contentType: 'CONCEPT',
                            value: conceptString,
                            format: `${language}-${difficulty}`
                        }
                    },
                    update: {
                        isUsed: true,
                        usedAt: new Date(),
                        metadata: {
                            theme: selectedSet.theme,
                            language,
                            conceptCount: selectedSet.concepts.length
                        }
                    },
                    create: {
                        id: uuidv4(), // Add UUID for id field
                        userId: session.user.id,
                        contentType: 'CONCEPT',
                        value: conceptString,
                        format: `${language}-${difficulty}`,
                        isUsed: true,
                        metadata: {
                            theme: selectedSet.theme,
                            language,
                            conceptCount: selectedSet.concepts.length
                        }
                    }
                });

                console.log(`✅ SmartGeneratorAdapter: Added concept set ${conceptString} to ContentUsage`);
            }
        } catch (error) {
            console.error(`❌ SmartGeneratorAdapter: Error adding concept set to ContentUsage:`, error);
            // Don't fail concept generation if tracking fails
        }

        return selectedSet;
    }

    /**
     * Generates a hint for the quiz
     */
    private getFallbackHint(quizType: QuizType): string {
        switch (quizType) {
            case QuizType.WORDLE:
                return "Look for letter patterns and think of common words.";
            case QuizType.NUMBER_SEQUENCE:
                return "Look for the pattern in the sequence.";
            case QuizType.RHYME_TIME:
                return "Find the word that rhymes with the given word.";
            case QuizType.CONCEPT_CONNECTION:
                return "Find what connects these concepts.";
            default:
                return "Look carefully at the pattern to solve this puzzle.";
        }
    }
} 