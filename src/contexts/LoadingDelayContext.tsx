"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Define the context type
interface LoadingDelayContextType {
    simulateLoading: <T>(promise: Promise<T>) => Promise<T>;
}

// Create context with default values
const LoadingDelayContext = createContext<LoadingDelayContextType | null>(null);

// Create provider component
export const LoadingDelayProvider = ({
    children,
    minimumDelay = 500
}: {
    children: ReactNode;
    minimumDelay?: number;
}) => {
    const simulateLoading = async<T>(promise: Promise<T>): Promise<T> => {
        // Simulate a minimum loading time for better UX
        const [result] = await Promise.all([
        promise,
            new Promise(resolve => setTimeout(resolve, minimumDelay))
        ]);
        return result;
    };

        return (
        <LoadingDelayContext.Provider value={{ simulateLoading }}>
            {children}
        </LoadingDelayContext.Provider>
        );
}

// Create custom hook for using this context
export const useLoadingDelay = (): LoadingDelayContextType => {
    const context = useContext(LoadingDelayContext);
        if (!context) {
        // Provide a default implementation if context is not available
        return {
            simulateLoading: async <T>(promise: Promise<T>): Promise<T> => {
                // Simulate a minimum loading time of 500ms for better UX
                const [result] = await Promise.all([
                promise,
                    new Promise(resolve => setTimeout(resolve, 500))
                ]);
                return result;
            }
        };
    }
                return context;
} 