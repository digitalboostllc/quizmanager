import { QuizType as PrismaQuizType } from '@prisma/client';

declare global {
  type QuizType = PrismaQuizType;
  
  // Ensure TypeScript knows about all possible QuizType values
  interface QuizTypeEnum {
    WORDLE: 'WORDLE';
    NUMBER_SEQUENCE: 'NUMBER_SEQUENCE';
    RHYME_TIME: 'RHYME_TIME';
    CONCEPT_CONNECTION: 'CONCEPT_CONNECTION';
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      OPENAI_API_KEY: string;
    }
  }
}

export {}; 