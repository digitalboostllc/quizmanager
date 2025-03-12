import { GenerationContext, PipelineStep } from './GenerationPipeline';
import { NumberFormatter } from '@/services/i18n/formatters/NumberFormatter';
import { LanguageService } from '@/services/i18n/LanguageService';
import type { Language } from '@/lib/types';

export class FormattingStep implements PipelineStep {
  private numberFormatter: NumberFormatter;
  private languageService: LanguageService;
  private title: string = '';
  private subtitle: string = '';
  private brandingText: string = '';

  constructor() {
    this.numberFormatter = NumberFormatter.getInstance();
    this.languageService = LanguageService.getInstance();
  }

  public async execute(context: GenerationContext): Promise<GenerationContext> {
    if (!context.content) {
      return context;
    }

    let formattedContent = context.content;

    switch (context.quizType) {
      case 'WORDLE':
        formattedContent = this.formatWordleContent(formattedContent);
        break;
      case 'NUMBER_SEQUENCE':
        formattedContent = this.formatNumberSequence(formattedContent, context.language as Language);
        break;
      case 'RHYME_TIME':
        formattedContent = this.formatRhymeTime(formattedContent);
        break;
      case 'CONCEPT_CONNECTION':
        formattedContent = this.formatConceptConnection(formattedContent);
        break;
    }

    return {
      ...context,
      content: formattedContent
    };
  }

  private formatWordleContent(content: string): string {
    return content.toUpperCase();
  }

  private formatNumberSequence(content: string, language: Language): string {
    const numbers = content.split(',').map(n => n.trim());
    const formattedNumbers = numbers.map(num => {
      const parsed = parseFloat(num);
      return this.numberFormatter.formatNumber(parsed, language);
    });
    return formattedNumbers.join(', ');
  }

  private formatRhymeTime(content: string): string {
    const [word1, word2] = content.split('-').map(w => w.trim());
    return `${word1.toUpperCase()} - ${word2.toUpperCase()}`;
  }

  private formatConceptConnection(content: string): string {
    const concepts = content.split(',').map(c => c.trim().toUpperCase());
    const conceptElements = concepts.map(concept => 
      `<div class="concept-card"><span class="concept-text">${concept}</span></div>`
    );
    return conceptElements.join('\n');
  }

  async formatTitle(): Promise<string> {
    return this.title;
  }

  async formatSubtitle(): Promise<string> {
    return this.subtitle;
  }

  async formatBrandingText(): Promise<string> {
    return this.brandingText;
  }
} 