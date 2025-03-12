import { Language } from '@/lib/types';
import { QuizType } from '@prisma/client';
import { ValidationStep } from './ValidationStep';
import { FormattingStep } from './FormattingStep';
import { SequenceProcessor, RhymeTimeProcessor, ConceptConnectionProcessor } from '../processors';
import { ValidationError } from '@/services/api/errors/ApiError';
import { WordleStrategy } from '@/services/strategies';

export interface GenerationContext {
  content: string;
  language: Language;
  quizType: QuizType;
  templateId?: string;
  options?: Record<string, unknown>;
}

export interface GenerationResult {
  content?: string;
  answer?: string;
  error?: string;
  metadata?: Record<string, string>;
  variables?: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
}

export interface ContentProcessor {
  process(context: GenerationContext): Promise<GenerationResult>;
}

export interface PipelineStep {
  execute(context: GenerationContext): Promise<GenerationContext>;
}

export class GenerationPipeline {
  private static instance: GenerationPipeline;
  private steps: PipelineStep[] = [];
  private processors: Map<QuizType, ContentProcessor> = new Map();

  private constructor() {
    this.initializeSteps();
    this.initializeProcessors();
  }

  private initializeSteps(): void {
    this.steps = [
      new ValidationStep(),
      new FormattingStep()
    ];
  }

  private initializeProcessors(): void {
    this.processors = new Map();
    this.processors.set('WORDLE', new WordleStrategy());
    this.processors.set('NUMBER_SEQUENCE', new SequenceProcessor());
    this.processors.set('RHYME_TIME', new RhymeTimeProcessor());
    this.processors.set('CONCEPT_CONNECTION', new ConceptConnectionProcessor());
  }

  public static getInstance(): GenerationPipeline {
    if (!GenerationPipeline.instance) {
      GenerationPipeline.instance = new GenerationPipeline();
    }
    return GenerationPipeline.instance;
  }

  public async process(context: GenerationContext): Promise<GenerationResult> {
    try {
      // Ensure content is properly initialized
      const initialContext = {
        ...context,
        content: context.content || ''
      };

      // Execute each pipeline step
      let currentContext = initialContext;
      for (const step of this.steps) {
        currentContext = await step.execute(currentContext);
      }

      // Get appropriate processor for quiz type
      const processor = this.processors.get(context.quizType);
      if (!processor) {
        throw new ValidationError(`No processor found for quiz type: ${context.quizType}`);
      }

      // Process the content
      return await processor.process(currentContext);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Failed to process generation pipeline', error);
    }
  }

  public addStep(step: PipelineStep): void {
    this.steps.push(step);
  }

  public clearSteps(): void {
    this.steps = [];
  }

  public async execute(context: GenerationContext): Promise<GenerationContext> {
    let currentContext = { ...context };

    for (const step of this.steps) {
      currentContext = await step.execute(currentContext);
    }

    return currentContext;
  }
} 