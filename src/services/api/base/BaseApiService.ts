import { ApiError } from '../errors/ApiError';
import type { ApiResponse } from '../types';

export abstract class BaseApiService {
  protected constructor() {
    this.validateEnvironment();
  }

  protected abstract validateEnvironment(): void;

  protected async handleRequest<T>(
    requestFn: () => Promise<T>,
    errorMessage: string = 'API request failed'
  ): Promise<ApiResponse<T>> {
    try {
      const data = await requestFn();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error(`${this.constructor.name} Error:`, error);
      
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
          details: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }
      };
    }
  }

  protected validateConfig<T extends Record<string, unknown>>(
    config: T,
    requiredKeys: Array<keyof T>
  ): void {
    for (const key of requiredKeys) {
      if (config[key] == null) {
        throw new ApiError(
          `Missing required configuration: ${String(key)}`,
          500,
          'CONFIG_ERROR'
        );
      }
    }
  }

  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000,
    onRetry?: (error: unknown, attempt: number) => void
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          onRetry?.(error, attempt);
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
          continue;
        }
        
        throw error;
      }
    }

    // This should never happen due to the throw above, but TypeScript needs it
    throw lastError;
  }
} 