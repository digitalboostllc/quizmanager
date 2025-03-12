import { GenerationContext, PipelineStep } from './GenerationPipeline';
import { ValidationError } from '@/services/api/errors/ApiError';
import { LanguageValidator } from '@/services/i18n/validators/LanguageValidator';
import { LANGUAGE_CONFIG } from '@/lib/config';

export class ValidationStep implements PipelineStep {
  private languageValidator: LanguageValidator;

  constructor() {
    this.languageValidator = LanguageValidator.getInstance();
  }

  public async execute(context: GenerationContext): Promise<GenerationContext> {
    // Validate language
    if (!LANGUAGE_CONFIG[context.language]) {
      throw new ValidationError(`Unsupported language: ${context.language}`);
    }

    // Validate content based on quiz type
    switch (context.quizType) {
      case 'WORDLE':
        await this.validateWordleContent(context);
        break;
      case 'NUMBER_SEQUENCE':
        await this.validateNumberSequence(context);
        break;
      case 'RHYME_TIME':
        await this.validateRhymeTime(context);
        break;
      case 'CONCEPT_CONNECTION':
        await this.validateConceptConnection(context);
        break;
      default:
        throw new ValidationError(`Unsupported quiz type: ${context.quizType}`);
    }

    return context;
  }

  private async validateWordleContent(context: GenerationContext): Promise<void> {
    if (!context.content) {
      throw new ValidationError('Content is required for Wordle quiz');
    }

    const result = this.languageValidator.validateWordleWord(context.content, context.language);
    if (!result.isValid) {
      throw new ValidationError(
        `Invalid Wordle word for ${context.language}`,
        result.errors
      );
    }
  }

  private async validateNumberSequence(context: GenerationContext): Promise<void> {
    if (!context.content) {
      throw new ValidationError('Content is required for Number Sequence quiz');
    }

    const result = this.languageValidator.validateNumberSequence(context.content, context.language);
    if (!result.isValid) {
      throw new ValidationError(
        `Invalid number sequence for ${context.language}`,
        result.errors
      );
    }
  }

  private async validateRhymeTime(context: GenerationContext): Promise<void> {
    if (!context.content) {
      throw new ValidationError('Content is required for Rhyme Time quiz');
    }

    const words = context.content.split('-').map(w => w.trim());
    if (words.length !== 2) {
      throw new ValidationError('Rhyme Time must contain exactly two words');
    }

    for (const word of words) {
      const result = this.languageValidator.validateContent(word, context.language);
      if (!result.isValid) {
        throw new ValidationError(
          `Invalid word in rhyme pair for ${context.language}`,
          result.errors
        );
      }
    }
  }

  private async validateConceptConnection(context: GenerationContext): Promise<void> {
    if (!context.content) {
      throw new ValidationError('Content is required for Concept Connection quiz');
    }

    const concepts = context.content.split(',').map(c => c.trim());
    if (concepts.length !== 4) {
      throw new ValidationError('Concept Connection must contain exactly four concepts');
    }

    for (const concept of concepts) {
      const result = this.languageValidator.validateContent(concept, context.language);
      if (!result.isValid) {
        throw new ValidationError(
          `Invalid concept for ${context.language}`,
          result.errors
        );
      }
    }
  }
} 