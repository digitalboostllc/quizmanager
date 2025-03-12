import { Language } from '@/lib/types';
import { GenerationContext, GenerationResult } from '../generation/pipeline/GenerationPipeline';

export interface QuizGenerationStrategy {
  generateContent(context: GenerationContext): Promise<GenerationResult>;
  generateHint(context: GenerationContext): Promise<GenerationResult>;
  generateTitle(context: GenerationContext): Promise<GenerationResult>;
  generateSubtitle(context: GenerationContext): Promise<GenerationResult>;
  generateBrandingText(context: GenerationContext): Promise<GenerationResult>;
  generateSolution(context: GenerationContext): Promise<GenerationResult>;
  validateContent(content: string, language: Language): Promise<boolean>;
}

export interface QuizGenerationResponse {
  content: string;
  answer?: string;
  theme?: string;
  error?: string;
} 