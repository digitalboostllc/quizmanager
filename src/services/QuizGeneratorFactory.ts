import { QuizType } from '@prisma/client';
import {
  QuizGenerationStrategy,
  WordleStrategy,
  NumberSequenceStrategy,
  ConceptConnectionStrategy,
  RhymeTimeStrategy
} from '@/services/strategies';

export class QuizGeneratorFactory {
  private static instance: QuizGeneratorFactory;
  private strategies: Map<QuizType, QuizGenerationStrategy>;

  private constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies.set(QuizType.WORDLE, new WordleStrategy());
    this.strategies.set(QuizType.NUMBER_SEQUENCE, new NumberSequenceStrategy());
    this.strategies.set(QuizType.CONCEPT_CONNECTION, new ConceptConnectionStrategy());
    this.strategies.set(QuizType.RHYME_TIME, new RhymeTimeStrategy());
  }

  public static getInstance(): QuizGeneratorFactory {
    if (!QuizGeneratorFactory.instance) {
      QuizGeneratorFactory.instance = new QuizGeneratorFactory();
    }
    return QuizGeneratorFactory.instance;
  }

  public getStrategy(quizType: QuizType): QuizGenerationStrategy {
    const strategy = this.strategies.get(quizType);
    if (!strategy) {
      throw new Error(`No strategy found for quiz type: ${quizType}`);
    }
    return strategy;
  }
} 