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
  private readonly PLACEHOLDER_LETTERS = 'QWJKXZ';
  private readonly WORD_LENGTH = 5; // Enforce 5-letter words

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
    const usedLetters = new Set<string>();
    const lettersRemaining = new Set<string>(word.split(''));
    const wordLength = word.length;

    // First attempt: Show 1-2 misplaced letters from the word
    attempts.push(this.generateMisplacedAttempt(word, usedLetters, lettersRemaining, wordLength));

    // Second attempt: Show 1-2 correct letters and 1 misplaced
    attempts.push(this.generateMixedAttempt(word, usedLetters, lettersRemaining, wordLength));

    // Third attempt: Show remaining letters with strategic placement
    attempts.push(this.generateFinalAttempt(word, usedLetters, lettersRemaining, wordLength));

    return attempts;
  }

  private generateMisplacedAttempt(
    word: string,
    usedLetters: Set<string>,
    lettersRemaining: Set<string>,
    wordLength: number
  ): string {
    const attempt = new Array(wordLength).fill('');
    const availableLetters = Array.from(lettersRemaining);

    // Place 1-2 misplaced letters from the word
    const numMisplaced = Math.min(
      availableLetters.length,
      Math.floor(Math.random() * 2) + 1 // 1-2 misplaced letters
    );

    for (let i = 0; i < numMisplaced; i++) {
      const letter = availableLetters[i];
      const correctPositions = this.getLetterPositions(word, letter);
      let placed = false;

      // Try to place in a wrong position
      for (let tries = 0; tries < wordLength * 2 && !placed; tries++) {
        const pos = Math.floor(Math.random() * wordLength);
        if (attempt[pos] === '' && !correctPositions.includes(pos)) {
          attempt[pos] = letter;
          usedLetters.add(letter);
          placed = true;
        }
      }

      // If couldn't find a wrong position, place in any empty position
      if (!placed) {
        for (let pos = 0; pos < wordLength; pos++) {
          if (attempt[pos] === '') {
            attempt[pos] = letter;
            usedLetters.add(letter);
            break;
          }
        }
      }
    }

    // Fill remaining positions with strategic letters
    for (let i = 0; i < wordLength; i++) {
      if (attempt[i] === '') {
        // Prioritize using common letters that aren't in the word
        const commonLetters = this.COMMON_LETTERS.split('')
          .filter(l => !word.includes(l) && !usedLetters.has(l));

        const randomLetter = commonLetters.length > 0
          ? commonLetters[Math.floor(Math.random() * commonLetters.length)]
          : this.getRandomLetter(usedLetters, word);

        attempt[i] = randomLetter;
        usedLetters.add(randomLetter);
      }
    }

    return attempt.join('');
  }

  private generateMixedAttempt(
    word: string,
    usedLetters: Set<string>,
    lettersRemaining: Set<string>,
    wordLength: number
  ): string {
    const attempt = new Array(wordLength).fill('');
    const availableLetters = Array.from(lettersRemaining);

    // Find duplicate letters in the word
    const letterCounts = new Map<string, number>();
    for (const letter of word) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }

    // Get letters with duplicates
    const duplicateLetters = Array.from(letterCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([letter]) => letter);

    // Place duplicate letters first if they exist
    if (duplicateLetters.length > 0) {
      const duplicateLetter = duplicateLetters[0];
      const positions = this.getLetterPositions(word, duplicateLetter);

      // Place both occurrences of the duplicate letter
      for (let i = 0; i < Math.min(2, positions.length); i++) {
        const pos = positions[i];
        attempt[pos] = word[pos];
        usedLetters.add(word[pos]);
        lettersRemaining.delete(word[pos]);
      }
    }

    // Place more correct letters (2-3 depending on word length)
    const numCorrect = Math.min(
      Math.floor(wordLength / 2), // Up to half of the word length
      Math.floor(Math.random() * 2) + 2 // 2-3 correct letters
    );

    const positions = Array.from({ length: wordLength }, (_, i) => i)
      .filter(pos => attempt[pos] === ''); // Only consider empty positions

    for (let i = 0; i < numCorrect && positions.length > 0; i++) {
      const pos = positions.splice(Math.floor(Math.random() * positions.length), 1)[0];
      attempt[pos] = word[pos];
      usedLetters.add(word[pos]);
      lettersRemaining.delete(word[pos]);
    }

    // Place 1-2 misplaced letters if we have any letters remaining
    if (availableLetters.length > 0) {
      const numMisplaced = Math.min(availableLetters.length, Math.floor(Math.random() * 2) + 1);

      for (let i = 0; i < numMisplaced; i++) {
        const letter = availableLetters[i];
        const correctPositions = this.getLetterPositions(word, letter);
        let placed = false;

        // Try to place in a wrong position
        for (let tries = 0; tries < wordLength * 2 && !placed; tries++) {
          const pos = Math.floor(Math.random() * wordLength);
          if (attempt[pos] === '' && !correctPositions.includes(pos)) {
            attempt[pos] = letter;
            usedLetters.add(letter);
            placed = true;
          }
        }

        // If couldn't find a wrong position, place in any empty position
        if (!placed) {
          for (let pos = 0; pos < wordLength; pos++) {
            if (attempt[pos] === '') {
              attempt[pos] = letter;
              usedLetters.add(letter);
              break;
            }
          }
        }
      }
    }

    // Fill remaining positions with strategic letters
    for (let i = 0; i < wordLength; i++) {
      if (attempt[i] === '') {
        // Prioritize using common letters that aren't in the word
        const commonLetters = this.COMMON_LETTERS.split('')
          .filter(l => !word.includes(l) && !usedLetters.has(l));

        const randomLetter = commonLetters.length > 0
          ? commonLetters[Math.floor(Math.random() * commonLetters.length)]
          : this.getRandomLetter(usedLetters, word);

        attempt[i] = randomLetter;
        usedLetters.add(randomLetter);
      }
    }

    return attempt.join('');
  }

  private generateFinalAttempt(
    word: string,
    usedLetters: Set<string>,
    lettersRemaining: Set<string>,
    wordLength: number
  ): string {
    const attempt = new Array(wordLength).fill('');
    const remainingLetters = Array.from(lettersRemaining);

    // Place remaining letters from the word strategically
    for (const letter of remainingLetters) {
      const correctPositions = this.getLetterPositions(word, letter);
      let placed = false;

      // Try to place in a wrong position that's not adjacent to correct positions
      for (let tries = 0; tries < wordLength * 2 && !placed; tries++) {
        const pos = Math.floor(Math.random() * wordLength);
        const isAdjacent = correctPositions.some(cp => Math.abs(cp - pos) <= 1);

        if (attempt[pos] === '' && !correctPositions.includes(pos) && !isAdjacent) {
          attempt[pos] = letter;
          usedLetters.add(letter);
          placed = true;
        }
      }

      // If couldn't find an ideal position, place in any empty position
      if (!placed) {
        for (let pos = 0; pos < wordLength; pos++) {
          if (attempt[pos] === '') {
            attempt[pos] = letter;
            usedLetters.add(letter);
            break;
          }
        }
      }
    }

    // Fill remaining positions with strategic letters
    for (let i = 0; i < wordLength; i++) {
      if (attempt[i] === '') {
        // Use placeholder letters that are less common
        const unusedPlaceholders = this.PLACEHOLDER_LETTERS.split('')
          .filter(l => !usedLetters.has(l) && !word.includes(l));

        const randomLetter = unusedPlaceholders.length > 0
          ? unusedPlaceholders[Math.floor(Math.random() * unusedPlaceholders.length)]
          : this.getRandomLetter(usedLetters, word);

        attempt[i] = randomLetter;
        usedLetters.add(randomLetter);
      }
    }

    return attempt.join('');
  }

  private getRandomLetter(usedLetters: Set<string>, word: string): string {
    // First try to use common letters that aren't in the word
    const commonLetters = this.COMMON_LETTERS.split('')
      .filter(l => !usedLetters.has(l) && !word.includes(l));

    if (commonLetters.length > 0) {
      return commonLetters[Math.floor(Math.random() * commonLetters.length)];
    }

    // Then try placeholder letters
    const placeholderLetters = this.PLACEHOLDER_LETTERS.split('')
      .filter(l => !usedLetters.has(l) && !word.includes(l));

    if (placeholderLetters.length > 0) {
      return placeholderLetters[Math.floor(Math.random() * placeholderLetters.length)];
    }

    // Finally, use any unused letter from the alphabet
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const unusedLetters = alphabet.filter(l => !usedLetters.has(l) && !word.includes(l));

    return unusedLetters.length > 0
      ? unusedLetters[Math.floor(Math.random() * unusedLetters.length)]
      : alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  private getLetterPositions(word: string, letter: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter) {
        positions.push(i);
      }
    }
    return positions;
  }

  private generateWordGrid(attempts: string[], answer: string): string {
    console.log('🔄 WordleStrategy: Generating word grid:', {
      attempts,
      answer,
      attemptCount: attempts.length
    });

    const processedAttempts = attempts.map((attempt, index) => {
      console.log(`📝 Processing attempt ${index + 1}:`, {
        attempt,
        answer,
        position: index
      });

      const processed = `<div class="word-attempt">
        <div class="word-grid-row">${this.processAttempt(attempt, answer)}</div>
      </div>`;

      console.log(`✅ Processed attempt ${index + 1}:`, {
        html: processed,
        letterCount: attempt.length
      });

      return processed;
    });

    const gridHtml = `<div class="word-grid-container">${processedAttempts.join('\n')}</div>`;

    console.log('✅ Generated word grid:', {
      html: gridHtml,
      attemptCount: processedAttempts.length,
      totalLetters: attempts.reduce((sum, attempt) => sum + attempt.length, 0)
    });

    return gridHtml;
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
