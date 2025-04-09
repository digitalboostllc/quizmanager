"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { QuizType } from "@/lib/types";
import { format } from "date-fns";
import { CalendarIcon, FileText } from "lucide-react";
import { useState } from "react";

interface TemplateCardProps {
    id: string;
    name: string;
    description: string;
    type: QuizType;
    thumbnailUrl?: string;
    createdAt: Date;
    selected: boolean;
    onSelect: (id: string, selected: boolean) => void;
}

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
    'WORDLE': 'Wordle',
    'NUMBER_SEQUENCE': 'Number Sequence',
    'RHYME_TIME': 'Rhyme Time',
    'CONCEPT_CONNECTION': 'Concept Connection'
};

const TYPE_COLORS: Record<QuizType, { bg: string; text: string }> = {
    'WORDLE': { bg: 'bg-green-100', text: 'text-green-800' },
    'NUMBER_SEQUENCE': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'RHYME_TIME': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'CONCEPT_CONNECTION': { bg: 'bg-amber-100', text: 'text-amber-800' },
};

export function TemplateCard({
    id,
    name,
    description,
    type,
    thumbnailUrl,
    createdAt,
    selected,
    onSelect,
}: TemplateCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const typeLabel = QUIZ_TYPE_LABELS[type] || type;
    const typeColor = TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
        <div
            className={`flex items-start border rounded-md p-4 space-x-3 transition-all duration-200 ${selected
                    ? 'border-primary bg-primary/5'
                    : isHovered
                        ? 'border-primary/30 bg-primary/2'
                        : 'border-border'
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Checkbox
                id={`template-${id}`}
                checked={selected}
                onCheckedChange={(checked) => onSelect(id, checked as boolean)}
                className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                    <label
                        htmlFor={`template-${id}`}
                        className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                    >
                        {name}
                    </label>
                    <Badge variant="outline" className={`text-xs ${typeColor.bg} ${typeColor.text}`}>
                        {typeLabel}
                    </Badge>
                </div>

                {description && (
                    <p className="text-muted-foreground text-xs line-clamp-2">
                        {description}
                    </p>
                )}

                <div className="flex items-center text-xs text-muted-foreground">
                    <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>{format(new Date(createdAt), 'MMM d, yyyy')}</span>
                    </div>

                    {thumbnailUrl ? (
                        <div className="ml-auto w-8 h-8 rounded overflow-hidden">
                            <img
                                src={thumbnailUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="ml-auto w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 