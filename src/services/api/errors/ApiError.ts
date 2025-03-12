export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class OpenAIError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'OPENAI_ERROR', details);
    this.name = 'OpenAIError';
  }
}

export class DictionaryError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'DICTIONARY_ERROR', details);
    this.name = 'DictionaryError';
  }
}

export class FacebookError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'FACEBOOK_ERROR', details);
    this.name = 'FacebookError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class QuizGenerationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'QUIZ_GENERATION_ERROR', details);
    this.name = 'QuizGenerationError';
  }
} 