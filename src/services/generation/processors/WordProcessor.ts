import { GenerationContext, GenerationResult } from '../pipeline/GenerationPipeline';
import { WordleStrategy } from '@/services/strategies';

export class WordProcessor {
  private wordleStrategy: WordleStrategy;

  constructor() {
    this.wordleStrategy = new WordleStrategy();
  }

  public async process(context: GenerationContext): Promise<GenerationResult> {
    try {
      const result = await this.wordleStrategy.process(context);
      return result;
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Failed to process word'
      };
    }
  }

  public async processWordGrid(words: string[]): Promise<string[][]> {
    return words.map(word => word.split(''));
  }

  public async processWordAttempts(attempts: string[]): Promise<string[][]> {
    return attempts.map(attempt => attempt.split(''));
  }
} 