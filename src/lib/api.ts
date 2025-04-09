'use client';

// Types for fetch options
export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;

/**
 * Enhanced fetch API with retry, timeout, and error handling
 * Updated for Next.js 15 compatibility
 */
export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const {
    method = 'GET',
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let attemptCount = 0;
  const url = endpoint.startsWith('http') ? endpoint : `${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`;

  // Process the body if it's provided
  let processedOptions = { ...fetchOptions };
  if (options.body && typeof options.body === 'object') {
    processedOptions.body = JSON.stringify(options.body);
  }

  // Add headers if not provided
  if (!processedOptions.headers) {
    processedOptions.headers = {
      'Content-Type': 'application/json',
    };
  }

  while (attemptCount <= retries) {
    attemptCount++;

    try {
      // Setup timeout for the fetch request
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      processedOptions.signal = controller.signal;

      // Make the actual fetch request
      const response = await fetch(url, {
        method,
        ...processedOptions,
      });

      // Clear the timeout
      clearTimeout(id);

      console.log(`API Response: ${response.status} ${response.statusText} for ${url}`);

      // Check if the response is a 401 Unauthorized
      if (response.status === 401) {
        // Store the current URL to redirect back after login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          sessionStorage.setItem('redirectUrl', currentPath);

          // Redirect to login page
          window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
        }

        throw new Error('Unauthorized. Please log in again.');
      }

      let data = null;
      try {
        data = await response.json();
        console.log(`API Raw JSON Response for ${url}:`, data);
      } catch (e) {
        // If parsing fails, it might be an empty response
        console.error(`Error parsing JSON response from ${url}:`, e);
        if (response.ok) {
          return {} as T; // Return empty object for successful but empty responses
        }
      }

      // Handle success case
      if (response.ok) {
        // For backward compatibility, we add status and data properties to the returned data object
        if (data && typeof data === 'object') {
          Object.defineProperties(data, {
            status: { value: response.status, enumerable: false },
            data: { get: function () { return this; }, enumerable: false }
          });
        }
        return data as T;
      }

      // If we get here, it's an error response but not 401
      const errorMessage = data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;

      // Log the error details
      console.error(
        `API request failed (attempt ${attemptCount}/${retries + 1}):`,
        {
          endpoint,
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
        }
      );

      // Check if we should retry based on status code
      const shouldRetry = [408, 429, 500, 502, 503, 504].includes(response.status);

      if (shouldRetry && attemptCount <= retries) {
        console.log(`Retrying request to ${url} (${attemptCount}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attemptCount));
        continue;
      }

      // Create an error object that also has response-like properties for backward compatibility
      const error = new Error(errorMessage);
      Object.defineProperties(error, {
        status: { value: response.status, enumerable: true },
        data: { value: null, enumerable: true }
      });
      throw error;

    } catch (e: any) {
      // Make sure we clean up the timeout
      if (e.name === 'AbortError') {
        console.error(`Request to ${url} timed out after ${timeout}ms.`);

        if (attemptCount <= retries) {
          console.log(`Retrying request to ${url} (${attemptCount}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attemptCount));
          continue;
        }

        const error = new Error(`Request timed out after ${timeout}ms`);
        Object.defineProperties(error, {
          status: { value: 408, enumerable: true },
          data: { value: null, enumerable: true }
        });
        throw error;
      }

      console.error(`Unexpected error fetching ${url}:`, e);

      if (attemptCount <= retries) {
        console.log(`Retrying request to ${url} (${attemptCount}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attemptCount));
        continue;
      }

      // Add response-like properties to the error for backward compatibility
      if (!e.status) {
        Object.defineProperties(e, {
          status: { value: 500, enumerable: true, writable: false },
          data: { value: null, enumerable: true, writable: false }
        });
      }
      throw e;
    }
  }

  // This should generally not be reached due to the throw statements above
  const error = new Error(`Failed to fetch data from ${endpoint} after ${retries} retries`);
  Object.defineProperties(error, {
    status: { value: 500, enumerable: true },
    data: { value: null, enumerable: true }
  });
  throw error;
} 