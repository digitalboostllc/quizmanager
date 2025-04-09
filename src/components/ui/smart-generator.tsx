// Only export QuizPreview and ThemeInput from this file
// GenerationProgress is now defined directly in the smart-generator page

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { useState } from "react";

// Quiz preview component
export const QuizPreview = ({
    open,
    onOpenChange,
    quiz
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quiz: {
        title: string;
        type: string;
        scheduledAt: string;
        answer: string;
        solution?: string;
        variables: Record<string, any>;
        imageUrl?: string;
    } | null;
}) => {
    if (!quiz) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{quiz.title}</DialogTitle>
                    <DialogDescription>
                        {quiz.type} • Scheduled for {quiz.scheduledAt}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="border rounded-md p-4 bg-muted/10">
                        <h3 className="text-sm font-medium mb-2">Quiz Content</h3>
                        <p className="text-sm text-muted-foreground">
                            Content preview not available
                        </p>
                    </div>

                    <div className="border rounded-md p-4">
                        <h3 className="text-sm font-medium mb-2">Answer</h3>
                        <p className="text-sm font-mono bg-primary/5 p-2 rounded">
                            {quiz.answer}
                        </p>
                    </div>

                    {quiz.solution && (
                        <div className="border rounded-md p-4">
                            <h3 className="text-sm font-medium mb-2">Solution</h3>
                            <p className="text-sm text-muted-foreground">
                                {quiz.solution}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Theme input component
export const ThemeInput = ({
    value,
    onChange
}: {
    value: string;
    onChange: (value: string) => void;
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([
        "Science and Technology",
        "History and Civilization",
        "Art and Culture",
        "Nature and Environment",
        "Business and Economics",
    ]);

    const [customSuggestion, setCustomSuggestion] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setShowSuggestions(newValue.length > 0);
    };

    const handleAddCustomSuggestion = () => {
        if (customSuggestion.trim().length > 0) {
            setSuggestions(prev => [...prev, customSuggestion]);
            onChange(customSuggestion);
            setCustomSuggestion("");
            setShowSuggestions(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Input
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Theme or subject area (e.g. 'Science', 'History', etc.)"
                    className="w-full"
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 rounded-md border bg-background shadow-sm">
                        <div className="py-1 max-h-[200px] overflow-y-auto">
                            {suggestions
                                .filter(s => s.toLowerCase().includes(value.toLowerCase()) || value.length === 0)
                                .map((suggestion) => (
                                    <div
                                        key={suggestion}
                                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {value.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {["Science", "History", "Literature", "Geography", "Music"].map((suggestion) => (
                        <Badge
                            key={suggestion}
                            variant="outline"
                            className="cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <Sparkles className="h-3 w-3 mr-1 text-primary/70" />
                            {suggestion}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="flex gap-2 items-center">
                <Input
                    value={customSuggestion}
                    onChange={(e) => setCustomSuggestion(e.target.value)}
                    placeholder="Add a custom theme..."
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleAddCustomSuggestion();
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomSuggestion}
                    disabled={customSuggestion.trim().length === 0}
                    className="shrink-0"
                >
                    Add
                </Button>
            </div>
        </div>
    );
}; 