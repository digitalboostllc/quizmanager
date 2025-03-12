"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
    /**
     * The size of the loading indicator
     * @default "md"
     */
    size?: "sm" | "md" | "lg";

    /**
     * The message to display below the loading indicator
     */
    message?: string;

    /**
     * Whether to center the loading indicator
     * @default false
     */
    centered?: boolean;

    /**
     * Additional classes to apply to the loading indicator
     */
    className?: string;
}

/**
 * A loading indicator component for asynchronous operations
 */
export function LoadingIndicator({
    size = "md",
    message,
    centered = false,
    className,
}: LoadingIndicatorProps) {
    // Size mappings
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className={cn(
            "flex flex-col items-center justify-center",
            centered && "h-full w-full",
            className
        )}>
            <Loader2 className={cn(
                "animate-spin text-primary",
                sizeClasses[size]
            )} />
            {message && (
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            )}
        </div>
    );
}

/**
 * A fullscreen loading indicator
 */
export function FullscreenLoader({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <LoadingIndicator size="lg" message={message} />
        </div>
    );
}

/**
 * A loading spinner for buttons
 */
export function ButtonLoader({ className }: { className?: string }) {
    return (
        <Loader2 className={cn("animate-spin h-4 w-4", className)} />
    );
}

/**
 * An inline loading indicator
 */
export function InlineLoader({ className }: { className?: string }) {
    return (
        <Loader2 className={cn("animate-spin inline-block mr-2 h-3 w-3", className)} />
    );
} 