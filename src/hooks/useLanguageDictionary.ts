import { Language } from '@/lib/types';
import { useDictionary } from './useDictionary';

/**
 * A hook that loads a dictionary based on the specified language
 * @param language The language code to load the dictionary for
 * @returns The dictionary data and related functions
 */
export function useLanguageDictionary(language: Language = 'en') {
    return useDictionary(language);
} 