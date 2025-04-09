"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

interface ThemeInputProps {
    value: string;
    onChange: (value: string) => void;
}

// Sample theme suggestions
const THEME_SUGGESTIONS = [
    "World Landmarks",
    "Film Directors",
    "Space Exploration",
    "Ancient Civilizations",
    "Marine Life",
    "Famous Inventors",
    "Classical Music",
    "Renaissance Art",
    "Olympic Sports",
    "Nobel Prize Winners",
    "National Parks",
    "Culinary Traditions",
];

export function ThemeInput({ value, onChange }: ThemeInputProps) {
    const [focusedInput, setFocusedInput] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Get random suggestions
    const getRandomSuggestions = (count: number = 3): string[] => {
        const shuffled = [...THEME_SUGGESTIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Handle focus on input
    const handleFocus = () => {
        setFocusedInput(true);
        if (!value) {
            setSuggestions(getRandomSuggestions(4));
        }
    };

    // Handle click on suggestion
    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setSuggestions([]);
    };

    // Handle clearing the input
    const handleClear = () => {
        onChange("");
        setSuggestions(getRandomSuggestions(4));
    };

    // Generate ideas with AI button click
    const handleGenerateIdeas = () => {
        // In a real application, this would call an API
        // For now, we'll just show more random suggestions
        setSuggestions(getRandomSuggestions(6));
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={() => setTimeout(() => setFocusedInput(false), 200)}
                    placeholder="Enter a theme for your quizzes"
                    className={`pr-8 ${value ? "border-primary" : ""}`}
                />

                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {!value && focusedInput && suggestions.length > 0 && (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((suggestion) => (
                            <Badge
                                key={suggestion}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10 transition-colors px-2.5 py-1"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {!value && (
                <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">
                        Select a theme that will connect all generated quizzes
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-primary"
                        onClick={handleGenerateIdeas}
                    >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Generate Ideas
                    </Button>
                </div>
            )}
        </div>
    );
} 