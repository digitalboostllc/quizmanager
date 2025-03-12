import { GenerationContext, GenerationResult, ContentProcessor } from '../pipeline/GenerationPipeline';
import { ValidationError } from '@/services/api/errors/ApiError';
import { LanguageValidator } from '@/services/i18n/validators/LanguageValidator';

export class RhymeTimeProcessor implements ContentProcessor {
  private languageValidator: LanguageValidator;

  constructor() {
    this.languageValidator = LanguageValidator.getInstance();
  }

  public async process(context: GenerationContext): Promise<GenerationResult> {
    // Parse and validate words
    const [firstWord, secondWord] = context.content
      .split('-')
      .map(word => word.trim().toUpperCase());

    // Validate both words exist
    if (!firstWord || !secondWord) {
      throw new ValidationError('Both words must be provided');
    }

    // Validate each word
    const firstWordResult = this.languageValidator.validateContent(firstWord, context.language);
    const secondWordResult = this.languageValidator.validateContent(secondWord, context.language);

    if (!firstWordResult.isValid) {
      throw new ValidationError(
        `Invalid first word for ${context.language}`,
        firstWordResult.errors
      );
    }

    if (!secondWordResult.isValid) {
      throw new ValidationError(
        `Invalid second word for ${context.language}`,
        secondWordResult.errors
      );
    }

    // Verify words are different
    if (firstWord.toLowerCase() === secondWord.toLowerCase()) {
      throw new ValidationError('Rhyming words must be different');
    }

    // Create HTML structure
    const rhymeHtml = `
      <div class="rhyme-container">
        <div class="rhyme-pair">
          <div class="rhyme-word first-word">${firstWord}</div>
          <div class="rhyme-separator">-</div>
          <div class="rhyme-word second-word">${secondWord}</div>
        </div>
      </div>
    `;

    return {
      content: rhymeHtml,
      answer: `${firstWord}-${secondWord}`,
      metadata: {
        firstWord,
        secondWord
      }
    };
  }
} 