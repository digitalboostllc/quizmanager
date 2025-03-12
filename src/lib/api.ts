'use client';

import { useLoadingDelay } from '@/contexts/LoadingDelayContext';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

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
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// This is a React hook that wraps fetchApi with loading delay functionality
export function useFetchWithDelay() {
  const { simulateLoading } = useLoadingDelay();

  const fetchWithDelay = async <T,>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    return await simulateLoading(fetchApi<T>(endpoint, options));
  };

  return { fetchWithDelay };
} 