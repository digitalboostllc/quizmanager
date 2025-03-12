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
import type { Template } from "@/lib/types";
import { ArrowRight, Clock, Eye, Filter, MoreVertical, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TemplatesPage() {
  const { templates, deleteTemplate, setTemplates } = useStore();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "type" | "recent">("recent");
  const { simulateLoading } = useLoadingDelay();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      try {
        console.log('Templates: Starting to load, will apply loading delay');
        const data = await simulateLoading(fetchApi<Template[]>("/templates"));
        console.log('Templates: Loading completed');
        setTemplates(data);
      } catch (error) {
        console.error('Templates: Loading failed', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, [setTemplates, toast, simulateLoading]);

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      await fetchApi(`/templates/${id}`, {
        method: "DELETE",
      });
      deleteTemplate(id);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates
    .filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || template.quizType === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
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
  const displayTemplates = isAuthenticated ? filteredTemplates : filteredTemplates.slice(0, 4);

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
          ) : (
            <Button asChild>
              <Link href="/auth/login?callbackUrl=/templates">
                <ArrowRight className="mr-2 h-4 w-4" /> Login to Create Templates
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>Login to create your own templates and access all available templates.</div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login?callbackUrl=/templates">Login</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <span>Filter by Type</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.keys(QUIZ_TYPE_LABELS).map((type) => (
              <SelectItem key={type} value={type}>
                {QUIZ_TYPE_LABELS[type as keyof typeof QUIZ_TYPE_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Sort By</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates grid with loading state */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Skeleton loading state
          Array(8).fill(0).map((_, index) => (
            <TemplateCardSkeleton key={index} />
          ))
        ) : (
          // Actual templates
          displayTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="aspect-square relative">
                {template.imageUrl ? (
                  <Image
                    src={template.imageUrl}
                    alt={template.name}
                    className="object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="bg-muted flex items-center justify-center w-full h-full">
                    <span className="text-muted-foreground">No preview available</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex-1">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">{template.name}</h3>

                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {QUIZ_TYPE_LABELS[template.quizType]}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {template.description || "No description provided"}
                </p>
              </CardContent>
              <CardFooter className="px-4 py-3 border-t flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/templates/${template.id}`} className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" /> View
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
                        <Link href={`/quizzes/new?templateId=${template.id}`} className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" /> Create Quiz
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/templates/${template.id}`} className="flex items-center">
                          <Pencil className="mr-2 h-4 w-4" /> Edit Template
                        </Link>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the template
                              and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(template.id)}>
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
          ))
        )}
      </div>

      {!isLoading && !isAuthenticated && displayTemplates.length < filteredTemplates.length && (
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/auth/login?callbackUrl=/templates">
              Login to View All {filteredTemplates.length} Templates
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && displayTemplates.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedType !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first template to get started"}
          </p>
          {isAuthenticated && (
            <Button asChild>
              <Link href="/templates/new">
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
} 