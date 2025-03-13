'use client';

import { useLoadingDelay } from '@/contexts/LoadingDelayContext';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  timeout?: number;
};

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;

/**
 * Enhanced fetch API with retry, timeout, and error handling
 */
export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    retries = DEFAULT_RETRIES,
    timeout = DEFAULT_TIMEOUT
  } = options;

  let lastError: Error | null = null;
  let attemptCount = 0;

  while (attemptCount <= retries) {
    attemptCount++;
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Performance measurements
      const startTime = performance.now();

      try {
        const response = await fetch(`/api/${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        // Clear the timeout since the request completed
        clearTimeout(timeoutId);

        // Measure performance
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log slow requests
        if (duration > 3000) {
          console.warn(`Slow API request (${Math.round(duration)}ms): ${method} /api/${endpoint}`);
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          // Handle case where response is not valid JSON
          throw new Error(`Invalid JSON response from server: ${response.statusText}`);
        }

        if (!response.ok) {
          // If the API returns an error object with a message, use that
          if (data && typeof data === 'object' && 'error' in data) {
            throw new Error(data.error);
          }
          // If there's a message field, use that
          if (data && typeof data === 'object' && 'message' in data) {
            throw new Error(data.message);
          }
          // Otherwise, throw a generic error
          throw new Error(`API request failed with status ${response.status}`);
        }

        return data as T;
      } catch (e) {
        // Make sure we clean up the timeout
        clearTimeout(timeoutId);
        throw e;
      }
    } catch (error: any) {
      lastError = error;

      // Log detailed error information
      console.error(`API request attempt ${attemptCount}/${retries + 1} failed:`, {
        endpoint,
        method,
        error: error.message,
        isAbortError: error.name === 'AbortError'
      });

      // Don't retry if we've reached the maximum attempts
      if (attemptCount > retries) {
        break;
      }

      // For network or timeout errors, wait before retrying
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.min(1000 * Math.pow(2, attemptCount - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other errors (like 500s), don't retry
        break;
      }
    }
  }

  // Format a user-friendly error message
  const errorMessage = lastError?.name === 'AbortError'
    ? `Request to ${endpoint} timed out after ${timeout / 1000}s. Please try again.`
    : `Failed to fetch data from ${endpoint}: ${lastError?.message || 'Unknown error'}`;

  throw new Error(errorMessage);
}

// This is a React hook that wraps fetchApi with loading delay functionality
export function useFetchWithDelay() {
  const { simulateLoading } = useLoadingDelay();

  const fetchWithDelay = async <T,>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    return await simulateLoading(fetchApi<T>(endpoint, options));
  };

  return { fetchWithDelay };
} 