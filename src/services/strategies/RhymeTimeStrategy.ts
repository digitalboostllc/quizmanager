import { LANGUAGE_CONFIG } from '@/lib/config';
import { Language } from '@/lib/types';
import { GenerationContext, GenerationResult } from '../generation/pipeline/GenerationPipeline';
import { BaseQuizStrategy } from './BaseQuizStrategy';

export class RhymeTimeStrategy extends BaseQuizStrategy {
  // Predefined fallback rhyming pairs for different languages
  private readonly FALLBACK_PAIRS: Record<string, Array<[string, string]>> = {
    'en': [
      ['CAT', 'HAT'],
      ['PLAY', 'DAY'],
      ['NIGHT', 'LIGHT'],
      ['MOON', 'SOON'],
      ['LAKE', 'CAKE']
    ],
    'fr': [
      ['CHAT', 'RAT'],
      ['JOUR', 'TOUR'],
      ['PAIN', 'MAIN'],
      ['CIEL', 'MIEL'],
      ['PORTE', 'SORTE']
    ],
    'es': [
      ['SOL', 'COL'],
      ['MAR', 'DAR'],
      ['FLOR', 'AMOR'],
      ['PAN', 'DAN'],
      ['LUZ', 'CRUZ']
    ],
    'de': [
      ['HAUS', 'MAUS'],
      ['WELT', 'GELD'],
      ['NACHT', 'MACHT'],
      ['HAND', 'LAND'],
      ['BILD', 'WILD']
    ],
    'it': [
      ['AMORE', 'CUORE'],
      ['SOLE', 'MOLE'],
      ['GATTO', 'FATTO'],
      ['VITA', 'DITA'],
      ['MARE', 'FARE']
    ],
    'pt': [
      ['MAR', 'LAR'],
      ['SOL', 'VOL'],
      ['PAZ', 'GAZ'],
      ['FIM', 'SIM'],
      ['MÃO', 'PÃO']
    ],
    'nl': [
      ['HUIS', 'MUIS'],
      ['LAND', 'ZAND'],
      ['DAG', 'VLAG'],
      ['BOEK', 'HOEK'],
      ['KAT', 'RAT']
    ]
  };

  protected getQuizTypeDescription(): string {
    return 'rhyming word pair';
  }

  protected getQuizType(): string {
    return 'RHYME_TIME';
  }

  async generateContent(context: GenerationContext): Promise<GenerationResult> {
    try {
      console.log('🎵 Generating rhyming words...');

      // Maximum number of attempts to find a valid rhyming pair
      const MAX_ATTEMPTS = 3;

      // Try to generate a valid rhyming pair
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`🔄 Attempt ${attempt} of ${MAX_ATTEMPTS} to generate rhyming pair`);

        try {
          // Try to generate a rhyming pair
          const result = await this.attemptGenerateRhymingPair(context.language, context.content);

          if (result.success) {
            // We found a valid rhyming pair!
            const { firstWord, secondWord } = result;

            // Generate rhyme grid HTML
            const rhymeGridHtml = this.generateRhymeGridHtml(firstWord, secondWord);
            console.log('✅ Generated rhyme grid HTML');

            return {
              content: '',
              variables: {
                rhymeGrid: rhymeGridHtml
              },
              answer: `${firstWord}-${secondWord}`
            };
          }
        } catch (err) {
          console.error(`❌ Attempt ${attempt} failed:`, err);
        }
      }

      // All attempts failed, use a fallback pair
      console.log('⚠️ Using fallback rhyming pair');
      return this.useFallbackPair(context.language);
    } catch (err) {
      console.error('❌ Error generating rhyme content:', err);
      return {
        content: '',
        error: err instanceof Error ? err.message : 'Failed to generate rhyme content'
      };
    }
  }

  /**
   * Attempt to generate a valid rhyming pair
   */
  private async attemptGenerateRhymingPair(language: Language, contentPrompt?: string): Promise<{ success: boolean; firstWord: string; secondWord: string }> {
    // Generate first word
    const firstWord = await this.generateOpenAIResponse(
      `Generate a single word in ${LANGUAGE_CONFIG[language].name} that:
      - Is simple and common
      - Has 1-2 syllables
      - Has clear rhyming possibilities
      - No proper nouns or abbreviations
      - Must be appropriate for the language
      
      Rules:
      - Return ONLY the word in CAPITAL LETTERS
      - No explanations or additional text
      - Just the single word`,
      contentPrompt || 'Generate first rhyming word',
      {
        maxTokens: 10,
        temperature: 0.8
      }
    );

    console.log('✅ Generated first word:', firstWord);

    // Validate first word
    const isFirstWordValid = await this.validateContent(firstWord, language);
    if (!isFirstWordValid) {
      console.error('❌ Invalid first word:', firstWord);
      return { success: false, firstWord: '', secondWord: '' };
    }

    // Generate second word that rhymes with the first
    const secondWord = await this.generateOpenAIResponse(
      `Generate a single word in ${LANGUAGE_CONFIG[language].name} that:
      - Perfectly rhymes with "${firstWord}"
      - Must be a different word (not the same word)
      - No proper nouns or abbreviations
      - Must be appropriate for the language
      
      Rules:
      - Return ONLY the word in CAPITAL LETTERS
      - No explanations or additional text
      - Just the single word`,
      `Generate a word that rhymes with ${firstWord}`,
      {
        maxTokens: 10,
        temperature: 0.8
      }
    );

    console.log('✅ Generated second word:', secondWord);

    // Validate second word
    const isSecondWordValid = await this.validateContent(secondWord, language);
    if (!isSecondWordValid) {
      console.error('❌ Invalid second word:', secondWord);
      return { success: false, firstWord: '', secondWord: '' };
    }

    // Verify words are different
    if (firstWord.toLowerCase() === secondWord.toLowerCase()) {
      console.error('❌ Words are identical:', firstWord, secondWord);
      return { success: false, firstWord: '', secondWord: '' };
    }

    // Verify rhyming - with a fallback to ensure we don't block progression
    let doWordsRhyme = true;

    // For non-English languages, we'll skip the rhyme verification if we encounter issues
    // This is because rhyme verification is less reliable for non-English languages
    if (language === 'en') {
      try {
        const rhymeVerification = await this.generateOpenAIResponse(
          `You are an expert in ${LANGUAGE_CONFIG[language].name} phonetics and rhyming.
          Do these words perfectly rhyme: "${firstWord}" and "${secondWord}"?
          
          Rules:
          - Return ONLY "true" or "false"
          - Consider language-specific pronunciation
          - Must be a perfect rhyme, not just similar sounds
          - For non-English languages, be more lenient with what constitutes a rhyme`,
          `Do "${firstWord}" and "${secondWord}" rhyme?`,
          {
            maxTokens: 10,
            temperature: 0.1
          }
        );

        console.log('🎵 Rhyme verification:', rhymeVerification);

        // Accept yes/true/oui/si/ja as positive answers
        const positiveAnswer = /^(true|yes|oui|si|ja|correct|vrai|verdadero|wahr)$/i;
        doWordsRhyme = positiveAnswer.test(rhymeVerification.trim());

        if (!doWordsRhyme) {
          console.error('❌ Words do not rhyme:', firstWord, secondWord);
          return { success: false, firstWord: '', secondWord: '' };
        }
      } catch (err) {
        console.error('⚠️ Rhyme verification failed, assuming words rhyme:', err);
        // If verification fails, we'll still assume the words rhyme
        doWordsRhyme = true;
      }
    }

    return { success: true, firstWord, secondWord };
  }

  /**
   * Use a fallback pair when generation fails
   */
  private useFallbackPair(language: Language): GenerationResult {
    // Select a random fallback pair for the given language
    const fallbacks = this.FALLBACK_PAIRS[language] || this.FALLBACK_PAIRS['en'];
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    const [firstWord, secondWord] = fallbacks[randomIndex];

    console.log('✅ Using fallback rhyming pair:', firstWord, secondWord);

    // Generate rhyme grid HTML
    const rhymeGridHtml = this.generateRhymeGridHtml(firstWord, secondWord);

    return {
      content: '',
      variables: {
        rhymeGrid: rhymeGridHtml
      },
      answer: `${firstWord}-${secondWord}`
    };
  }

  /**
   * Generate the HTML for the rhyme grid
   */
  private generateRhymeGridHtml(firstWord: string, secondWord: string): string {
    // Randomly determine which word to show and which to hide
    const showFirstWord = Math.random() > 0.5;

    let html = '';

    if (showFirstWord) {
      // First word is shown, second is hidden
      html = `
        <div class="rhyme-card">
          <p class="rhyme-text">${firstWord}</p>
        </div>
        <div class="rhyme-card missing">
          <p class="rhyme-text">?</p>
        </div>
      `;
    } else {
      // Second word is shown, first is hidden
      html = `
        <div class="rhyme-card missing">
          <p class="rhyme-text">?</p>
        </div>
        <div class="rhyme-card">
          <p class="rhyme-text">${secondWord}</p>
        </div>
      `;
    }

    return html;
  }

  async validateContent(content: string, language: Language): Promise<boolean> {
    // Trim any whitespace and punctuation
    const cleanContent = content.trim().replace(/[.,!?;:'"()]/g, '');

    // Check if content is a single word
    const words = cleanContent.split(/\s+/);
    if (words.length !== 1 || cleanContent.length === 0) {
      return false;
    }

    // Check if content matches language character set
    const langConfig = LANGUAGE_CONFIG[language];
    return langConfig.characterSet.test(cleanContent);
  }

  // Override solution generation for rhyme-specific formatting
  async generateSolution(context: GenerationContext & { answer: string }): Promise<GenerationResult> {
    try {
      // Parse the answer to get both rhyming words
      const [firstWord, secondWord] = context.answer.split('-');

      const solution = `
## Rhyming Pair

The correct rhyming pair is: **${firstWord}** and **${secondWord}**

## Explanation

These words share the same ending sound pattern, creating a perfect rhyme. The challenge is to recognize this phonetic similarity and identify the missing word in the pair.

## Examples of Similar Rhymes

Other words that rhyme with this pair include:
${await this.generateAdditionalRhymes(firstWord, context.language)}
`;

      return { content: solution };
    } catch (err) {
      console.error('Error generating solution:', err);
      // Fall back to the base implementation if our custom solution fails
      return super.generateSolution(context);
    }
  }

  /**
   * Generate additional examples of words that rhyme with the given word
   */
  private async generateAdditionalRhymes(word: string, language: Language): Promise<string> {
    try {
      const additionalRhymes = await this.generateOpenAIResponse(
        `Generate 3-5 common words in ${LANGUAGE_CONFIG[language].name} that rhyme with "${word}".
        
        Rules:
        - Return the words as a simple comma-separated list
        - No explanations or additional text
        - Only include words, no punctuation other than commas
        - Must be appropriate for all audiences`,
        `Generate words that rhyme with ${word}`,
        {
          maxTokens: 50,
          temperature: 0.7
        }
      );

      return additionalRhymes;
    } catch (err) {
      console.error('Error generating additional rhymes:', err);
      return 'Unable to generate additional rhyming examples.';
    }
  }

  // Override hint generation for more specific rhyming hints
  async generateHint(context: GenerationContext): Promise<GenerationResult> {
    const content = await this.generateOpenAIResponse(
      `Create a clever hint in ${LANGUAGE_CONFIG[context.language].name} that:
      - Suggests both rhyming words without directly stating them
      - Uses wordplay or creative language
      - Is a single elegant sentence
      - Makes the connection challenging but solvable
      - Uses appropriate punctuation for ${LANGUAGE_CONFIG[context.language].name}`,
      context.content || 'Generate a hint for rhyming words',
      {
        maxTokens: 100,
        temperature: 0.8
      }
    );

    return { content };
  }
} 