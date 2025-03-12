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
import { QuizCardSkeleton } from "@/components/ui/skeletons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { generateQuizImage } from '@/lib/quiz';
import { useStore } from "@/lib/store";
import type { Quiz, QuizStatus } from "@/lib/types";
import { ArrowRight, Calendar, Eye, Filter, LayoutGrid, LayoutList, MoreVertical, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PaginatedResponse {
  data: Quiz[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function QuizzesPage() {
  const { toast } = useToast();
  const { quizzes, setQuizzes } = useStore();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuizStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "status">("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const { simulateLoading } = useLoadingDelay();

  // Define loadQuizzes function outside useEffect
  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await simulateLoading(fetchApi<PaginatedResponse>("/quizzes"));
      console.log('API Response:', response);

      if (response && response.data) {
        console.log('Loaded quizzes:', response.data.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          imageUrl: quiz.imageUrl,
          status: quiz.status
        })));
        setQuizzes(response.data);
        setTotalPages(response.pagination.totalPages);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizzes();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      await fetchApi(`/quizzes/${id}`, {
        method: "DELETE",
      });

      // Remove quiz from store
      setQuizzes(quizzes.filter(quiz => quiz.id !== id));

      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateImage = async (quizId: string) => {
    if (!isAuthenticated) return;

    try {
      toast({
        title: "Regenerating image",
        description: "This may take a few seconds...",
      });

      // Use the loading delay here as well
      await simulateLoading(generateQuizImage(quizId));

      // Refresh quiz list to show the new image
      loadQuizzes();

      toast({
        title: "Success",
        description: "Image regenerated successfully",
      });
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate image",
        variant: "destructive",
      });
    }
  };

  // Filter and sort quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || quiz.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "status":
        return a.status.localeCompare(b.status);
      case "date":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // For non-authenticated users, show only a limited number of quizzes
  const displayQuizzes = isAuthenticated
    ? filteredQuizzes
    : filteredQuizzes.filter(quiz => quiz.status === 'PUBLISHED').slice(0, 6);

  const getStatusVariant = (status: QuizStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "PUBLISHED":
        return "bg-green-50 text-green-600 border-green-200";
      case "SCHEDULED":
        return "bg-blue-50 text-blue-600 border-blue-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const getStatusLabel = (status: QuizStatus) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "PUBLISHED":
        return "Published";
      case "SCHEDULED":
        return "Scheduled";
      default:
        return status;
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Quiz Library
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
            <p className="text-muted-foreground text-lg">
              Browse and manage your quizzes
            </p>
          </div>
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/quizzes/new">
                <Plus className="mr-2 h-4 w-4" /> Create Quiz
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/auth/login?callbackUrl=/quizzes">
                <ArrowRight className="mr-2 h-4 w-4" /> Login to Create Quizzes
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>Login to create your own quizzes and access all available quizzes.</div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login?callbackUrl=/quizzes">Login</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search quizzes..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAuthenticated && (
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Filter</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Drafts</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <span>Sort By</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most Recent</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Button className="px-2" onClick={() => setView(view === "grid" ? "list" : "grid")}>
          {view === "grid" ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
        </Button>

        <Tabs defaultValue="grid" onValueChange={(value) => setView(value as "grid" | "list")}>
          <TabsList className="grid w-[160px] grid-cols-2">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        // Loading skeletons
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-4"}>
          {Array(8).fill(0).map((_, i) => (
            <QuizCardSkeleton key={i} view={view} />
          ))}
        </div>
      ) : displayQuizzes.length > 0 ? (
        // Quiz list/grid
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-4"}>
          {displayQuizzes.map((quiz) => (
            <Card key={quiz.id} className={view === "list" ? "overflow-hidden" : "overflow-hidden h-full flex flex-col"}>
              {view === "grid" && (
                <div className="aspect-square relative bg-muted">
                  {quiz.imageUrl ? (
                    <Image
                      src={quiz.imageUrl}
                      alt={quiz.title}
                      className="object-contain"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">No image available</span>
                    </div>
                  )}
                </div>
              )}

              <CardContent className={`p-4 ${view === "grid" ? "flex-1" : "flex items-center"}`}>
                {view === "list" && quiz.imageUrl && (
                  <div className="flex-shrink-0 h-16 w-16 mr-4 relative rounded overflow-hidden">
                    <Image
                      src={quiz.imageUrl}
                      alt={quiz.title}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                )}

                <div className={view === "grid" ? "" : "flex-1"}>
                  <h3 className="font-semibold text-lg line-clamp-1">{quiz.title}</h3>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getStatusVariant(quiz.status)}>
                      {getStatusLabel(quiz.status)}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      {formatDate(quiz.createdAt)}
                    </span>
                  </div>
                </div>

                {view === "list" && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/quizzes/${quiz.id}/preview`}>
                        <Eye className="h-4 w-4" />
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
                            <Link href={`/quizzes/${quiz.id}/preview`}>View & Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRegenerateImage(quiz.id)}>
                            Regenerate Image
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/calendar?quizId=${quiz.id}`}>
                              <Calendar className="mr-2 h-4 w-4" /> Schedule
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                <span className="text-destructive">Delete</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the quiz
                                  and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(quiz.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
              </CardContent>

              {view === "grid" && (
                <CardFooter className="p-4 pt-0 mt-auto flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/quizzes/${quiz.id}/preview`}>
                      <Eye className="mr-2 h-4 w-4" /> View & Edit
                    </Link>
                  </Button>

                  {isAuthenticated && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/quizzes/${quiz.id}/preview`}>View & Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRegenerateImage(quiz.id)}>
                          Regenerate Image
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/calendar?quizId=${quiz.id}`}>
                            <Calendar className="mr-2 h-4 w-4" /> Schedule
                          </Link>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the quiz
                                and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(quiz.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">No quizzes found</p>
        </div>
      )}
    </div>
  );
}