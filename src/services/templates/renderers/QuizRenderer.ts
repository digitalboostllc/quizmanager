import { Template } from '@/lib/types';
import { ValidationError } from '@/services/api/errors/ApiError';
import { QuizType } from '@prisma/client';

export interface RenderContext {
  template: Template;
  variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
}

export interface RenderResult {
  html: string;
  metadata?: Record<string, string>;
}

export class QuizRenderer {
  private static instance: QuizRenderer;
  
  private constructor() {}

  public static getInstance(): QuizRenderer {
    if (!QuizRenderer.instance) {
      QuizRenderer.instance = new QuizRenderer();
    }
    return QuizRenderer.instance;
  }

  public render(context: RenderContext): RenderResult {
    const { template, variables } = context;

    // Process template variables
    let processedHtml = template.html;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      let replacement = "";

      if (Array.isArray(value)) {
        replacement = value.join('\n');
      } else if (typeof value === 'object' && value !== null) {
        replacement = JSON.stringify(value);
      } else {
        replacement = String(value || '');
      }

      processedHtml = processedHtml.replace(regex, replacement);
    });

    // Add CSS to HTML
    const fullHtml = `
      <style>${template.css || ''}</style>
      ${processedHtml}
    `;

    return {
      html: fullHtml,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        quizType: template.quizType
      }
    };
  }

  private processVariables(html: string, variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>): string {
    let processed = html;
    
    // Replace all variable placeholders
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      if (processed.includes(placeholder)) {
        processed = processed.replace(
          new RegExp(placeholder, 'g'),
          this.sanitizeHtml(String(value))
        );
      }
    }

    // Check for any remaining placeholders
    const remainingPlaceholders = processed.match(/{{.*?}}/g);
    if (remainingPlaceholders) {
      throw new ValidationError(
        `Unresolved template variables: ${remainingPlaceholders.join(', ')}`
      );
    }

    return processed;
  }

  private processCss(css: string): string {
    // Add unique prefix to all selectors to prevent conflicts
    const prefix = `quiz-${Date.now()}`;
    return css.replace(
      /(^|\}|\{|\s)([a-zA-Z_-][a-zA-Z0-9_-]*)/g,
      `$1.${prefix}$2`
    );
  }

  private sanitizeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private applyQuizTypeProcessing(html: string, quizType: QuizType): string {
    switch (quizType) {
      case 'WORDLE':
        return this.processWordleHtml(html);
      case 'NUMBER_SEQUENCE':
        return this.processSequenceHtml(html);
      case 'RHYME_TIME':
        return this.processRhymeHtml(html);
      case 'CONCEPT_CONNECTION':
        return this.processConceptHtml(html);
      default:
        return html;
    }
  }

  private processWordleHtml(html: string): string {
    // Add Wordle-specific classes and attributes
    return html
      .replace(
        /<div class="letter-box/g,
        '<div class="letter-box wordle-letter'
      )
      .replace(
        /<div class="word-grid-container/g,
        '<div class="word-grid-container wordle-grid'
      );
  }

  private processSequenceHtml(html: string): string {
    // Add sequence-specific classes and attributes
    return html
      .replace(
        /<div class="sequence-container/g,
        '<div class="sequence-container number-sequence'
      );
  }

  private processRhymeHtml(html: string): string {
    // Add rhyme-specific classes and attributes
    return html
      .replace(
        /<div class="rhyme-container/g,
        '<div class="rhyme-container rhyme-time'
      );
  }

  private processConceptHtml(html: string): string {
    // Add concept-specific classes and attributes
    return html
      .replace(
        /<div class="concepts-grid/g,
        '<div class="concepts-grid concept-connection'
      )
      .replace(
        /<div class="concept-card/g,
        '<div class="concept-card draggable"'
      );
  }
} 