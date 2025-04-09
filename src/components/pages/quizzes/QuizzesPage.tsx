'use client';

import { QuizCard } from "@/components/quiz/QuizCard";
import { QuizCardSkeleton } from "@/components/quiz/QuizCardSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { PaginatedResponse, Quiz } from "@/lib/types";
import {
    BarChart3,
    Calendar,
    CheckSquare,
    ChevronRight,
    Clock,
    FileType,
    FilterX,
    Globe,
    Home,
    ImageIcon,
    Loader2,
    Plus,
    RotateCcw,
    Search,
    SortDesc,
    Sparkles,
    Square,
    SquareStack,
    Trash2,
    TrendingUp,
    X,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Increase initial load size for better UX
const QUIZZES_PER_PAGE = 20;

// Increase debounce delay to reduce API calls
const SEARCH_DEBOUNCE_DELAY = 800;

// Maximum number of retries for API calls
const MAX_API_RETRIES = 3;

// CSS for grid background pattern
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

export function QuizzesPage() {
    const { deleteQuiz, regenerateQuizImage } = useStore();
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");
    const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Pagination and loading states
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Analytics mock data - would be replaced with real data in production
    const analytics = {
        totalQuizzes: quizzes.length,
        published: quizzes.filter(q => q.status === 'PUBLISHED').length,
        drafts: quizzes.filter(q => q.status === 'DRAFT').length,
        scheduled: quizzes.filter(q => q.status === 'SCHEDULED').length,
        engagement: quizzes.length > 0 ? Math.floor(Math.random() * 30) + 70 : 0 // 70-100%
    };

    // Optimized quizzes fetch with retry logic
    const fetchQuizzesWithRetry = useCallback(async (endpoint: string, reset: boolean = false): Promise<PaginatedResponse<Quiz> | null> => {
        let attempts = 0;
        // Create an AbortController for cleanup
        const controller = new AbortController();

        try {
            while (attempts < MAX_API_RETRIES) {
                try {
                    // Add enhanced debug logs
                    console.log(`🔍 Attempt ${attempts + 1}: Fetching quizzes from ${endpoint}`);

                    // Use direct fetch instead of fetchApi for consistency with templates page
                    const fullApiUrl = `/api/${endpoint}`;
                    console.log(`🔍 Full API URL: ${fullApiUrl}`);

                    const response = await fetch(fullApiUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0',
                        },
                        cache: 'no-store', // Ensure fresh data with Next.js 15
                        signal: controller.signal,
                    });

                    // Enhanced debug response logging
                    console.log(`🔍 API Response status: ${response.status}`);

                    if (!response.ok) {
                        console.error(`❌ API request failed with status ${response.status}`);
                        const errorText = await response.text();
                        console.error(`❌ Error response body:`, errorText);
                        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
                    }

                    // Debug response
                    const data = await response.json();
                    console.log(`✅ API Response data received:`, data);

                    return data;
                } catch (error) {
                    attempts++;
                    console.error(`❌ Quizzes API call failed (attempt ${attempts}/${MAX_API_RETRIES})`, error);

                    if (attempts >= MAX_API_RETRIES) {
                        throw error;
                    }

                    // Exponential backoff with jitter
                    const delay = Math.min(500 * Math.pow(1.5, attempts) * (0.9 + Math.random() * 0.2), 5000);
                    console.log(`⏱️ Retrying in ${Math.round(delay)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            return null;
        } finally {
            // Clean up the controller
            controller.abort();
        }
    }, []);

    // Optimized quizzes load with proper error handling
    const loadQuizzes = useCallback(async (reset = false, refresh = false) => {
        // Debug info
        console.log(`loadQuizzes called with: reset=${reset}, refresh=${refresh}`);
        console.log(`Current state: isLoading=${isLoading}, isLoadingMore=${isLoadingMore}, hasMore=${hasMore}`);

        // Guard against redundant calls - but allow initial load
        if (reset && isLoading && !refresh && quizzes.length > 0) {
            console.log(`⚠️ Skipping redundant loadQuizzes call - already loading`);
            return;
        }

        if (!reset && isLoadingMore) {
            console.log(`⚠️ Skipping redundant loadQuizzes call - already loading more`);
            return;
        }

        if (!reset && !hasMore) {
            console.log(`⚠️ Skipping loadQuizzes call - no more data to load`);
            return;
        }

        // Set appropriate loading state
        if (reset) {
            if (refresh) {
                console.log(`Setting refresh state`);
                setIsRefreshing(true);
            } else {
                console.log(`Setting loading state`);
                setIsLoading(true);
            }
            // Reset quizzes for a fresh load, but keep existing data during a refresh
            if (!refresh) {
                setQuizzes([]);
            }
            setNextCursor(null);
        } else {
            console.log(`Setting loading more state`);
            setIsLoadingMore(true);
        }

        setError(null);

        try {
            // Build query parameters with type safety
            const params = new URLSearchParams();
            params.append('limit', QUIZZES_PER_PAGE.toString());

            if (nextCursor && !reset) {
                params.append('cursor', nextCursor);
            }

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            // Add timestamp parameter to bypass cache when refreshing
            params.append('_t', Date.now().toString());  // Always add a timestamp to bypass cache

            // Sort by can now be applied client-side after fetching
            const endpoint = `quizzes?${params.toString()}`;
            console.log(`Quizzes: Loading from ${endpoint}`);

            const response = await fetchQuizzesWithRetry(endpoint, reset);
            console.log(`Got response from fetchQuizzesWithRetry:`, !!response);

            if (!response) {
                throw new Error("Failed to fetch quizzes after multiple retries");
            }

            if (response.data) {
                console.log(`Response has data: ${response.data.length} quizzes`);
                // Update quizzes, ensuring we don't duplicate entries
                setQuizzes(prev => {
                    if (reset) return response.data;

                    // Create a Set of existing IDs for efficient lookup
                    const existingIds = new Set(prev.map(q => q.id));
                    // Filter out any duplicate quizzes that might be returned
                    const newQuizzes = response.data.filter(q => !existingIds.has(q.id));

                    return [...prev, ...newQuizzes];
                });

                // Update pagination state
                setHasMore(response.pagination.hasMore);
                setNextCursor(response.pagination.nextCursor);
                setRetryCount(0); // Reset retry count on success
                console.log(`Updated state: hasMore=${response.pagination.hasMore}, nextCursor=${response.pagination.nextCursor}`);
            } else {
                console.error('Unexpected response format', response);
                setError('Received unexpected data format from server');
            }
        } catch (error: any) {
            console.error('❌ Quizzes: Loading failed', error);
            setError(`Failed to load quizzes: ${error.message || 'Unknown error'}`);

            // Show toast only on initial load failures, not silent load more failures
            if (reset && !refresh) {
                toast({
                    title: "Error",
                    description: "Failed to load quizzes. Please try again.",
                    variant: "destructive",
                });
            }

            // Keep track of retries for the entire page
            setRetryCount(prev => prev + 1);
            console.log(`Retry count incremented to ${retryCount + 1}`);

            // Allow for auto-retry if we haven't exceeded the page-level retry limit
            if (retryCount < 2) {
                const delay = 1000 * (retryCount + 1);
                console.log(`⏱️ Will auto-retry in ${delay}ms`);
                setTimeout(() => loadQuizzes(reset), delay);
            }
        } finally {
            console.log(`Resetting loading states`);
            setIsLoading(false);
            setIsLoadingMore(false);
            setIsRefreshing(false);
        }
    }, [
        isLoading,
        isLoadingMore,
        hasMore,
        nextCursor,
        searchQuery,
        selectedStatus,
        fetchQuizzesWithRetry,
        toast,
        retryCount
    ]);

    // Debounce search input with increased delay
    useEffect(() => {
        console.log("Search/filter effect triggered with:", { searchQuery, selectedStatus });
        const timer = setTimeout(() => {
            loadQuizzes(true);
        }, SEARCH_DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
        // Only include the search dependencies, not the function itself
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, selectedStatus]);

    // Initial load - only run once
    useEffect(() => {
        console.log("Initial load effect triggered - once only");

        // Use setTimeout to ensure next render cycle
        const timer = setTimeout(() => {
            loadQuizzes(true);
        }, 0);

        return () => clearTimeout(timer);
        // Empty dependency array ensures this only runs once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLoadMore = () => {
        loadQuizzes(false);
    };

    const handleRefresh = () => {
        loadQuizzes(true, true);
    };

    const handleDeleteQuiz = async (id: string) => {
        if (!isAuthenticated) return;

        try {
            const response = await fetchApi(`/api/quizzes/${id}`, {
                method: "DELETE",
            });

            if (response.status >= 200 && response.status < 300) {
                // Update local state
                setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
                // Update global state
                deleteQuiz(id);
                toast({
                    title: "Success",
                    description: "Quiz deleted successfully",
                });
            } else {
                throw new Error(response.error || 'Failed to delete quiz');
            }
        } catch (error) {
            console.error("Delete quiz error:", error);
            toast({
                title: "Error",
                description: typeof error === 'object' && error !== null && 'message' in error
                    ? String(error.message)
                    : "Failed to delete quiz. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRegenerateImage = async (id: string) => {
        if (!isAuthenticated) return;

        try {
            // Fix the type issue by using any for the API response
            const apiResponse = await fetchApi(`/api/quizzes/${id}/regenerate-image`, {
                method: "POST",
            });

            // Extract image properties safely
            const response = apiResponse as any;
            const imageUrl = response?.imageUrl || '';
            const imagePrompt = response?.imagePrompt || '';

            // Update local state
            setQuizzes(prev => prev.map(quiz => {
                if (quiz.id === id) {
                    return {
                        ...quiz,
                        imageUrl: imageUrl || quiz.imageUrl,
                        imagePrompt: imagePrompt || quiz.imagePrompt,
                    };
                }
                return quiz;
            }));

            // Update global state
            regenerateQuizImage(id, imageUrl, imagePrompt);

            toast({
                title: "Success",
                description: "Quiz image regenerated successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to regenerate quiz image",
                variant: "destructive",
            });
        }
    };

    // Apply client-side sorting based on sortBy preference
    const sortedQuizzes = [...quizzes].sort((a, b) => {
        if (sortBy === "name") {
            return a.title.localeCompare(b.title);
        } else if (sortBy === "status") {
            const statusOrder = { "DRAFT": 0, "SCHEDULED": 1, "PUBLISHED": 2 };
            return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
        } else {
            // Sort by date (most recent first)
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        }
    });

    // Limit the display for non-authenticated users
    const displayQuizzes = isAuthenticated ? sortedQuizzes : sortedQuizzes.slice(0, 4);

    // Get readable status name
    const getStatusName = (status: string) => {
        switch (status) {
            case "DRAFT":
                return "Draft";
            case "SCHEDULED":
                return "Scheduled";
            case "PUBLISHED":
                return "Published";
            default:
                return status;
        }
    };

    // When there's an error but we have some quizzes, show inline error
    const renderError = () => {
        if (!error) return null;

        // Only show full error alert if we have no quizzes at all
        if (quizzes.length === 0) {
            return (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                        {error}
                        {retryCount >= 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-4"
                                onClick={() => loadQuizzes(true)}
                            >
                                Try Again
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            );
        }

        // If we have quizzes but load more failed, show inline message
        return (
            <div className="text-center mt-6 text-sm text-muted-foreground">
                <p className="mb-2">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadQuizzes(false)}
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

    // Handle single quiz selection
    const handleSelectQuiz = (id: string, selected: boolean) => {
        if (selected) {
            setSelectedQuizzes(prev => [...prev, id]);
        } else {
            setSelectedQuizzes(prev => prev.filter(quizId => quizId !== id));
        }
    };

    // Handle select all quizzes
    const handleSelectAll = () => {
        if (selectedQuizzes.length === displayQuizzes.length) {
            setSelectedQuizzes([]);
        } else {
            setSelectedQuizzes(displayQuizzes.map(quiz => quiz.id));
        }
    };

    // Handle bulk delete of selected quizzes
    const handleBulkDelete = async () => {
        if (!isAuthenticated || selectedQuizzes.length === 0) return;

        setIsBulkDeleting(true);
        try {
            const results = await Promise.allSettled(
                selectedQuizzes.map(id =>
                    fetchApi(`/api/quizzes/${id}`, { method: "DELETE" })
                )
            );

            // Count successes and failures
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failureCount = results.filter(r => r.status === 'rejected').length;

            // Update local state - remove deleted quizzes
            setQuizzes(prev => prev.filter(quiz => !selectedQuizzes.includes(quiz.id)));

            // Update global state
            selectedQuizzes.forEach(id => deleteQuiz(id));

            // Clear selection
            setSelectedQuizzes([]);

            // Notify user
            if (successCount === selectedQuizzes.length) {
                toast({
                    title: "Success",
                    description: `${successCount} ${successCount === 1 ? 'quiz' : 'quizzes'} deleted successfully`,
                });
            } else {
                toast({
                    title: "Partial Success",
                    description: `${successCount} deleted, ${failureCount} failed. Please try again for failed items.`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete selected quizzes",
                variant: "destructive",
            });
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Clear all selections
    const clearSelection = () => {
        setSelectedQuizzes([]);
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
                    <span className="text-foreground">Quizzes</span>
                </nav>

                {/* Quizzes header with gradient background */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex flex-col space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold flex items-center">
                                        <SquareStack className="mr-2 h-5 w-5 text-primary" />
                                        Quizzes
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        Create and manage your quizzes
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedQuizzes.length > 0 && isAuthenticated ? (
                                        <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-1.5 border border-primary/20 transition-all duration-300">
                                            <span className="text-primary font-medium text-sm">
                                                {selectedQuizzes.length} {selectedQuizzes.length === 1 ? 'quiz' : 'quizzes'}
                                            </span>
                                            <div className="h-4 w-px bg-primary/20"></div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearSelection}
                                                className="h-8 px-2 text-xs hover:bg-background/80 text-primary"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleBulkDelete}
                                                disabled={isBulkDeleting}
                                                className="h-8 px-3 text-xs"
                                            >
                                                {isBulkDeleting ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                        Delete
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRefresh}
                                                disabled={isRefreshing || isLoading}
                                                className="bg-background border-border/50"
                                            >
                                                {isRefreshing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="h-4 w-4" />
                                                )}
                                                <span className="sr-only">Refresh</span>
                                            </Button>

                                            <Link href="/dashboard/quizzes/new">
                                                <Button size="sm">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    New Quiz
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Filter controls */}
                            <div className="flex flex-col md:flex-row gap-4">
                                {isAuthenticated && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAll}
                                        className={`h-10 px-3 md:w-auto transition-all duration-300 ${selectedQuizzes.length > 0
                                            ? "bg-primary/5 border-primary/30 text-primary"
                                            : "bg-background"
                                            }`}
                                    >
                                        {selectedQuizzes.length > 0 && selectedQuizzes.length === displayQuizzes.length ? (
                                            <>
                                                <Square className="h-4 w-4 mr-2" />
                                                Deselect All
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare className="h-4 w-4 mr-2" />
                                                {selectedQuizzes.length > 0 ? "Select All" : "Select Items"}
                                            </>
                                        )}
                                    </Button>
                                )}
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search quizzes..."
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
                                        <Select
                                            value={selectedStatus}
                                            onValueChange={setSelectedStatus}
                                        >
                                            <SelectTrigger className="bg-background border-border/50">
                                                <div className="flex items-center">
                                                    <FilterX className="h-4 w-4 mr-2" />
                                                    <span className="truncate">
                                                        {selectedStatus === "all"
                                                            ? "All Status"
                                                            : selectedStatus.charAt(0) +
                                                            selectedStatus.slice(1).toLowerCase()}
                                                    </span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="DRAFT">Draft</SelectItem>
                                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                                <SelectItem value="PUBLISHED">Published</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-[160px]">
                                        <Select
                                            value={sortBy}
                                            onValueChange={(value) => setSortBy(value as "name" | "date" | "status")}
                                        >
                                            <SelectTrigger className="bg-background border-border/50">
                                                <div className="flex items-center">
                                                    <SortDesc className="h-4 w-4 mr-2" />
                                                    <span className="truncate">
                                                        {sortBy === "name"
                                                            ? "Sort by Name"
                                                            : sortBy === "status"
                                                                ? "Sort by Status"
                                                                : "Sort by Date"}
                                                    </span>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="date">Sort by Date</SelectItem>
                                                <SelectItem value="name">Sort by Name</SelectItem>
                                                <SelectItem value="status">Sort by Status</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <div className="grid grid-cols-12 gap-6">
                {/* Main content (quizzes list) */}
                <div className="col-span-12 lg:col-span-9">
                    {/* Error alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription className="flex items-center">
                                {error}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto"
                                    onClick={() => loadQuizzes(true)}
                                >
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Initial loading state */}
                    {isLoading && !error && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <QuizCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No quizzes state */}
                    {!isLoading && !error && displayQuizzes.length === 0 && (
                        <Card className="border shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Sparkles className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No quizzes found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery || selectedStatus !== "all"
                                        ? "Try adjusting your filters or search term"
                                        : "Get started by creating your first quiz"}
                                </p>
                                {!searchQuery && selectedStatus === "all" && (
                                    <Button asChild>
                                        <Link href="/dashboard/quizzes/new">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New Quiz
                                        </Link>
                                    </Button>
                                )}
                                {(searchQuery || selectedStatus !== "all") && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedStatus("all");
                                        }}
                                    >
                                        <FilterX className="h-4 w-4 mr-2" />
                                        Clear Filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Quizzes list */}
                    {!isLoading && !error && displayQuizzes.length > 0 && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayQuizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz.id}
                                        quiz={quiz}
                                        onDelete={handleDeleteQuiz}
                                        onRegenerateImage={handleRegenerateImage}
                                        showActions={isAuthenticated}
                                        selectable={isAuthenticated}
                                        selected={selectedQuizzes.includes(quiz.id)}
                                        onSelect={handleSelectQuiz}
                                    />
                                ))}
                            </div>

                            {/* Load more button */}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <QuizCardSkeleton key={i} />
                                    ))}
                                </div>
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
                                Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Quizzes</span>
                                    <span className="font-medium">{analytics.totalQuizzes}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center">
                                        <Globe className="h-3 w-3 mr-1 text-green-500" />
                                        Published
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{
                                                    width: `${analytics.totalQuizzes ? (analytics.published / analytics.totalQuizzes) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.published}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center">
                                        <Clock className="h-3 w-3 mr-1 text-amber-500" />
                                        Drafts
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{
                                                    width: `${analytics.totalQuizzes ? (analytics.drafts / analytics.totalQuizzes) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.drafts}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center">
                                        <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                                        Scheduled
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{
                                                    width: `${analytics.totalQuizzes ? (analytics.scheduled / analytics.totalQuizzes) * 100 : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.scheduled}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                                    <span className="text-muted-foreground flex items-center">
                                        <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                                        Engagement
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${analytics.engagement}%` }}
                                            />
                                        </div>
                                        <span className="font-medium">{analytics.engagement}%</span>
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
                                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                        Smart Scheduling
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Create quizzes in batches and use the calendar to schedule them for consistent engagement with your audience.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-muted/20 border">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                        Visual Impact
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Quizzes with custom images receive up to 2x more engagement. Use the regenerate image feature for fresh visuals.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-muted/20 border">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <FileType className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                                        Template Magic
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Start with a template from our gallery to save time. Popular formats include Wordle, Number Sequences, and Rhyme Time.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-muted/20 border">
                                    <h4 className="text-sm font-medium flex items-center">
                                        <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                                        Quick Actions
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use the bulk selection tool to manage multiple quizzes at once for faster workflow. Select similar quizzes and apply common actions.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Floating action button for bulk actions on mobile */}
                {selectedQuizzes.length > 0 && isAuthenticated && (
                    <div className="fixed bottom-6 right-6 md:hidden z-50">
                        <div className="flex flex-col gap-2 items-end">
                            <div className="bg-primary/90 text-primary-foreground text-xs font-medium py-2 px-3 rounded-full shadow-lg backdrop-blur-sm">
                                {selectedQuizzes.length} selected
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="h-12 w-12 p-0 rounded-full bg-background shadow-lg border-primary/20"
                                >
                                    <X className="h-5 w-5 text-primary" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="h-12 w-12 p-0 shadow-lg rounded-full"
                                >
                                    {isBulkDeleting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Select mode indicator */}
                {selectedQuizzes.length === 0 && isAuthenticated && (
                    <div
                        onClick={handleSelectAll}
                        className="md:hidden fixed bottom-6 right-6 z-50 h-12 w-12 bg-primary rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200"
                    >
                        <CheckSquare className="h-5 w-5 text-primary-foreground" />
                    </div>
                )}
            </div>
        </div>
    );
} 