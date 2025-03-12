'use client';

import { useToast } from '@/components/ui/use-toast';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';

interface WordUsage {
    id: string;
    word: string;
    language: string;
    isUsed: boolean;
    usedAt: string;
}

export function useWordUsage(language = 'fr') {
    const [usedWords, setUsedWords] = useState<WordUsage[]>([]);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();

    // Fetch all used words for the current user
    const fetchUsedWords = useCallback(async () => {
        if (!isAuthenticated) {
            // When not authenticated, use empty array as fallback
            setUsedWords([]);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/dictionary/word-usage?language=${language}`);
            if (!response.ok) {
                if (response.status === 401) {
                    // Authentication has been disabled temporarily, use empty array
                    console.log('Authentication is temporarily disabled, using empty word usage data');
                    setUsedWords([]);
                    return;
                }
                throw new Error('Failed to fetch word usage data');
            }
            const data = await response.json();
            setUsedWords(data);
        } catch (error) {
            console.error('Error fetching word usage:', error);
            // Don't show toast for authentication errors
            if (error instanceof Error && !error.message.includes('Unauthorized')) {
                toast({
                    title: 'Error',
                    description: 'Failed to load word usage data',
                    variant: 'destructive',
                });
            }
            // Fallback to empty array
            setUsedWords([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, language, toast]);

    // Check if a word is marked as used
    const isWordUsed = useCallback(async (word: string) => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch(`/api/dictionary/word-usage?word=${encodeURIComponent(word)}&language=${language}`);
            if (!response.ok) {
                if (response.status === 401) {
                    // Authentication is disabled, assume not used
                    return false;
                }
                throw new Error('Failed to check word usage');
            }
            const data = await response.json();
            return data.isUsed || false;
        } catch (error) {
            console.error('Error checking word usage:', error);
            return false;
        }
    }, [isAuthenticated, language]);

    // Mark a word as used
    const markWordAsUsed = useCallback(async (word: string) => {
        if (!isAuthenticated) return false;

        try {
            const response = await fetch('/api/dictionary/word-usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word, language }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark word as used');
            }

            await fetchUsedWords(); // Refresh the list
            return true;
        } catch (error) {
            console.error('Error marking word as used:', error);
            toast({
                title: 'Error',
                description: 'Failed to update word usage status',
                variant: 'destructive',
            });
            return false;
        }
    }, [isAuthenticated, language, fetchUsedWords, toast]);

    // Toggle a word's usage status
    const toggleWordUsage = useCallback(async (word: string, isUsed: boolean) => {
        if (!isAuthenticated) {
            console.log('Authentication is disabled, cannot toggle word usage');
            return null;
        }

        try {
            const response = await fetch('/api/dictionary/word-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, language, isUsed }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Authentication is disabled, cannot toggle word usage');
                    return null;
                }
                throw new Error('Failed to update word usage');
            }

            const updatedUsage = await response.json();

            // Update the local state
            setUsedWords(prev => {
                // If marking as used, add to list
                if (isUsed) {
                    // Check if already in list
                    const exists = prev.some(w => w.word === word && w.language === language);
                    if (exists) {
                        return prev.map(w =>
                            w.word === word && w.language === language
                                ? { ...w, isUsed: true, usedAt: new Date().toISOString() }
                                : w
                        );
                    }
                    // Add new entry
                    return [...prev, updatedUsage];
                }
                // If marking as unused, remove from list or update
                else {
                    return prev.filter(w => !(w.word === word && w.language === language));
                }
            });

            return updatedUsage;
        } catch (error) {
            console.error('Error toggling word usage:', error);
            return null;
        }
    }, [isAuthenticated, language]);

    // Reset all words for the current user
    const resetAllWordUsage = useCallback(async () => {
        if (!isAuthenticated) {
            console.log('Authentication is disabled, cannot reset word usage');
            setUsedWords([]);
            return [];
        }

        try {
            const response = await fetch('/api/dictionary/word-usage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Authentication is disabled, using empty word usage data');
                    setUsedWords([]);
                    return [];
                }
                throw new Error('Failed to reset word usage');
            }

            // After reset, our used words list should be empty
            setUsedWords([]);
            return [];
        } catch (error) {
            console.error('Error resetting word usage:', error);
            toast({
                title: 'Error',
                description: 'Failed to reset word usage',
                variant: 'destructive',
            });
            return [];
        }
    }, [isAuthenticated, language, toast]);

    return {
        usedWords,
        loading,
        fetchUsedWords,
        isWordUsed,
        markWordAsUsed,
        toggleWordUsage,
        resetAllWordUsage,
    };
} 