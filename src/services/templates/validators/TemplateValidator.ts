import { QuizType } from '@prisma/client';

export interface ValidateTemplateData {
  name: string;
  html: string;
  css: string | null;
  variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
  quizType: QuizType;
  imageUrl: string | null;
  description: string | null;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
}

export class TemplateValidator {
  private static instance: TemplateValidator;
  
  private constructor() {}

  public static getInstance(): TemplateValidator {
    if (!TemplateValidator.instance) {
      TemplateValidator.instance = new TemplateValidator();
    }
    return TemplateValidator.instance;
  }

  public async validate(data: ValidateTemplateData): Promise<TemplateValidationResult> {
    const errors: string[] = [];

    // Validate required fields
    if (!data.name) {
      errors.push('Name is required');
    }

    if (!data.html) {
      errors.push('HTML template is required');
    }

    if (!data.quizType) {
      errors.push('Quiz type is required');
    }

    // Validate variables
    if (!data.variables || typeof data.variables !== 'object') {
      errors.push('Variables must be an object');
    } else {
      // Check for required variables based on quiz type
      const requiredVariables = this.getRequiredVariables(data.quizType);
      for (const variable of requiredVariables) {
        if (!(variable in data.variables)) {
          errors.push(`Missing required variable: ${variable}`);
        }
      }
    }

    // Validate HTML template
    try {
      this.validateHtmlTemplate(data.html);
    } catch (err) {
      errors.push(`Invalid HTML template: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Validate CSS if present
    if (data.css) {
      try {
        this.validateCss(data.css);
      } catch (err) {
        errors.push(`Invalid CSS: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private getRequiredVariables(quizType: QuizType): string[] {
    switch (quizType) {
      case 'WORDLE':
        return ['wordGrid'];
      case 'NUMBER_SEQUENCE':
        return ['sequence'];
      case 'RHYME_TIME':
        return ['firstWord', 'secondWord'];
      case 'CONCEPT_CONNECTION':
        return ['conceptsGrid'];
      default:
        return [];
    }
  }

  private validateHtmlTemplate(html: string): void {
    // Basic HTML validation
    if (!html.includes('{{')) {
      throw new Error('Template must contain at least one variable placeholder');
    }

    // Check for balanced tags
    const openTags = html.match(/<[^/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]+>/g) || [];
    if (openTags.length !== closeTags.length) {
      throw new Error('HTML has unbalanced tags');
    }
  }

  private validateCss(css: string): void {
    // Basic CSS validation
    if (css.includes('<') || css.includes('>')) {
      throw new Error('CSS contains invalid characters');
    }

    // Check for balanced braces
    const openBraces = css.match(/{/g) || [];
    const closeBraces = css.match(/}/g) || [];
    if (openBraces.length !== closeBraces.length) {
      throw new Error('CSS has unbalanced braces');
    }
  }
} 