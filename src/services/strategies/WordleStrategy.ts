import { QUIZ_CONFIG } from '@/lib/config';
import { LANGUAGE_CONFIG } from '@/lib/i18n';
import { Language } from '@/lib/types';
import { GenerationContext, GenerationResult } from '../generation/pipeline/GenerationPipeline';
import { BaseQuizStrategy } from './BaseQuizStrategy';

interface ColorHintTranslations {
  correctHint: string;
  misplacedHint: string;
  wrongHint: string;
}

export class WordleStrategy extends BaseQuizStrategy {
  private readonly COMMON_LETTERS = 'ESARTNLICOUP';
  private readonly PLACEHOLDER_LETTERS = {
    UNKNOWN: 'X',
    PARTIAL: 'Y',
    EMPTY: '_'
  };

  // Language-specific hint translations cache
  private static hintTranslationsCache = new Map<Language, ColorHintTranslations>();

  protected getQuizTypeDescription(): string {
    return 'a word guessing game';
  }

  /**
   * Generates language-specific translations for color hint explanations
   */
  private async generateColorHintTranslations(language: Language): Promise<ColorHintTranslations> {
    // Check cache first to avoid unnecessary API calls
    if (WordleStrategy.hintTranslationsCache.has(language)) {
      return WordleStrategy.hintTranslationsCache.get(language)!;
    }

    // Default English translations
    if (language === 'en') {
      const translations = {
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
      };
      WordleStrategy.hintTranslationsCache.set(language, translations);
      return translations;
    }

    // For other languages, use OpenAI to translate
    try {
      console.log(`🌐 Generating color hint translations for ${language}...`);

      const translationsResponse = await this.generateOpenAIResponse(
        `You are a professional translator. Translate the following phrases accurately into ${LANGUAGE_CONFIG[language].name}.
        Return only the translations in a JSON format with keys: correctHint, misplacedHint, wrongHint.
        
        Make sure the translations sound natural and are appropriate for a word game (Wordle) interface.`,

        `Translate these Wordle color hint explanations to ${LANGUAGE_CONFIG[language].name}:
        
        correctHint: "Letter is in the word and in the correct position"
        misplacedHint: "Letter is in the word but in the wrong position"
        wrongHint: "Letter is not in the word"
        
        Return only the JSON object with the translated text.`,

        {
          temperature: 0.3, // Lower temperature for more accurate translations
          maxTokens: 150
        }
      );

      // Extract JSON from the response
      let parsedResponse: ColorHintTranslations;
      try {
        // Handle if the response includes markdown code blocks
        const jsonContent = translationsResponse.replace(/```json\s*|\s*```/g, '');
        parsedResponse = JSON.parse(jsonContent);
      } catch (e) {
        console.error('Failed to parse translation response:', e);
        // Fallback to regex extraction if JSON parsing fails
        const correctHintMatch = translationsResponse.match(/correctHint["\s:]+([^"]+)/);
        const misplacedHintMatch = translationsResponse.match(/misplacedHint["\s:]+([^"]+)/);
        const wrongHintMatch = translationsResponse.match(/wrongHint["\s:]+([^"]+)/);

        parsedResponse = {
          correctHint: correctHintMatch?.[1] || "Letter is in the word and in the correct position",
          misplacedHint: misplacedHintMatch?.[1] || "Letter is in the word but in the wrong position",
          wrongHint: wrongHintMatch?.[1] || "Letter is not in the word",
        };
      }

      // Cache the translations
      WordleStrategy.hintTranslationsCache.set(language, parsedResponse);
      console.log(`✅ Generated translations for ${language}:`, parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.error(`❌ Failed to generate translations for ${language}:`, error);
      // Fallback to English if translation fails
      return {
        correctHint: "Letter is in the word and in the correct position",
        misplacedHint: "Letter is in the word but in the wrong position",
        wrongHint: "Letter is not in the word",
      };
    }
  }

  public async generateContent(context: GenerationContext): Promise<GenerationResult> {
    try {
      // If no content provided, generate a word
      if (!context.content) {
        const word = await this.generateOpenAIResponse(
          `Generate a single word in ${LANGUAGE_CONFIG[context.language].name} that:
          - Is 4-7 letters long
          - Is a common word that native speakers know
          - No proper nouns or abbreviations
          - Must be appropriate for the language
          
          Rules:
          - Return ONLY the word in CAPITAL LETTERS
          - No explanations or additional text
          - Just the single word`,
          'Generate a word for Wordle',
          {
            maxTokens: 10,
            temperature: 0.8
          }
        );

        if (!await this.validateContent(word, context.language)) {
          return {
            error: `Invalid word generated for language ${context.language}: ${word}`
          };
        }

        context.content = word;
      }

      const word = context.content.toUpperCase();
      const attempts = this.generateAttempts(word);
      const wordGrid = this.generateWordGrid(attempts, word);

      // Generate language-specific color hint translations
      const hintTranslations = await this.generateColorHintTranslations(context.language);

      return {
        content: wordGrid,
        answer: word,
        metadata: {
          wordLength: String(word.length),
          attempts: String(attempts.length),
          maxAttempts: String(QUIZ_CONFIG.WORDLE.MAX_ATTEMPTS)
        },
        variables: {
          ...hintTranslations // Include the color hint translations
        }
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to generate Wordle content'
      };
    }
  }

  async validateContent(content: string, language: Language): Promise<boolean> {
    // Check if content is a single word
    const word = content.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(word)) {
      return false;
    }

    // Check word length
    if (word.length < 4 || word.length > 7) {
      return false;
    }

    // Check if content matches language character set
    const langConfig = LANGUAGE_CONFIG[language];
    return langConfig.characterSet.test(word);
  }

  private generateAttempts(word: string): string[] {
    const attempts: string[] = [];
    const wordLetters = new Set(word.split(''));
    const wordLength = word.length;

    // Step 1: First attempt - Use common letters not in the word
    attempts.push(this.generateEliminationAttempt(word));

    // Step 2: Second attempt - Show half of the unique letters in strategic misplaced positions
    const uniqueLetters = Array.from(wordLetters);
    const halfLength = Math.ceil(uniqueLetters.length / 2);
    const firstHalfLetters = uniqueLetters.slice(0, halfLength);

    const secondAttempt = new Array(wordLength).fill('');
    firstHalfLetters.forEach(letter => {
      const correctPos = word.indexOf(letter);
      // Place each letter in a position that's not its correct position
      let newPos = (correctPos + 1) % wordLength;
      while (secondAttempt[newPos] !== '') {
        newPos = (newPos + 1) % wordLength;
      }
      secondAttempt[newPos] = letter;
    });

    // Fill remaining positions with random letters not in word
    for (let i = 0; i < wordLength; i++) {
      if (secondAttempt[i] === '') {
        secondAttempt[i] = this.getRandomLetters(1, new Set([...word, ...secondAttempt]))[0];
      }
    }
    attempts.push(secondAttempt.join(''));

    // Step 3: Third attempt - Show remaining letters in misplaced positions + one correct
    const remainingLetters = uniqueLetters.slice(halfLength);
    const thirdAttempt = new Array(wordLength).fill(this.PLACEHOLDER_LETTERS.UNKNOWN);

    // Place one letter in correct position (middle letter for better gameplay)
    const midPoint = Math.floor(wordLength / 2);
    thirdAttempt[midPoint] = word[midPoint];

    // Place remaining letters in misplaced positions
    remainingLetters.forEach((letter) => {
      if (letter !== word[midPoint]) {
        const correctPos = word.indexOf(letter);
        let newPos = (correctPos + 2) % wordLength;
        while (thirdAttempt[newPos] !== this.PLACEHOLDER_LETTERS.UNKNOWN || newPos === midPoint) {
          newPos = (newPos + 1) % wordLength;
        }
        thirdAttempt[newPos] = letter;
      }
    });

    // Fill remaining positions with random letters not in word
    for (let i = 0; i < wordLength; i++) {
      if (thirdAttempt[i] === this.PLACEHOLDER_LETTERS.UNKNOWN) {
        thirdAttempt[i] = this.getRandomLetters(1, new Set([...word]))[0];
      }
    }
    attempts.push(thirdAttempt.join(''));

    return attempts;
  }

  private generateEliminationAttempt(word: string): string {
    const wordLetters = new Set(word.split(''));
    const commonLettersNotInWord = this.COMMON_LETTERS.split('')
      .filter(l => !wordLetters.has(l));

    // Fill with common letters not in word, then random letters if needed
    const attempt = commonLettersNotInWord.slice(0, word.length);
    if (attempt.length < word.length) {
      const additionalLetters = this.getRandomLetters(
        word.length - attempt.length,
        new Set([...wordLetters, ...attempt])
      );
      attempt.push(...additionalLetters);
    }

    return attempt.join('');
  }

  private getRandomLetters(count: number, exclude: Set<string>): string[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const availableLetters = alphabet.split('').filter(l => !exclude.has(l));
    const result: string[] = [];

    while (result.length < count && availableLetters.length > 0) {
      const index = Math.floor(Math.random() * availableLetters.length);
      result.push(availableLetters[index]);
      availableLetters.splice(index, 1);
    }

    return result;
  }

  private generateWordGrid(attempts: string[], answer: string): string {
    const processedAttempts = attempts.map((attempt, index) => {
      return `<div class="word-attempt">
        <div class="word-grid-row">${this.processAttempt(attempt, answer)}</div>
      </div>`;
    });

    return `<div class="word-grid-container">${processedAttempts.join('\n')}</div>`;
  }

  private processAttempt(attempt: string, answer: string): string {
    return attempt.split('').map((letter, index) => {
      if (letter === answer[index]) {
        return `<div class="letter-box correct">${letter}</div>`;
      }
      if (answer.includes(letter)) {
        return `<div class="letter-box misplaced">${letter}</div>`;
      }
      return `<div class="letter-box wrong">${letter}</div>`;
    }).join('');
  }

  protected getQuizType(): string {
    return 'WORDLE';
  }
}
