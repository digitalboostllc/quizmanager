// OpenAI Types
export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Dictionary Types
export interface WordValidationOptions {
  checkDictionary?: boolean;
  customCharacterSet?: RegExp;
}

export interface DictionaryResponse {
  word: string;
  language: string;
  found: boolean;
  details?: string;
}

// Facebook Types
export interface FacebookPostOptions {
  message?: string;
  imageUrl: string;
  scheduledTime?: string;
}

export interface FacebookPostResponse {
  id: string;
  postUrl: string;
}

// Common Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface GenerationContext {
  content: string;
  language: string;
  options?: Record<string, unknown>;
} 