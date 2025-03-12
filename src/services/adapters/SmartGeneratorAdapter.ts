import { Language } from '@/lib/types';
import { CompleteQuizGenerationResult, QuizGenerationService } from '@/services/api/quiz/QuizGenerationService';
import { DictionaryService } from '@/services/dictionary/DictionaryService';
import { QuizType } from '@prisma/client';

/**
 * Adapter for connecting the Smart Generator to the centralized QuizGenerationService
 * This allows the Smart Generator to use the same generation logic as the regular quiz creator
 */
export class SmartGeneratorAdapter {
    private quizGenerationService = QuizGenerationService.getInstance();
    private dictionaryService = DictionaryService.getInstance();

    /**
     * Generates quiz content using the centralized quiz generation service
     */
    async generateQuizContent(params: {
        templateType: QuizType,
        theme?: string,
        difficulty: string,
        language: string,
        templateId: string
    }): Promise<CompleteQuizGenerationResult> {
        console.log('📊 SmartGeneratorAdapter: Generating quiz content with params:', {
            ...params,
            theme: params.theme || '(No theme specified)'
        });

        try {
            // Initialize dictionary service with error handling
            try {
                await this.dictionaryService.initialize();
            } catch (dictionaryError) {
                console.warn('⚠️ SmartGeneratorAdapter: Dictionary initialization failed. Continuing without dictionary support:', dictionaryError);
                // We'll continue without dictionary support - the adapter will fallback to AI-generated content
            }

            // For WORDLE quizzes, we need to get a word from the dictionary
            let enhancedContent = '';

            if (params.templateType === QuizType.WORDLE) {
                try {
                    // Get random word from dictionary based on language and difficulty
                    const wordLength = this.getWordLengthBasedOnDifficulty(params.difficulty);
                    const word = await this.getWordFromDictionary(params.language as Language, wordLength, params.difficulty);

                    if (!word) {
                        console.warn('⚠️ SmartGeneratorAdapter: Could not get word from dictionary, falling back to simple content');
                        enhancedContent = this.createEnhancedContent(params.difficulty, params.templateType);
                    } else {
                        console.log(`✅ SmartGeneratorAdapter: Got word from dictionary: ${word}`);
                        enhancedContent = word; // For WORDLE, the content is just the word
                    }
                } catch (wordError) {
                    console.warn('⚠️ SmartGeneratorAdapter: Error getting word from dictionary, falling back to simple content:', wordError);
                    enhancedContent = this.createEnhancedContent(params.difficulty, params.templateType);
                }
            } else {
                // For other quiz types, create enhanced content based on difficulty and quiz type
                enhancedContent = this.createEnhancedContent(params.difficulty, params.templateType);
            }

            // Call the centralized quiz generation service
            let result;
            try {
                result = await this.quizGenerationService.generateCompleteQuiz({
                    templateId: params.templateId,
                    quizType: params.templateType,
                    language: params.language as Language,
                    content: enhancedContent
                });
            } catch (error) {
                console.error('❌ SmartGeneratorAdapter: Error from quiz generation service:', error);

                // Create a fallback result if the service fails
                return this.createFallbackQuizResult(
                    params.templateType,
                    enhancedContent,
                    params.difficulty,
                    params.language as Language
                );
            }

            if (result.error) {
                console.error('❌ SmartGeneratorAdapter: Error in quiz generation result:', result.error);

                // Check if it's a region/country restriction error
                if (typeof result.error === 'object' &&
                    (result.error.code === 'unsupported_country_region_territory' ||
                        JSON.stringify(result.error).includes('Country, region, or territory not supported'))) {
                    console.warn('⚠️ OpenAI is not available in your region. Using fallback quiz content.');

                    // Return fallback content for geographical restrictions
                    return this.createFallbackQuizResult(
                        params.templateType,
                        enhancedContent,
                        params.difficulty,
                        params.language as Language
                    );
                }

                throw new Error(`Quiz generation failed: ${result.error.message || JSON.stringify(result.error)}`);
            }

            if (!result.data) {
                console.error('❌ SmartGeneratorAdapter: No data returned from quiz generation service');

                // Create a fallback if no data is returned
                return this.createFallbackQuizResult(
                    params.templateType,
                    enhancedContent,
                    params.difficulty,
                    params.language as Language
                );
            }

            // Ensure the result has all required fields
            const enhancedResult = this.enhanceResult(result.data, params.difficulty, params.templateType);

            console.log('✅ SmartGeneratorAdapter: Successfully generated quiz content');
            return enhancedResult;
        } catch (error) {
            console.error('❌ SmartGeneratorAdapter: Error generating quiz content:', error);
            throw error;
        }
    }

    /**
     * Gets a word from the dictionary based on language and length
     */
    private async getWordFromDictionary(language: Language, wordLength: number, difficulty: string): Promise<string | null> {
        try {
            console.log(`🔍 SmartGeneratorAdapter: Getting ${wordLength}-letter word in ${language} language`);

            // Check if dictionary is initialized
            if (!this.dictionaryService) {
                console.warn('⚠️ SmartGeneratorAdapter: Dictionary service not available');
                return null;
            }

            // Map difficulty to word difficulty
            const wordDifficulty = this.mapDifficultyLevel(difficulty);

            // Get random word from dictionary
            const word = await this.dictionaryService.getRandomWord(language, {
                wordLength,
                difficulty: wordDifficulty,
                noAccents: true
            });

            if (!word) {
                console.warn(`⚠️ SmartGeneratorAdapter: No ${wordLength}-letter word found in ${language} dictionary`);
                // Try without difficulty constraint
                console.log(`🔍 SmartGeneratorAdapter: Retrying without difficulty constraint`);
                const fallbackWord = await this.dictionaryService.getRandomWord(language, {
                    wordLength,
                    noAccents: true
                });

                if (!fallbackWord) {
                    console.warn(`⚠️ SmartGeneratorAdapter: Still no word found in dictionary, will use AI-generated content`);
                    return null;
                }

                console.log(`✅ SmartGeneratorAdapter: Got fallback word from dictionary: ${fallbackWord}`);
                return fallbackWord.toUpperCase();
            }

            console.log(`✅ SmartGeneratorAdapter: Got word from dictionary: ${word}`);
            return word.toUpperCase();
        } catch (error) {
            console.error('❌ SmartGeneratorAdapter: Error getting word from dictionary:', error);
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
        quizType: QuizType
    ): CompleteQuizGenerationResult {
        // Ensure variables object exists
        if (!result.variables) {
            result.variables = {};
        }

        // Get quiz type name for titles
        const quizTypeName = this.getQuizTypeName(quizType);

        // Update title if needed
        if (!result.title || result.title.trim() === '') {
            result.title = `${quizTypeName} Quiz`;
        } else {
            // Remove any quotation marks from existing titles
            result.title = result.title.replace(/["']/g, '');
        }

        // Ensure subtitle is present
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

        // Ensure hint is present
        if (!result.hint || result.hint.trim() === '') {
            result.hint = `Think carefully about the ${quizTypeName.toLowerCase()} pattern`;
        }

        // Ensure solution includes context
        if (!result.solution || result.solution.trim() === '') {
            result.solution = `This is a ${difficulty} level ${quizTypeName} quiz`;
        }

        return result;
    }

    /**
     * Get a user-friendly name for the quiz type
     */
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
    private createEnhancedContent(difficulty: string, quizType: QuizType = QuizType.WORDLE): string {
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
                const sequence = this.generateNumberSequence(difficulty);
                return sequence.join(', ');

            case QuizType.RHYME_TIME:
                // For RHYME_TIME, provide guidance on word selection
                return `Generate rhyming word pairs that are ${difficultyContext} to identify.`;

            case QuizType.CONCEPT_CONNECTION:
                // For CONCEPT_CONNECTION, guide the concept generation
                return `Generate ${difficultyContext} sets of related concepts that share a common theme.`;

            case QuizType.WORDLE:
            default:
                // Create a general prompt that will help the AI generate appropriate content
                return `Create a ${difficultyContext} quiz. The quiz should be engaging for users.`;
        }
    }

    /**
     * Generates a numeric sequence based on difficulty
     */
    private generateNumberSequence(difficulty: string): number[] {
        switch (difficulty) {
            case 'easy':
                // Simple arithmetic sequences
                const options = [
                    [2, 4, 6, 8, 10], // +2
                    [5, 10, 15, 20, 25], // +5
                    [1, 3, 5, 7, 9] // +2
                ];
                return options[Math.floor(Math.random() * options.length)];

            case 'medium':
                // More complex patterns
                const mediumOptions = [
                    [3, 6, 9, 12, 15], // +3
                    [1, 4, 9, 16, 25], // squares
                    [2, 6, 12, 20, 30] // increasing differences
                ];
                return mediumOptions[Math.floor(Math.random() * mediumOptions.length)];

            case 'hard':
                // Complex patterns
                const hardOptions = [
                    [2, 4, 8, 16, 32], // ×2
                    [3, 4, 7, 11, 18], // Fibonacci-like
                    [1, 3, 6, 10, 15] // triangular numbers
                ];
                return hardOptions[Math.floor(Math.random() * hardOptions.length)];

            default:
                return [1, 2, 3, 4, 5]; // Simplest sequence
        }
    }

    /**
     * Creates a fallback quiz result when the generation service fails
     */
    private createFallbackQuizResult(
        quizType: QuizType,
        content: string,
        difficulty: string,
        language: Language
    ): CompleteQuizGenerationResult {
        console.log('📊 SmartGeneratorAdapter: Creating fallback quiz content');

        // Get quiz type name for titles
        const quizTypeName = this.getQuizTypeName(quizType);

        // For WORDLE quizzes, make sure we have a valid word
        let answer = content;
        if (quizType === QuizType.WORDLE) {
            // If content isn't a valid word (probably AI generated content), use a fallback word
            if (content.length < 3 || content.length > 7 || !/^[A-Z]+$/i.test(content)) {
                // Fallback words by language
                const fallbackWords: Record<Language, string[]> = {
                    'en': ['QUIZ', 'WORD', 'GAME', 'TIME', 'PLAY'],
                    'fr': ['CHAT', 'JOUR', 'BIEN', 'MAIN', 'PONT'],
                    'es': ['CASA', 'AGUA', 'VIDA', 'MESA', 'AZUL'],
                    'de': ['HAUS', 'BUCH', 'WELT', 'HAND', 'ZEIT'],
                    'it': ['CASA', 'VITA', 'CIBO', 'SOLE', 'LUNA'],
                    'pt': ['CASA', 'VIDA', 'AMOR', 'AGUA', 'FALA'],
                    'nl': ['HUIS', 'BOEK', 'TIJD', 'HAND', 'WERK']
                };

                // Select a word appropriate for the difficulty
                const words = fallbackWords[language] || fallbackWords['en'];
                const index = Math.min(
                    Math.floor(difficulty === 'hard' ? 4 : (difficulty === 'medium' ? 2 : 0)),
                    words.length - 1
                );
                answer = words[index];
            }

            // Generate WORDLE grid HTML
            const wordGrid = this.generateBasicWordGrid(answer);

            return {
                title: `${quizTypeName} Quiz`,
                subtitle: `Test your ${difficulty} level ${quizTypeName} skills`,
                brandingText: `${quizTypeName} Quiz by FB Quiz`,
                hint: "Look for letter patterns and think of common words",
                answer: answer,
                solution: `The answer is ${answer}. This is a ${difficulty} level word puzzle.`,
                variables: {
                    wordGrid: answer,
                    wordLength: String(answer.length),
                    attempts: "3",
                    maxAttempts: "6",
                    correctHint: "Letter is in the word and in the correct position",
                    misplacedHint: "Letter is in the word but in the wrong position",
                    wrongHint: "Letter is not in the word"
                }
            };
        } else if (quizType === QuizType.NUMBER_SEQUENCE) {
            // Fallback for number sequence quizzes
            // Generate a simple sequence based on difficulty
            const sequence = this.generateNumberSequence(difficulty);

            // Calculate the next number based on the pattern
            let nextNumber: number;
            let patternDescription: string;

            // Determine the pattern based on the sequence
            if (sequence[1] - sequence[0] === sequence[2] - sequence[1]) {
                // Arithmetic sequence (addition)
                const diff = sequence[1] - sequence[0];
                nextNumber = sequence[sequence.length - 1] + diff;
                patternDescription = `where each number increases by ${diff}`;
            } else if (sequence[1] / sequence[0] === sequence[2] / sequence[1] && Number.isInteger(sequence[1] / sequence[0])) {
                // Geometric sequence (multiplication)
                const ratio = sequence[1] / sequence[0];
                nextNumber = sequence[sequence.length - 1] * ratio;
                patternDescription = `where each number is multiplied by ${ratio}`;
            } else if (sequence[0] === 1 && sequence[1] === 3 && sequence[2] === 6) {
                // Triangular numbers
                nextNumber = (sequence.length + 1) * (sequence.length + 2) / 2;
                patternDescription = "of triangular numbers";
            } else if (sequence[0] === 1 && sequence[1] === 4 && sequence[2] === 9) {
                // Square numbers
                nextNumber = Math.pow(sequence.length + 1, 2);
                patternDescription = "of square numbers";
            } else if (sequence[2] === sequence[0] + sequence[1] && sequence[3] === sequence[1] + sequence[2]) {
                // Fibonacci-like
                nextNumber = sequence[sequence.length - 1] + sequence[sequence.length - 2];
                patternDescription = "where each number is the sum of the two previous numbers";
            } else {
                // Default to simple addition
                const diff = sequence[1] - sequence[0];
                nextNumber = sequence[sequence.length - 1] + diff;
                patternDescription = `where each number increases by ${diff}`;
            }

            const answer = nextNumber.toString();

            // Create sequence HTML for the template
            const sequenceHtml = sequence.map(num => `<div class="number-box">${num}</div>`).join('') +
                '<div class="number-box missing">?</div>';

            return {
                title: `${quizTypeName} Quiz`,
                subtitle: `Test your ${difficulty} level ${quizTypeName} skills`,
                brandingText: `${quizTypeName} Quiz by FB Quiz`,
                hint: "Look for the pattern in the numbers",
                answer: answer,
                solution: `The answer is ${answer}. This sequence follows a pattern ${patternDescription}.`,
                variables: {
                    sequence: sequenceHtml
                }
            };
        } else if (quizType === QuizType.RHYME_TIME) {
            // Fallback for rhyme time quizzes
            // Create predefined rhyming pairs based on language
            const rhymingPairs: Record<Language, Array<[string, string]>> = {
                'en': [['CAT', 'HAT'], ['DAY', 'PLAY'], ['LIGHT', 'NIGHT']],
                'fr': [['CHAT', 'RAT'], ['JOUR', 'TOUR'], ['MAIN', 'PAIN']],
                'es': [['SOL', 'COL'], ['MAR', 'DAR'], ['LUZ', 'CRUZ']],
                'de': [['HAUS', 'MAUS'], ['HAND', 'LAND'], ['WELT', 'GELD']],
                'it': [['AMORE', 'CUORE'], ['SOLE', 'MOLE'], ['VITA', 'DITA']],
                'pt': [['MAR', 'LAR'], ['SOL', 'VOL'], ['PAZ', 'GAZ']],
                'nl': [['HUIS', 'MUIS'], ['LAND', 'ZAND'], ['KAT', 'RAT']]
            };

            // Select pair based on difficulty
            const pairs = rhymingPairs[language] || rhymingPairs['en'];
            const index = Math.min(Math.floor(difficulty === 'hard' ? 2 : (difficulty === 'medium' ? 1 : 0)), pairs.length - 1);
            const [firstWord, secondWord] = pairs[index];

            // Randomly determine which word to show
            const showFirstWord = Math.random() > 0.5;

            // Create HTML for the template
            const rhymeGridHtml = showFirstWord
                ? `<div class="rhyme-card"><p class="rhyme-text">${firstWord}</p></div><div class="rhyme-card missing"><p class="rhyme-text">?</p></div>`
                : `<div class="rhyme-card missing"><p class="rhyme-text">?</p></div><div class="rhyme-card"><p class="rhyme-text">${secondWord}</p></div>`;

            return {
                title: `${quizTypeName} Quiz`,
                subtitle: `Test your ${difficulty} level ${quizTypeName} skills`,
                brandingText: `${quizTypeName} Quiz by FB Quiz`,
                hint: "Find the word that rhymes with the given word",
                answer: showFirstWord ? secondWord : firstWord,
                solution: `The answer is ${showFirstWord ? secondWord : firstWord}. It rhymes with ${showFirstWord ? firstWord : secondWord}.`,
                variables: {
                    rhymeGrid: rhymeGridHtml
                }
            };
        } else if (quizType === QuizType.CONCEPT_CONNECTION) {
            // Fallback for concept connection quizzes
            // Create predefined concept sets based on language and difficulty
            const conceptSets: Record<Language, Array<[string[], string]>> = {
                'en': [
                    [['APPLE', 'BANANA', 'ORANGE', 'GRAPE'], 'FRUITS'],
                    [['DOG', 'CAT', 'BIRD', 'FISH'], 'PETS'],
                    [['RED', 'BLUE', 'GREEN', 'YELLOW'], 'COLORS']
                ],
                'fr': [
                    [['POMME', 'BANANE', 'ORANGE', 'RAISIN'], 'FRUITS'],
                    [['CHIEN', 'CHAT', 'OISEAU', 'POISSON'], 'ANIMAUX'],
                    [['ROUGE', 'BLEU', 'VERT', 'JAUNE'], 'COULEURS']
                ],
                'es': [
                    [['MANZANA', 'PLATANO', 'NARANJA', 'UVA'], 'FRUTAS'],
                    [['PERRO', 'GATO', 'PAJARO', 'PEZ'], 'MASCOTAS'],
                    [['ROJO', 'AZUL', 'VERDE', 'AMARILLO'], 'COLORES']
                ],
                'de': [
                    [['APFEL', 'BANANE', 'ORANGE', 'TRAUBE'], 'OBST'],
                    [['HUND', 'KATZE', 'VOGEL', 'FISCH'], 'HAUSTIERE'],
                    [['ROT', 'BLAU', 'GRÜN', 'GELB'], 'FARBEN']
                ],
                // Add other languages as needed
                'it': [
                    [['MELA', 'BANANA', 'ARANCIA', 'UVA'], 'FRUTTA'],
                    [['CANE', 'GATTO', 'UCCELLO', 'PESCE'], 'ANIMALI'],
                    [['ROSSO', 'BLU', 'VERDE', 'GIALLO'], 'COLORI']
                ],
                'pt': [
                    [['MAÇÃ', 'BANANA', 'LARANJA', 'UVA'], 'FRUTAS'],
                    [['CÃO', 'GATO', 'PÁSSARO', 'PEIXE'], 'ANIMAIS'],
                    [['VERMELHO', 'AZUL', 'VERDE', 'AMARELO'], 'CORES']
                ],
                'nl': [
                    [['APPEL', 'BANAAN', 'SINAASAPPEL', 'DRUIF'], 'FRUIT'],
                    [['HOND', 'KAT', 'VOGEL', 'VIS'], 'HUISDIEREN'],
                    [['ROOD', 'BLAUW', 'GROEN', 'GEEL'], 'KLEUREN']
                ]
            };

            // Select concept set based on difficulty
            const sets = conceptSets[language] || conceptSets['en'];
            const index = Math.min(Math.floor(difficulty === 'hard' ? 2 : (difficulty === 'medium' ? 1 : 0)), sets.length - 1);
            const [concepts, theme] = sets[index];

            // Create HTML for the template
            const conceptsGridHtml = concepts.map(concept =>
                `<div class="concept-card"><span class="concept-text">${concept}</span></div>`
            ).join('');

            return {
                title: `${quizTypeName} Quiz`,
                subtitle: `Test your ${difficulty} level ${quizTypeName} skills`,
                brandingText: `${quizTypeName} Quiz by FB Quiz`,
                hint: "Find what connects these concepts",
                answer: theme,
                solution: `The connecting theme is ${theme}. All of these items are types of ${theme.toLowerCase()}.`,
                variables: {
                    conceptsGrid: conceptsGridHtml
                }
            };
        } else {
            // Generic fallback for other quiz types
            return {
                title: `${quizTypeName} Quiz`,
                subtitle: `Test your ${difficulty} level ${quizTypeName} skills`,
                brandingText: `${quizTypeName} Quiz by FB Quiz`,
                hint: "Think carefully about the patterns",
                answer: "Fallback answer",
                solution: `This is a ${difficulty} level ${quizTypeName.toLowerCase()} quiz.`,
                variables: {
                    difficulty: difficulty
                }
            };
        }
    }

    /**
     * Generate a basic WORDLE grid for fallback content
     */
    private generateBasicWordGrid(word: string): string {
        return `<div class="word-grid-container">
            <div class="word-attempt">
                <div class="word-grid-row">
                    ${word.split('').map(letter =>
            `<div class="letter-box">${letter}</div>`).join('')}
                </div>
            </div>
        </div>`;
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
} 