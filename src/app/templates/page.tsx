"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { QUIZ_TYPE_LABELS } from "@/lib/quiz-types";
import { useStore } from "@/lib/store";
import type { PaginatedResponse, Template } from "@/lib/types";
import { ArrowRight, Clock, Eye, Filter, Loader2, MoreVertical, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Number of templates to fetch per page
const TEMPLATES_PER_PAGE = 12;

// Maximum number of retries for API calls
const MAX_API_RETRIES = 3;

export default function TemplatesPage() {
  const { deleteTemplate } = useStore();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "type" | "recent">("recent");
  const { simulateLoading } = useLoadingDelay();

  // Pagination and loading states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // API fetch function with retry logic
  const fetchTemplatesWithRetry = useCallback(async (endpoint: string, reset: boolean = false): Promise<PaginatedResponse<Template> | null> => {
    let attempts = 0;

    while (attempts < MAX_API_RETRIES) {
      try {
        // Use the loading delay only for initial loads (reset=true)
        const fetcher = reset
          ? () => simulateLoading(fetchApi<PaginatedResponse<Template>>(endpoint))
          : () => fetchApi<PaginatedResponse<Template>>(endpoint);

        return await fetcher();
      } catch (error) {
        attempts++;
        console.error(`Templates API call failed (attempt ${attempts}/${MAX_API_RETRIES})`, error);

        if (attempts >= MAX_API_RETRIES) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = Math.min(500 * Math.pow(1.5, attempts) * (0.9 + Math.random() * 0.2), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return null;
  }, [simulateLoading]);

  // Load templates with optimized parameters
  const loadTemplates = useCallback(async (reset = false) => {
    // Prevent duplicate requests
    if ((reset && isLoading) || (!reset && (isLoadingMore || !hasMore))) {
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
      // Build query parameters with type safety
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

      const endpoint = `/templates?${params.toString()}`;
      console.log(`Templates: Loading from ${endpoint}`);

      const response = await fetchTemplatesWithRetry(endpoint, reset);

      if (!response) {
        throw new Error("Failed to fetch templates after multiple retries");
      }

      if (response.data) {
        // Update templates, ensuring we don't duplicate entries
        setTemplates(prev => {
          if (reset) return response.data;

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
        console.error('Unexpected response format', response);
        setError('Received unexpected data format from server');
      }
    } catch (error: any) {
      console.error('Templates: Loading failed', error);
      setError(`Failed to load templates: ${error.message || 'Unknown error'}`);

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
        console.log(`Will auto-retry in ${delay}ms`);
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
    fetchTemplatesWithRetry,
    toast,
    retryCount
  ]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedType, loadTemplates]);

  // Initial load
  useEffect(() => {
    loadTemplates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    loadTemplates(false);
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      await fetchApi(`/templates/${id}`, {
        method: "DELETE",
      });
      // Update local state
      setTemplates(prev => prev.filter(template => template.id !== id));
      // Update global state
      deleteTemplate(id);
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

  // Apply client-side sorting
  const sortedTemplates = [...templates].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "type") {
      return a.quizType.localeCompare(b.quizType);
    } else {
      // Sort by most recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Limit the display for non-authenticated users
  const displayTemplates = isAuthenticated ? sortedTemplates : sortedTemplates.slice(0, 4);

  // Template Card Skeleton component for loading state
  const TemplateCardSkeleton = () => (
    <Card className="overflow-hidden animate-pulse h-full flex flex-col">
      <div className="aspect-square bg-muted"></div>
      <CardContent className="p-4 flex-1">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex items-center gap-2 mt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-2 space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t flex justify-between">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </CardFooter>
    </Card>
  );

  // Render the load more button
  const renderLoadMoreButton = () => {
    if (!hasMore) return null;

    return (
      <div className="flex justify-center mt-8">
        <Button
          variant="outline"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="min-w-[180px]"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Load More Templates
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    );
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

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Template Library
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground text-lg">
              Browse and manage your quiz templates
            </p>
          </div>
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/templates/new">
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex md:col-span-6 gap-2">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="pl-9">
                <span className="truncate">
                  {selectedType === "all" ? "All Types" : QUIZ_TYPE_LABELS[selectedType as QuizType] || selectedType}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(QUIZ_TYPE_LABELS).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[160px]">
              <span className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {sortBy === "name" ? "Sort by Name" :
                    sortBy === "type" ? "Sort by Type" :
                      "Sort by Recent"}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                Most Recent
              </SelectItem>
              <SelectItem value="name">
                By Name
              </SelectItem>
              <SelectItem value="type">
                By Type
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error display */}
      {renderError()}

      {/* Templates grid */}
      {isLoading && templates.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: TEMPLATES_PER_PAGE }).map((_, index) => (
            <TemplateCardSkeleton key={index} />
          ))}
        </div>
      ) : templates.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedType !== "all"
              ? "Try adjusting your search or filter"
              : "Create your first template to get started"}
          </p>
          {isAuthenticated && (
            <Button className="mt-4" asChild>
              <Link href="/templates/new">
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden h-full flex flex-col group">
                <div className="aspect-square relative bg-muted">
                  {template.imageUrl ? (
                    <Image
                      src={template.imageUrl}
                      alt={template.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                      <div className="text-4xl font-semibold text-muted-foreground opacity-50">
                        {template.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link
                      href={`/templates/${template.id}`}
                      className="bg-white text-black font-medium py-2 px-4 rounded-full text-sm shadow hover:bg-gray-100 transition"
                    >
                      View Template
                    </Link>
                  </div>
                </div>
                <CardContent className="p-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{template.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {QUIZ_TYPE_LABELS[template.quizType] || template.quizType}
                    </Badge>
                    {template._count?.quizzes && template._count.quizzes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {template._count.quizzes} {template._count.quizzes === 1 ? 'quiz' : 'quizzes'}
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="px-4 py-3 border-t flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/templates/${template.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </Link>
                  </Button>
                  {isAuthenticated && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/templates/${template.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
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
                                onClick={() => handleDelete(template.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Load more button */}
          {renderLoadMoreButton()}

          {/* Load more skeletons */}
          {isLoadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <TemplateCardSkeleton key={`loadmore-${index}`} />
              ))}
            </div>
          )}

          {/* Auth CTA for non-auth users */}
          {!isAuthenticated && templates.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-6 mt-8 text-center">
              <h3 className="text-lg font-medium mb-2">
                Sign in to see all templates
              </h3>
              <p className="text-muted-foreground mb-4">
                Access the full template library and create your own quizzes.
              </p>
              <Button asChild>
                <Link href="/api/auth/signin">
                  Sign In
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 