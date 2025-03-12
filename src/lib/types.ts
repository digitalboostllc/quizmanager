import { QuizType as PrismaQuizType } from '@prisma/client';

export type QuizStatus = 'DRAFT' | 'READY' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

// Re-export the QuizType from Prisma directly
export type { PrismaQuizType as QuizType };

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl';

export const LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
} as const;

export interface Quiz {
  id: string;
  title: string;
  answer: string;
  solution: string | null;
  variables: QuizVariables | null;
  templateId: string;
  template: Template;
  imageUrl: string | null;
  fbPostId: string | null;
  status: QuizStatus;
  language: Language;
  createdAt: string;
  updatedAt: string;
  scheduledPost?: ScheduledPost | null;
}

export interface Template {
  id: string;
  name: string;
  html: string;
  css: string | null;
  variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
  quizType: QuizType;
  createdAt: Date;
  updatedAt: Date;
  quizzes?: Quiz[];
  imageUrl?: string | null;
  description?: string | null;
}

export type CreateQuizInput = {
  templateId: string;
  title: string;
  answer: string;
  solution?: string;
  language: string;
  variables?: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
  scheduledFor?: string;
};

export interface CreateTemplateInput {
  name: string;
  html: string;
  css?: string;
  variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
  quizType: QuizType;
}

export interface UpdateQuizInput extends Partial<CreateQuizInput> {
  id: string;
  status?: QuizStatus;
  imageUrl?: string;
  fbPostId?: string;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

export interface QuizVariables {
  title?: string;
  subtitle?: string;
  brandingText?: string;
  hints?: string[];
  wordGrid?: string;
  sequence?: string;
  firstWord?: string;
  secondWord?: string;
  conceptsGrid?: string;
  theme?: string;
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

export interface ScheduledPost {
  id: string;
  quizId: string;
  scheduledAt: string;
  publishedAt: string | null;
  status: PostStatus;
  fbPostId: string | null;
  caption: string | null;
  errorMessage: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'; 