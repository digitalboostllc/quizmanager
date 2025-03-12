import { QuizType } from '@prisma/client';

export const APP_NAME = 'Quiz Generator';
export const APP_DESCRIPTION = 'Generate and manage engaging quiz content';

export const ROUTES = {
  HOME: '/',
  QUIZZES: '/quizzes',
  TEMPLATES: '/templates',
} as const;

export const API_ENDPOINTS = {
  QUIZZES: '/quizzes',
  TEMPLATES: '/templates',
  FACEBOOK: '/facebook',
} as const;

export const QUIZ_STATUSES = {
  DRAFT: 'DRAFT',
  READY: 'READY',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const;

// Export the QuizType enum directly
export { QuizType as TEMPLATE_TYPES };

export const IMAGE_SETTINGS = {
  DEFAULT_WIDTH: 1080,
  DEFAULT_HEIGHT: 1080,
  QUALITY: 0.95,
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB
} as const;

export const FACEBOOK_SETTINGS = {
  MAX_POST_LENGTH: 63206,
  IMAGE_ASPECT_RATIO: 1, // Square aspect ratio
  MAX_HASHTAGS: 30,
} as const;

export const ERROR_MESSAGES = {
  GENERAL: 'An error occurred. Please try again.',
  VALIDATION: 'Please check your input and try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;

export const LANGUAGE_CONFIG = {
  en: {
    characterSet: /^[a-zA-Z]+$/,
    name: 'English',
    questionMarkStyle: '?',
  },
  es: {
    characterSet: /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+$/,
    name: 'Spanish',
    questionMarkStyle: '¿?',
  },
  fr: {
    characterSet: /^[a-zàâäéèêëîïôöùûüÿçA-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ]+$/,
    name: 'French',
    questionMarkStyle: '?',
  },
  de: {
    characterSet: /^[a-zäöüßA-ZÄÖÜ]+$/,
    name: 'German',
    questionMarkStyle: '?',
  },
  it: {
    characterSet: /^[a-zàèéìíîòóùúA-ZÀÈÉÌÍÎÒÓÙÚ]+$/,
    name: 'Italian',
    questionMarkStyle: '?',
  },
  pt: {
    characterSet: /^[a-záâãàéêíóôõúüçA-ZÁÂÃÀÉÊÍÓÔÕÚÜÇ]+$/,
    name: 'Portuguese',
    questionMarkStyle: '?',
  },
  nl: {
    characterSet: /^[a-záéíóúA-ZÁÉÍÓÚ]+$/,
    name: 'Dutch',
    questionMarkStyle: '?',
  },
} as const;

export const API_CONFIG = {
  DICTIONARY_API: {
    BASE_URL: 'https://api.dictionaryapi.dev/api/v2/entries',
    TIMEOUT: 5000,
  },
  WIKTIONARY_API: {
    BASE_URL: 'https://fr.wiktionary.org/w/api.php',
    PARAMS: {
      action: 'query',
      format: 'json',
      titles: '',
      prop: 'revisions',
      rvprop: 'content',
      redirects: true,
      origin: '*'
    },
    TIMEOUT: 5000,
  },
  OPENAI: {
    DEFAULT_MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 2000,
    DEFAULT_TEMPERATURE: 0.7,
    TIMEOUT: 30000,
  },
} as const;

export const QUIZ_CONFIG = {
  WORDLE: {
    WORD_LENGTH: 5,
    MAX_ATTEMPTS: 6,
  },
  NUMBER_SEQUENCE: {
    SEQUENCE_LENGTH: 5,
    MIN_START_NUMBER: 1,
    MAX_START_NUMBER: 100,
  },
  CONCEPT_CONNECTION: {
    CONCEPTS_COUNT: 4,
  },
} as const;

export const config = {
  facebook: {
    accessToken: process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '',
    userId: process.env.FACEBOOK_USER_ID || '',
    pages: {
      queDuBien: process.env.FACEBOOK_PAGE_ID_QUE_DU_BIEN || '',
      astucesCuisine: process.env.FACEBOOK_PAGE_ID_ASTUCES_CUISINE || ''
    }
  }
}; 