import { GenerationContext, GenerationResult, ContentProcessor } from '../pipeline/GenerationPipeline';
import { ValidationError } from '@/services/api/errors/ApiError';
import { LanguageValidator } from '@/services/i18n/validators/LanguageValidator';
import { QUIZ_CONFIG } from '@/lib/config';

export class ConceptConnectionProcessor implements ContentProcessor {
  private languageValidator: LanguageValidator;

  constructor() {
    this.languageValidator = LanguageValidator.getInstance();
  }

  public async process(context: GenerationContext): Promise<GenerationResult> {
    // Parse concepts from HTML structure
    const conceptMatches = context.content.match(/<span class="concept-text">(.*?)<\/span>/g);
    if (!conceptMatches || conceptMatches.length !== QUIZ_CONFIG.CONCEPT_CONNECTION.CONCEPTS_COUNT) {
      throw new ValidationError(
        `Must provide exactly ${QUIZ_CONFIG.CONCEPT_CONNECTION.CONCEPTS_COUNT} concepts`
      );
    }

    // Extract and normalize concepts
    const concepts = conceptMatches.map(match => {
      return match.replace(/<span class="concept-text">|<\/span>/g, '').trim().toUpperCase();
    });

    // Validate unique concepts
    const uniqueConcepts = new Set(concepts);
    if (uniqueConcepts.size !== QUIZ_CONFIG.CONCEPT_CONNECTION.CONCEPTS_COUNT) {
      throw new ValidationError('All concepts must be unique');
    }

    // Validate each concept
    for (const concept of concepts) {
      const result = this.languageValidator.validateContent(concept, context.language);
      if (!result.isValid) {
        throw new ValidationError(
          `Invalid concept for ${context.language}: ${concept}`,
          result.errors
        );
      }
    }

    // Create HTML structure
    const conceptsHtml = `
      <div class="concepts-grid">
        ${concepts.map(concept => `
          <div class="concept-card">
            <span class="concept-text">${concept}</span>
          </div>
        `).join('\n')}
      </div>
    `;

    // Get theme from options if provided
    const theme = context.options?.theme;
    if (!theme) {
      throw new ValidationError('Theme must be provided in options');
    }

    return {
      content: conceptsHtml,
      answer: theme,
      metadata: {
        concepts,
        theme
      }
    };
  }
} 