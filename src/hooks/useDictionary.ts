'use client';

import { useToast } from '@/components/ui/use-toast';
import { useLoadingDelay } from '@/contexts/LoadingDelayContext';
import { useEffect, useState } from 'react';

export interface Word {
  word: string;
  type: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'COMMON';
  difficulty?: 'easy' | 'medium' | 'hard';
  isUsed?: boolean;
  lastUsedAt?: string;
}

interface Dictionary {
  metadata: {
    language: string;
    wordCount: number;
    lastUpdated: string;
    version: string;
  };
  words: {
    easy: Word[];
    medium: Word[];
    hard: Word[];
  };
}

export function useDictionary(language: string) {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { simulateLoading } = useLoadingDelay();

  useEffect(() => {
    async function loadDictionary() {
      try {
        setIsLoading(true);

        // Try to get from localStorage first
        const cacheKey = `dictionary-${language}`;
        const timeKey = `dictionary-${language}-time`;

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cacheTime = localStorage.getItem(timeKey);
          // Check if the cached version is still valid (24 hours)
          if (cacheTime && Date.now() - Number(cacheTime) < 24 * 60 * 60 * 1000) {
            // Simulate loading delay even for cached data
            await simulateLoading(Promise.resolve());
            setDictionary(JSON.parse(cached));
            setIsLoading(false);
            return;
          }
        }

        // Fetch the dictionary
        const response = await simulateLoading(
          fetch(`/api/dictionary?language=${language}`)
        );

        if (!response.ok) {
          throw new Error('Failed to load dictionary data');
        }
        const data = await response.json();

        // Update cache
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(timeKey, Date.now().toString());

        setDictionary(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to load ${language} dictionary`;
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDictionary();
  }, [language, toast, simulateLoading]);

  const getRandomWords = (difficulty: 'easy' | 'medium' | 'hard', count: number = 1) => {
    if (!dictionary) return [];
    const words = dictionary.words[difficulty];
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const getWordsByType = (type: Word['type'], difficulty?: 'easy' | 'medium' | 'hard') => {
    if (!dictionary) return [];
    const words = difficulty
      ? dictionary.words[difficulty]
      : [...dictionary.words.easy, ...dictionary.words.medium, ...dictionary.words.hard];
    return words.filter(word => word.type === type);
  };

  const searchWords = async (query: string) => {
    if (!dictionary) return [];
    if (!query.trim()) return [];

    try {
      // Simulate a loading delay for search
      await simulateLoading(Promise.resolve());

      const lowerQuery = query.toLowerCase();
      const results: Word[] = [];

      // Search through all difficulties
      Object.values(dictionary.words).forEach(wordList => {
        wordList.forEach(word => {
          if (word.word.toLowerCase().includes(lowerQuery)) {
            results.push(word);
          }
        });
      });

      return results;
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  };

  const toggleWordUsage = (word: Word) => {
    if (!dictionary) return;

    // Copy the current dictionary
    const dictionaryClone = JSON.parse(JSON.stringify(dictionary)) as Dictionary;

    // Find the word in the dictionary and toggle its usage
    let found = false;
    for (const difficultyLevel in dictionaryClone.words) {
      if (Object.prototype.hasOwnProperty.call(dictionaryClone.words, difficultyLevel)) {
        const difficultyWords = dictionaryClone.words[difficultyLevel as keyof typeof dictionaryClone.words];
        const wordIndex = difficultyWords.findIndex(w => w.word === word.word);

        if (wordIndex !== -1) {
          // Toggle the word's used status
          const currentIsUsed = difficultyWords[wordIndex].isUsed || false;
          difficultyWords[wordIndex] = {
            ...difficultyWords[wordIndex],
            isUsed: !currentIsUsed,
            lastUsedAt: !currentIsUsed ? new Date().toISOString() : undefined
          };
          found = true;
          break;
        }
      }
    }

    if (found) {
      // Update the state
      setDictionary(dictionaryClone);

      // Update the cache with the new usage status
      const cacheKey = `dictionary-${language}`;
      localStorage.setItem(cacheKey, JSON.stringify(dictionaryClone));

      toast({
        description: `Word "${word.word}" marked as ${word.isUsed ? 'available' : 'used'}`,
      });
    }
  };

  const resetAllWordUsage = () => {
    if (!dictionary) return;

    // Copy the current dictionary
    const dictionaryClone = JSON.parse(JSON.stringify(dictionary)) as Dictionary;

    // Reset all words to unused
    let resetCount = 0;
    for (const difficultyLevel in dictionaryClone.words) {
      if (Object.prototype.hasOwnProperty.call(dictionaryClone.words, difficultyLevel)) {
        const difficultyWords = dictionaryClone.words[difficultyLevel as keyof typeof dictionaryClone.words];

        // Reset each word in this difficulty level
        difficultyWords.forEach((word, index) => {
          if (word.isUsed) {
            difficultyWords[index] = {
              ...word,
              isUsed: false,
              lastUsedAt: undefined
            };
            resetCount++;
          }
        });
      }
    }

    // Update the state
    setDictionary(dictionaryClone);

    // Update the cache with the reset dictionary
    const cacheKey = `dictionary-${language}`;
    localStorage.setItem(cacheKey, JSON.stringify(dictionaryClone));

    toast({
      description: `Reset ${resetCount} words to available status`,
    });
  };

  return {
    dictionary,
    isLoading,
    error,
    getRandomWords,
    getWordsByType,
    searchWords,
    toggleWordUsage,
    resetAllWordUsage,
  };
} 