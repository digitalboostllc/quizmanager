'use client';

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter
} from "@/components/ui/card";
import type { Quiz, QuizType } from "@/lib/types";
import {
    CalendarDays,
    CheckSquare,
    Eye,
    ImageIcon,
    Loader2,
    RefreshCw,
    Trash2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";

// Definition for template data that might be loaded separately
interface TemplateInfo {
    id: string;
    name: string;
    quizType: QuizType;
}

interface QuizCardProps {
    quiz: Quiz;
    onDelete: (id: string) => Promise<void>;
    onRegenerateImage: (id: string) => Promise<void>;
    showActions?: boolean;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    templateInfo?: TemplateInfo; // Optional template info can be passed directly
}

export function QuizCard({
    quiz,
    onDelete,
    onRegenerateImage,
    showActions = true,
    selectable = false,
    selected = false,
    onSelect,
    templateInfo
}: QuizCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [template, setTemplate] = useState<TemplateInfo | undefined>(templateInfo);

    // If templateInfo wasn't provided, fetch it when needed
    useEffect(() => {
        if (!template && !templateInfo && quiz.templateId) {
            // Fetch template info if not provided and not already loaded
            const fetchTemplateInfo = async () => {
                try {
                    const response = await fetch(`/api/templates/${quiz.templateId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTemplate({
                            id: data.id,
                            name: data.name,
                            quizType: data.quizType
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch template info:", error);
                }
            };

            fetchTemplateInfo();
        } else if (templateInfo && templateInfo !== template) {
            setTemplate(templateInfo);
        }
    }, [quiz.templateId, template, templateInfo]);

    const statusColors: Record<string, { bg: string, text: string, border: string }> = {
        DRAFT: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200" },
        SCHEDULED: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
        PUBLISHED: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200" }
    };

    const statusLabel = {
        DRAFT: "Draft",
        SCHEDULED: "Scheduled",
        PUBLISHED: "Published"
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            await onDelete(quiz.id);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRegenerate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isRegenerating) return;

        setIsRegenerating(true);
        try {
            await onRegenerateImage(quiz.id);
        } finally {
            setIsRegenerating(false);
        }
    };

    const colors = statusColors[quiz.status] || { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-200" };
    const label = statusLabel[quiz.status as keyof typeof statusLabel] || quiz.status;

    return (
        <Card
            className={`overflow-hidden h-full flex flex-col group hover:shadow-md transition-all duration-200 border-border/40 bg-background/50 ${selected ? 'border-primary' : ''} ${quiz.imageUrl ? 'hover:border-primary hover:shadow-lg' : 'hover:border-primary/20'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image section with status badge */}
            <div className="aspect-square relative bg-muted">
                <Link
                    href={`/dashboard/quizzes/${quiz.id}`}
                    className="block absolute inset-0 z-10 transition-transform group-hover:scale-[1.02]"
                >
                    <span className="sr-only">View quiz details</span>
                </Link>
                {quiz.imageUrl ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={quiz.imageUrl}
                            alt={quiz.title}
                            fill
                            className="object-cover transition-all duration-300 group-hover:brightness-[1.05]"
                        />
                        {/* Regenerate button in bottom right corner - always visible */}
                        {showActions && (
                            <div
                                className="absolute bottom-3 right-3 z-20"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm rounded-full"
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                >
                                    {isRegenerating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Regenerate Image</span>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                )}

                {/* Status badge and selection UI */}
                <div className="absolute top-0 right-0 left-0 flex justify-between items-start p-3 z-20">
                    {/* Selection checkbox - only in the top-left corner */}
                    {selectable && onSelect && (
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelect(quiz.id, !selected);
                            }}
                            className={`flex items-center justify-center h-6 w-6 rounded-md cursor-pointer ${selected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background/80 hover:bg-background border border-border/50'
                                }`}
                        >
                            {selected && <CheckSquare className="h-4 w-4" />}
                        </div>
                    )}

                    {/* Status badge */}
                    <Badge
                        variant="outline"
                        className={`font-medium text-xs ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                        {label}
                    </Badge>
                </div>
            </div>

            {/* Content section */}
            <CardContent className="flex-1 p-5 bg-white border-b border-border/20">
                <h3 className="font-semibold text-base line-clamp-1 mb-1">{quiz.title}</h3>
                <div className="line-clamp-2 text-sm text-muted-foreground mb-2">
                    {quiz.solution || "No description available"}
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {formatDate(quiz.updatedAt || quiz.createdAt)}
                    </div>
                </div>

                {/* Type badge - moved from image section to content section to match templates */}
                {template?.quizType && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                            {template.quizType}
                        </Badge>
                    </div>
                )}
            </CardContent>

            {/* Footer with actions */}
            <CardFooter className="px-5 py-4 border-t border-border/40 flex justify-between gap-2 bg-white">
                <Button variant="outline" size="sm" asChild className="h-8 flex-1 text-xs rounded-md bg-background hover:bg-background/80">
                    <Link href={`/dashboard/quizzes/${quiz.id}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Details
                    </Link>
                </Button>

                {showActions && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 bg-background hover:bg-background/80"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}