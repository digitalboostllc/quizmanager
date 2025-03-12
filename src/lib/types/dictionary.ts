export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl';

export type WordDifficulty = 'easy' | 'medium' | 'hard';
export type WordType = 'NOUN' | 'VERB' | 'ADJECTIVE' | 'COMMON';

export interface GenerationContext {
  content: string;
  language: Language;
  quizType: QuizType;
  options?: {
    wordOnly?: boolean;
    theme?: string;
    [key: string]: string | number | boolean | unknown[] | Record<string, unknown> | undefined;
  };
}

export interface DictionaryWord {
  word: string;
  type: WordType;
  isUsed?: boolean;
  lastUsedAt?: string;
}

export interface DictionaryMetadata {
  language: Language;
  wordCount: number;
  lastUpdated: string;
  version: string;
}

export interface LanguageDictionary {
  metadata: DictionaryMetadata;
  words: {
    easy: DictionaryWord[];
    medium: DictionaryWord[];
    hard: DictionaryWord[];
  };
}

export interface DictionaryStats {
  totalWords: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  byType: {
    [key in WordType]: number;
  };
} 