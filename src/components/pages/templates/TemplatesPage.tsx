'use client';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from "@/components/ui/select";
import { QuizCardSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateImage } from "@/lib/image";
import { PaginatedResponse } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import {
    BarChart3,
    CalendarDays,
    CheckSquare,
    ChevronRight,
    Code,
    Eye,
    FileType,
    FilterX,
    Globe,
    Home,
    ImageIcon,
    Layers3,
    Loader2,
    Lock,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Share,
    SortDesc,
    Sparkles,
    Trash2,
    TrendingUp,
    Variable,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Template type definition
interface Template {
    id: string;
    name: string;
    description?: string;
    quizType: string;
    imageUrl?: string;
    previewImageUrl?: string;
    createdAt: string;
    updatedAt?: string;
    userId: string;
    isPublic: boolean;
    _count?: {
        quizzes: number;
    };
    imageKey?: number;
    html?: string;
    css?: string;
    variables?: Record<string, string>;
}

// Constants for template fetching
const TEMPLATES_PER_PAGE = 20;
const SEARCH_DEBOUNCE_DELAY = 500;
const MAX_API_RETRIES = 3;

// CSS for grid background pattern
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export function TemplatesPage() {
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"name" | "date" | "type">("date");
    const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");

    // State for templates and pagination
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Add state for template being regenerated
    const [regeneratingTemplateId, setRegeneratingTemplateId] = useState<string | null>(null);

    // Calculate quiz-related metrics first
    const withQuizzes = templates.filter(t => t._count?.quizzes && t._count.quizzes > 0).length || 0;
    const noQuizzes = templates.filter(t => !t._count?.quizzes || t._count.quizzes === 0).length || 0;
    const usagePercentage = templates.length > 0
        ? Math.round((withQuizzes / templates.length) * 100)
        : 0;

    // Now define the analytics object using the pre-calculated values
    const analytics = {
        totalTemplates: templates.length,
        public: templates.filter(t => t.isPublic).length,
        private: templates.filter(t => !t.isPublic).length,
        withQuizzes,
        noQuizzes,
        usage: usagePercentage,
        withType: {
            wordle: templates.filter(t => t.quizType === 'WORDLE').length,
            numberSequence: templates.filter(t => t.quizType === 'NUMBER_SEQUENCE').length,
            rhymeTime: templates.filter(t => t.quizType === 'RHYME_TIME').length,
            conceptConnection: templates.filter(t => t.quizType === 'CONCEPT_CONNECTION').length
        }
    };

    // Fetch templates with retry logic
    const fetchTemplatesWithRetry = useCallback(async (endpoint: string): Promise<PaginatedResponse<Template> | null> => {
        let attempts = 0;

        while (attempts < MAX_API_RETRIES) {
            try {
                const fullApiUrl = `/api/${endpoint}`;
                const response = await fetch(fullApiUrl);

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                attempts++;

                if (attempts >= MAX_API_RETRIES) {
                    throw error;
                }

                // Exponential backoff with jitter
                const delay = Math.min(500 * Math.pow(1.5, attempts) * (0.9 + Math.random() * 0.2), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return null;
    }, []);

    // Load templates function
    const loadTemplates = useCallback(async (reset = false) => {
        // Only skip duplicate loads if not the initial load
        if (reset && isLoading && !(reset && templates.length === 0 && !searchQuery && selectedType === 'all')) {
            return;
        }

        if (!reset && (isLoadingMore || !hasMore)) {
            return;
        }

        // Set appropriate loading state
        if (reset) {
            setIsLoading(true);
            setTemplates([]);
            setNextCursor(null);
        } else {
            setIsLoadingMore(true);
        }

        setError(null);

        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('limit', TEMPLATES_PER_PAGE.toString());

            if (nextCursor && !reset) {
                params.append('cursor', nextCursor);
            }

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            if (selectedType !== 'all') {
                params.append('type', selectedType);
            }

            if (visibilityFilter !== 'all') {
                params.append('visibility', visibilityFilter);
            }

            // Fix the endpoint URL - remove the duplicate api/ prefix
            const endpoint = `templates?${params.toString()}`;
            const response = await fetchTemplatesWithRetry(endpoint);

            if (!response) {
                throw new Error("Failed to fetch templates after multiple retries");
            }

            if (response.data) {
                // Update templates, ensuring we don't duplicate entries
                setTemplates(prev => {
                    if (reset) {
                        return response.data;
                    }

                    // Create a Set of existing IDs for efficient lookup
                    const existingIds = new Set(prev.map(t => t.id));
                    // Filter out any duplicate templates that might be returned
                    const newTemplates = response.data.filter(t => !existingIds.has(t.id));

                    return [...prev, ...newTemplates];
                });

                // Update pagination state
                setHasMore(response.pagination.hasMore);
                setNextCursor(response.pagination.nextCursor);
                setRetryCount(0); // Reset retry count on success
            } else {
                setError('Received unexpected data format from server');
            }
        } catch (error: any) {
            // Enhanced error information
            const errorMessage = `Failed to load templates: ${error.message || 'Unknown error'}`;

            setError(errorMessage);

            // Show toast only on initial load failures, not silent load more failures
            if (reset) {
                toast({
                    title: "Error",
                    description: "Failed to load templates. Please try again.",
                    variant: "destructive",
                });
            }

            // Keep track of retries for the entire page
            setRetryCount(prev => prev + 1);

            // Allow for auto-retry if we haven't exceeded the page-level retry limit
            if (retryCount < 2) {
                const delay = 1000 * (retryCount + 1);
                setTimeout(() => loadTemplates(reset), delay);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [
        isLoading,
        isLoadingMore,
        hasMore,
        nextCursor,
        searchQuery,
        selectedType,
        visibilityFilter,
        fetchTemplatesWithRetry,
        toast,
        retryCount,
        templates.length
    ]);

    // Handle delete template
    const handleDeleteTemplate = async (id: string) => {
        if (!isAuthenticated) return;

        try {
            // Use direct fetch instead of fetchApi
            const response = await fetch(`/api/templates/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete template: ${response.status}`);
            }

            // Update local state
            setTemplates(prev => prev.filter(template => template.id !== id));
            toast({
                title: "Success",
                description: "Template deleted successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete template",
                variant: "destructive",
            });
        }
    };

    // Debounce search input
    useEffect(() => {
        // Only trigger a search if searchQuery or selectedType actually change
        // and the component has already mounted (not during initial render)
        if (searchQuery !== '' || selectedType !== 'all' || visibilityFilter !== 'all') {
            const timer = setTimeout(() => {
                loadTemplates(true);
            }, SEARCH_DEBOUNCE_DELAY);
            return () => clearTimeout(timer);
        }
        // Only include the actual changing values, not the function
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, selectedType, visibilityFilter]);

    // Initial load - simplified
    useEffect(() => {
        loadTemplates(true);

        // Add a safety timeout to ensure loading state is cleared even if something fails
        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, 10000); // 10 second safety

        return () => clearTimeout(safetyTimeout);
    }, []);  // Deliberately omitting dependencies to prevent recreation

    // Handle load more
    const handleLoadMore = () => {
        loadTemplates(false);
    };

    // Sort and filter templates
    const displayTemplates = [...templates]
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            } else if (sortBy === "type") {
                return a.quizType.localeCompare(b.quizType);
            } else {
                // Default sort by date
                return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
            }
        });

    // Format date helper
    const formatDate = (date: string) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch (error) {
            return "Invalid date";
        }
    };

    // Get appropriate color for quiz type - Replacing with neutral styling
    const getTypeStyle = (quizType: string) => {
        return "bg-background text-foreground border-border dark:border-border/50";
    };

    // Get readable quiz type name
    const getTypeName = (quizType: string) => {
        switch (quizType) {
            case "WORDLE":
                return "Wordle";
            case "NUMBER_SEQUENCE":
                return "Number Sequence";
            case "RHYME_TIME":
                return "Rhyme Time";
            case "CONCEPT_CONNECTION":
                return "Concept Connection";
            default:
                return quizType.replace(/_/g, ' ');
        }
    };

    // When there's an error but we have some templates, show inline error
    const renderError = () => {
        if (!error) return null;

        // Only show full error alert if we have no templates at all
        if (templates.length === 0) {
            return (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                        {error}
                        {retryCount >= 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-4"
                                onClick={() => loadTemplates(true)}
                            >
                                Try Again
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            );
        }

        // If we have templates but load more failed, show inline message
        return (
            <div className="text-center mt-6 text-sm text-muted-foreground">
                <p className="mb-2">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTemplates(false)}
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? (
                        <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Retrying...
                        </>
                    ) : (
                        "Try Again"
                    )}
                </Button>
            </div>
        );
    };

    // Add a handler function for regenerating template images
    const handleRegenerateTemplateImage = async (templateId: string) => {
        if (!isAuthenticated) return;

        // Set the template as regenerating
        setRegeneratingTemplateId(templateId);

        try {
            // First, fetch the complete template data if we don't have it
            let templateToRegen = templates.find(t => t.id === templateId);
            if (!templateToRegen) {
                throw new Error(`Template with ID ${templateId} not found in local state`);
            }

            // If the template doesn't have HTML content, fetch the complete data
            if (!templateToRegen.html) {
                // We need to fetch the complete template data
                const response = await fetch(`/api/templates/${templateId}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch template details: ${response.status}`);
                }
                const data = await response.json();

                // Update our local copy
                setTemplates(prev => prev.map(t =>
                    t.id === templateId ? { ...t, ...data } : t
                ));

                // Update the local reference with fetched data
                templateToRegen = {
                    ...templateToRegen,
                    html: data.html,
                    css: data.css,
                    variables: data.variables
                };
            }

            // Process HTML to replace variable placeholders with values
            let processedHtml = templateToRegen.html || '';
            if (templateToRegen.variables) {
                Object.entries(templateToRegen.variables).forEach(([key, value]) => {
                    processedHtml = processedHtml.replace(
                        new RegExp(`{{${key}}}`, "g"),
                        String(value)
                    );
                });
            }

            // Create a complete HTML document with proper structure and styles
            const completeHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      /* Reset styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Base styles */
      body {
        width: 1080px;
        height: 1080px;
        margin: 0;
        padding: 0;
        background: white;
      }

      /* Template styles */
      ${templateToRegen.css || ''}
    </style>
  </head>
  <body>
    ${processedHtml}
  </body>
</html>
`;

            // Generate a structured filename with template ID and type
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const quizType = templateToRegen.quizType || 'template';
            const filename = `templates/template-${templateId}-${quizType}-${timestamp}.png`;

            // Generate image with specific filename - using the same utility as the detail page
            const imageUrl = await generateImage(completeHtml, { filename });

            // Update the template in the database with the new image URL
            const updateResponse = await fetch(`/api/templates/${templateId}`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    previewImageUrl: imageUrl
                }),
            });

            if (!updateResponse.ok) {
                throw new Error(`Failed to update template with preview image: ${updateResponse.status}`);
            }

            // Get updated template data
            const updatedTemplate = await updateResponse.json();

            // Update the templates list with the new data
            setTemplates(prev => prev.map(template => {
                if (template.id === templateId) {
                    return {
                        ...template,
                        ...updatedTemplate,
                        imageKey: Date.now() // Add unique timestamp as key for forcing re-render
                    };
                }
                return template;
            }));

            toast({
                title: "Success",
                description: "Template image regenerated successfully",
            });
        } catch (error) {
            console.error('Error regenerating template image:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to regenerate template image",
                variant: "destructive",
            });
        } finally {
            // Clear the regenerating state
            setRegeneratingTemplateId(null);
        }
    };

    return (
        <div className="">
            {/* Use semantic header element for the breadcrumb and page header */}
            <header>
                {/* Breadcrumb navigation */}
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <Link href="/" className="hover:text-foreground transition-colors">
                        <Home className="h-3.5 w-3.5 inline-block mr-1" />
                        Home
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">Templates</span>
                </nav>

                {/* Templates header with background pattern */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex flex-col space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold flex items-center">
                                        <Layers3 className="mr-2 h-5 w-5 text-primary" />
                                        Templates
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        Create and manage quiz templates
                                    </p>
                                </div>

                                {isAuthenticated ? (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadTemplates(true)}
                                            disabled={isLoading}
                                            className="bg-background border-border/50"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">Refresh</span>
                                        </Button>
                                        <Link href="/dashboard/templates/new">
                                            <Button size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                New Template
                                            </Button>
                                        </Link>
                                    </div>
                                ) : null}
                            </div>

                            {/* Filter controls */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search templates..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 w-9 rounded-l-none"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Clear search</span>
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-row gap-4">
                                    <div className="w-[160px]">
                                        <Select value={selectedType} onValueChange={setSelectedType}>
                                            <SelectTrigger className="bg-background border-border/50">
                                                <div className="flex items-center">
                                                    <FileType className="h-4 w-4 mr-2" />
                                                    <span className="truncate">
                                                        {selectedType === "all" ? "All Types" : getTypeName(selectedType)}
                                                    </span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="WORDLE">Wordle</SelectItem>
                                                <SelectItem value="NUMBER_SEQUENCE">Number Sequence</SelectItem>
                                                <SelectItem value="RHYME_TIME">Rhyme Time</SelectItem>
                                                <SelectItem value="CONCEPT_CONNECTION">Concept Connection</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {isAuthenticated && (
                                        <div className="w-[160px]">
                                            <Select
                                                value={visibilityFilter}
                                                onValueChange={(value) => setVisibilityFilter(value as "all" | "public" | "private")}
                                            >
                                                <SelectTrigger className="bg-background border-border/50">
                                                    <div className="flex items-center">
                                                        <FilterX className="h-4 w-4 mr-2" />
                                                        <span className="truncate">
                                                            {visibilityFilter === "all" ? "All Visibility" :
                                                                visibilityFilter === "public" ? "Public Only" :
                                                                    "Private Only"}
                                                        </span>
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Visibility</SelectItem>
                                                    <SelectItem value="public">Public Only</SelectItem>
                                                    <SelectItem value="private">Private Only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="w-[160px]">
                                        <Select
                                            value={sortBy}
                                            onValueChange={(value) => setSortBy(value as "name" | "date" | "type")}
                                        >
                                            <SelectTrigger className="bg-background border-border/50">
                                                <div className="flex items-center">
                                                    <SortDesc className="h-4 w-4 mr-2" />
                                                    <span className="truncate">
                                                        {sortBy === "name" ? "Sort by Name" :
                                                            sortBy === "type" ? "Sort by Type" :
                                                                "Sort by Date"}
                                                    </span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date">Sort by Date</SelectItem>
                                                <SelectItem value="name">Sort by Name</SelectItem>
                                                <SelectItem value="type">Sort by Type</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Active filters display */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {/* Templates count */}
                <div className="text-sm text-muted-foreground mr-2">
                    {templates.length} template{templates.length !== 1 ? 's' : ''} found
                </div>

                {/* Active filters as chips */}
                {searchQuery && (
                    <Badge variant="outline" className="flex items-center gap-1 pl-2 pr-1 py-1 h-7">
                        <span>Search: {searchQuery}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1 hover:bg-background"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                {selectedType !== 'all' && (
                    <Badge variant="outline" className="flex items-center gap-1 pl-2 pr-1 py-1 h-7">
                        <span>Type: {getTypeName(selectedType)}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1 hover:bg-background"
                            onClick={() => setSelectedType("all")}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                {isAuthenticated && visibilityFilter !== 'all' && (
                    <Badge variant="outline" className="flex items-center gap-1 pl-2 pr-1 py-1 h-7">
                        <span>Visibility: {visibilityFilter === 'public' ? 'Public' : 'Private'}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1 hover:bg-background"
                            onClick={() => setVisibilityFilter("all")}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                {/* Clear all filters button */}
                {(searchQuery || selectedType !== 'all' || (isAuthenticated && visibilityFilter !== 'all')) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedType("all");
                            setVisibilityFilter("all");
                        }}
                    >
                        <FilterX className="h-3.5 w-3.5 mr-1.5" />
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Error display */}
            {renderError()}

            {/* Main content area with sidebar */}
            <div className="grid grid-cols-12 gap-6">
                {/* Main content (templates list) */}
                <div className="col-span-12 lg:col-span-9">
                    {/* Template grid with consistent styling */}
                    {templates.length > 0 ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayTemplates.map((template) => (
                                    <Card
                                        key={template.id}
                                        className={`overflow-hidden h-full flex flex-col group hover:shadow-md transition-all duration-200 border-border/40 bg-background/50 ${template.previewImageUrl ? 'hover:border-primary hover:shadow-lg' : 'hover:border-primary/20'}`}
                                    >
                                        <div className="aspect-square relative bg-muted">
                                            <Link
                                                href={`/dashboard/templates/${template.id}`}
                                                className="block absolute inset-0 z-10 transition-transform group-hover:scale-[1.02]"
                                            >
                                                <span className="sr-only">View template details</span>
                                            </Link>
                                            {template.previewImageUrl ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        key={template.imageKey || template.id}
                                                        src={`${template.previewImageUrl}${template.previewImageUrl.includes('?') ? '&' : '?'}cb=${template.imageKey || Date.now()}`}
                                                        alt={template.name}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        className={`object-cover transition-all duration-300 group-hover:brightness-[1.05] ${regeneratingTemplateId === template.id ? 'opacity-40 blur-[1px]' : ''}`}
                                                    />
                                                    {/* Add regenerate button in bottom right corner - only visible for authenticated users */}
                                                    {isAuthenticated && (
                                                        <div className="absolute bottom-3 right-3 z-20">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm rounded-full"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleRegenerateTemplateImage(template.id);
                                                                }}
                                                                disabled={regeneratingTemplateId === template.id}
                                                            >
                                                                {regeneratingTemplateId === template.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4" />
                                                                )}
                                                                <span className="sr-only">Regenerate Image</span>
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Update the loading overlay for templates with previewImageUrl */}
                                                    {regeneratingTemplateId === template.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-[2px]">
                                                            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/90 text-primary-foreground shadow-sm">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                <span className="text-xs font-medium">Generating</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : template.imageUrl ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        key={template.imageKey || template.id}
                                                        src={`${template.imageUrl}${template.imageUrl.includes('?') ? '&' : '?'}cb=${template.imageKey || Date.now()}`}
                                                        alt={template.name}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        className={`object-cover transition-all duration-300 group-hover:brightness-[1.05] ${regeneratingTemplateId === template.id ? 'opacity-40 blur-[1px]' : ''}`}
                                                    />
                                                    {/* Add regenerate button for image URL as well */}
                                                    {isAuthenticated && (
                                                        <div className="absolute bottom-3 right-3 z-20">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm rounded-full"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleRegenerateTemplateImage(template.id);
                                                                }}
                                                                disabled={regeneratingTemplateId === template.id}
                                                            >
                                                                {regeneratingTemplateId === template.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4" />
                                                                )}
                                                                <span className="sr-only">Regenerate Image</span>
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Update the loading overlay for templates with imageUrl */}
                                                    {regeneratingTemplateId === template.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-[2px]">
                                                            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/90 text-primary-foreground shadow-sm">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                <span className="text-xs font-medium">Generating</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-full flex items-center justify-center bg-secondary/30 transition-all duration-300 group-hover:bg-secondary/40">
                                                    <div className="p-6 rounded-full bg-background/80 backdrop-blur-sm">
                                                        <FileType className="h-8 w-8 text-primary/60" />
                                                    </div>

                                                    {/* Add regenerate button for templates without images */}
                                                    {isAuthenticated && (
                                                        <div className="absolute bottom-3 right-3 z-20">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm rounded-full"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleRegenerateTemplateImage(template.id);
                                                                }}
                                                                disabled={regeneratingTemplateId === template.id}
                                                            >
                                                                {regeneratingTemplateId === template.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4" />
                                                                )}
                                                                <span className="sr-only">Generate Image</span>
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Update the loading overlay for templates without images */}
                                                    {regeneratingTemplateId === template.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-[2px]">
                                                            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/90 text-primary-foreground shadow-sm">
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                <span className="text-xs font-medium">Generating</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Badge
                                                className={`absolute top-3 right-3 font-medium text-xs ${template.isPublic
                                                    ? "bg-green-500/10 text-green-600 border-green-200"
                                                    : "bg-blue-500/10 text-blue-600 border-blue-200"
                                                    }`}
                                                variant="outline"
                                            >
                                                {template.isPublic ? "Public" : "Private"}
                                            </Badge>
                                        </div>
                                        <CardContent className="flex-1 p-5 bg-muted/20">
                                            <h3 className="font-semibold text-base line-clamp-1 mb-1">{template.name}</h3>
                                            <div className="flex flex-col gap-2 mt-2">
                                                {/* Quiz count */}
                                                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" />
                                                    {/* Handle templates without _count field */}
                                                    <span>0 quizzes</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    <span>
                                                        {template.updatedAt
                                                            ? `Updated ${formatDate(template.updatedAt)}`
                                                            : `Created ${formatDate(template.createdAt)}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        className={`font-medium text-xs border ${getTypeStyle(template.quizType)}`}
                                                        variant="outline"
                                                    >
                                                        {getTypeName(template.quizType)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="px-5 py-4 border-t border-border/30 flex justify-between gap-2 bg-secondary/5">
                                            <Button variant="outline" size="sm" asChild className="h-8 flex-1 text-xs rounded-md">
                                                <Link href={`/dashboard/templates/${template.id}`}>
                                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                    View Details
                                                </Link>
                                            </Button>
                                            {isAuthenticated && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this template?
                                                                This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteTemplate(template.id)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>

                            {/* Load more button with improved styling */}
                            {hasMore && isAuthenticated && (
                                <div className="flex justify-center mt-8">
                                    <Button
                                        variant="outline"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="min-w-[180px] bg-background border-border/50"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                Load More
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Load more skeletons */}
                            {isLoadingMore && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <QuizCardSkeleton key={`loadmore-${index}`} />
                                    ))}
                                </div>
                            )}

                            {/* Auth CTA */}
                            {!isAuthenticated && templates.length > 0 && (
                                <div className="bg-primary/5 rounded-lg p-6 mt-8 text-center border">
                                    <h3 className="text-lg font-medium mb-2">
                                        Sign in to see all templates
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        Access all your templates and create new ones.
                                    </p>
                                    <Button asChild>
                                        <Link href="/auth/login">
                                            Sign In
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 12 }).map((_, index) => (
                                <QuizCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg bg-background">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 mb-4">
                                <FileType className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">No templates found</h3>
                            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                                {searchQuery || selectedType !== 'all'
                                    ? "Try adjusting your search or filter"
                                    : error
                                        ? "There was an error loading templates. Please try again."
                                        : "Create your first template to get started with custom quizzes."
                                }
                            </p>
                            {isAuthenticated && !error && (
                                <Button className="mt-4" asChild>
                                    <Link href="/dashboard/templates/new">
                                        <Plus className="mr-2 h-4 w-4" /> Create Template
                                    </Link>
                                </Button>
                            )}
                            {error && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => loadTemplates(true)}
                                >
                                    <Loader2 className="mr-2 h-4 w-4" />
                                    Retry Loading
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    {/* Analytics card */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                                Template Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Templates</span>
                                    <span className="font-medium">{analytics.totalTemplates}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center">
                                        <Globe className="h-3 w-3 mr-1 text-green-500" />
                                        Public
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{
                                                    width: `${analytics.totalTemplates ? (analytics.public / analytics.totalTemplates) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.public}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center">
                                        <Lock className="h-3 w-3 mr-1 text-blue-500" />
                                        Private
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{
                                                    width: `${analytics.totalTemplates ? (analytics.private / analytics.totalTemplates) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.private}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center">
                                        <CheckSquare className="h-3 w-3 mr-1 text-purple-500" />
                                        In Use
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{
                                                    width: `${analytics.totalTemplates ? (analytics.withQuizzes / analytics.totalTemplates) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.withQuizzes}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                                    <span className="text-muted-foreground flex items-center">
                                        <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                                        Usage Rate
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${analytics.usage}%` }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.usage}%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips & Tricks card */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                                Tips & Tricks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <Code className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                        HTML Templates
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use HTML templates with dynamic variables to create consistently styled quizzes. Customize the look while maintaining a unified brand.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-muted/20 border">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                        Template Images
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Templates with attractive preview images are chosen more often. Use the regenerate image feature to create compelling visuals.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-muted/20 border">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <Share className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                                        Public Templates
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Share your templates with the community by making them public. Templates with clear descriptions get used more frequently.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-muted/20 border">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <Variable className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                                        Dynamic Variables
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use variables like <code>{"{{topic}}"}</code> to create flexible templates that can generate quizzes on any subject instantly.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 