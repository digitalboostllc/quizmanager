'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface LoadingDelayContextType {
    isLoadingDelayEnabled: boolean;
    isPauseEnabled: boolean;
    delayDuration: number;
    enableLoadingDelay: (duration?: number) => void;
    disableLoadingDelay: () => void;
    enablePauseLoading: () => void;
    disablePauseLoading: () => void;
    simulateLoading: <T>(promise: Promise<T>) => Promise<T>;
}

const LoadingDelayContext = createContext<LoadingDelayContextType | undefined>(undefined);

export function LoadingDelayProvider({ children }: { children: ReactNode }) {
    const [isLoadingDelayEnabled, setIsLoadingDelayEnabled] = useState(false);
    const [isPauseEnabled, setIsPauseEnabled] = useState(false);
    const [delayDuration, setDelayDuration] = useState(2000); // Default 2 seconds

    // Function to enable loading delay with optional custom duration
    const enableLoadingDelay = (duration?: number) => {
        if (duration !== undefined) {
            setDelayDuration(duration);
        }
        setIsLoadingDelayEnabled(true);
        // Store in localStorage so it persists between page refreshes
        localStorage.setItem('loading-delay-enabled', 'true');
        localStorage.setItem('loading-delay-duration', String(duration || delayDuration));
    };

    // Function to disable loading delay
    const disableLoadingDelay = () => {
        setIsLoadingDelayEnabled(false);
        localStorage.removeItem('loading-delay-enabled');
    };

    // Function to enable pause loading (indefinite loading state)
    const enablePauseLoading = () => {
        setIsPauseEnabled(true);
        localStorage.setItem('loading-pause-enabled', 'true');
    };

    // Function to disable pause loading
    const disablePauseLoading = () => {
        setIsPauseEnabled(false);
        localStorage.removeItem('loading-pause-enabled');
    };

    // Helper to add delay to any Promise
    const simulateLoading = async <T,>(promise: Promise<T>): Promise<T> => {
        console.log('simulateLoading called, isEnabled:', isLoadingDelayEnabled, 'isPauseEnabled:', isPauseEnabled, 'duration:', delayDuration);

        // If neither delay nor pause is enabled, return the original promise
        if (!isLoadingDelayEnabled && !isPauseEnabled) return promise;

        // If pause is enabled, create a promise that never resolves until pause is disabled
        if (isPauseEnabled) {
            console.log('Loading is paused. Waiting for user to resume...');

            // Wait for the original promise to resolve
            const result = await promise;

            // Create a promise that resolves when isPauseEnabled becomes false
            await new Promise<void>(resolve => {
                // Create an interval that checks if pause has been disabled
                const checkInterval = setInterval(() => {
                    if (!isPauseEnabled) {
                        clearInterval(checkInterval);
                        console.log('Loading resumed by user');
                        resolve();
                    }
                }, 100);
            });

            return result;
        }

        // Normal delay behavior
        console.log('Applying loading delay of', delayDuration, 'ms');

        // Wait for both the delay and the original promise
        const [result] = await Promise.all([
            promise,
            new Promise(resolve => setTimeout(resolve, delayDuration))
        ]);

        console.log('Loading delay completed');

        return result;
    };

    // Initialize from localStorage
    useEffect(() => {
        const isEnabled = localStorage.getItem('loading-delay-enabled') === 'true';
        const isPaused = localStorage.getItem('loading-pause-enabled') === 'true';
        const storedDuration = localStorage.getItem('loading-delay-duration');

        if (isEnabled) {
            setIsLoadingDelayEnabled(true);
            if (storedDuration) {
                setDelayDuration(Number(storedDuration));
            }
        }

        if (isPaused) {
            setIsPauseEnabled(true);
        }
    }, []);

    return (
        <LoadingDelayContext.Provider
            value={{
                isLoadingDelayEnabled,
                isPauseEnabled,
                delayDuration,
                enableLoadingDelay,
                disableLoadingDelay,
                enablePauseLoading,
                disablePauseLoading,
                simulateLoading
            }}
        >
            {children}
        </LoadingDelayContext.Provider>
    );
}

export function useLoadingDelay() {
    const context = useContext(LoadingDelayContext);
    if (context === undefined) {
        throw new Error('useLoadingDelay must be used within a LoadingDelayProvider');
    }
    return context;
} 