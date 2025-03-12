"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ButtonLoader, LoadingIndicator } from "@/components/ui/loading-indicator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { downloadGeneratedImage, generateImage } from "@/lib/image";
import type { Quiz } from "@/lib/types";
import { LANGUAGES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, CalendarIcon, Download, ExternalLink, Facebook, ImageIcon, Info, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type StepStatus = 'pending' | 'loading' | 'complete' | 'error';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

const editQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  answer: z.string().min(1, "Answer is required"),
  solution: z.string().optional(),
  language: z.string().min(2, "Language is required"),
  scheduledFor: z.string().datetime().optional().nullable(),
  variables: z.record(z.unknown()),
});

type EditQuizForm = z.infer<typeof editQuizSchema>;

const getStatusVariant = (status: Quiz['status']): "default" | "secondary" | "destructive" | "outline" | "success" | "info" => {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'SCHEDULED':
      return 'info';
    case 'READY':
      return 'default';
    case 'FAILED':
      return 'destructive';
    case 'DRAFT':
    default:
      return 'secondary';
  }
};

interface ScheduleResponse {
  success: boolean;
  schedule: {
    id: string;
    scheduledAt: string;
    quizId: string;
  };
}

export default function QuizPreviewPage({ params }: PreviewPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('preview');
  const [isPublishing, setIsPublishing] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [schedulingSteps, setSchedulingSteps] = useState<Record<string, StepStatus>>({
    findSlot: 'pending',
    createSchedule: 'pending',
  });
  const [previewHtml, setPreviewHtml] = useState("");

  const form = useForm<EditQuizForm>({
    resolver: zodResolver(editQuizSchema),
    defaultValues: {
      title: "",
      answer: "",
      solution: "",
      language: "en",
      scheduledFor: null,
      variables: {},
    },
  });

  const updatePreview = useCallback((quizData: Quiz) => {
    let processedHtml = quizData.template.html;

    // Replace template variables with quiz values
    const variables = {
      ...quizData.template.variables,
      ...quizData.variables,
      title: quizData.title,
      answer: quizData.answer,
    };

    // Process each variable
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      let replacement = "";

      if (Array.isArray(value)) {
        replacement = value.join('\n');
      } else if (typeof value === 'object' && value !== null) {
        replacement = JSON.stringify(value);
      } else {
        replacement = String(value || '');
      }

      processedHtml = processedHtml.replace(regex, replacement);
    });

    const fullHtml = `
      <style>${quizData.template.css}</style>
      ${processedHtml}
    `;

    setPreviewHtml(fullHtml);
  }, []);

  useEffect(() => {
    if (quiz) {
      form.reset({
        title: quiz.title,
        answer: quiz.answer,
        solution: quiz.solution || "",
        language: quiz.language,
        scheduledFor: quiz.scheduledPost?.scheduledAt || null,
        variables: quiz.variables || {},
      });
    }
  }, [quiz, form]);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await fetchApi<Quiz>(`/quizzes/${id}`);
        setQuiz(data);
        updatePreview(data);
        form.reset({
          title: data.title,
          answer: data.answer,
          solution: data.solution || "",
          language: data.language,
          scheduledFor: data.scheduledPost?.scheduledAt || null,
          variables: data.variables || {},
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to load quiz",
          variant: "destructive",
        });
        router.push("/quizzes");
      }
    }

    loadQuiz();
  }, [id, router, toast, updatePreview, form]);

  const handleGenerateImage = useCallback(async () => {
    if (!quiz) return;

    try {
      setSchedulingSteps(prev => ({ ...prev, findSlot: 'loading' }));
      const previewElement = document.getElementById("quiz-preview");
      if (!previewElement) return;

      // Generate filename from quiz title
      const filename = `${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`;

      const imageUrl = await generateImage(previewElement, {
        width: 1080,
        height: 1080,
        filename,
      });

      // Update quiz with image URL
      const updatedQuiz = await fetchApi<Quiz>(`/quizzes/${quiz.id}`, {
        method: "PUT",
        body: {
          imageUrl,
        },
      });

      setQuiz(updatedQuiz);
      toast({
        title: "Success",
        description: "Preview image generated successfully",
        variant: "default"
      });

      // If this was triggered from the share tab, download the image
      if (activeTab === "share") {
        await downloadGeneratedImage(imageUrl, filename);
      }
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to generate image',
      });
    } finally {
      setSchedulingSteps(prev => ({ ...prev, findSlot: 'pending' }));
    }
  }, [quiz, toast, activeTab]);

  const handlePublishToFacebook = useCallback(async () => {
    if (!quiz) {
      toast({
        title: "Error",
        description: "Quiz not found",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);

    try {
      let currentImageUrl = quiz.imageUrl;

      // Generate image if not exists
      if (!currentImageUrl) {
        console.log('Generating quiz image...');
        const imageResponse = await fetchApi<{ imageUrl: string }>(`quizzes/${quiz.id}/generate-image`);
        currentImageUrl = imageResponse.imageUrl;

        if (!currentImageUrl) {
          throw new Error("Failed to generate quiz image");
        }

        // Update quiz with new image
        console.log('Updating quiz with new image...');
        const updateResponse = await fetchApi<Quiz>(`quizzes/${quiz.id}`, {
          method: 'PUT',
          body: { imageUrl: currentImageUrl }
        });

        if (!updateResponse) {
          throw new Error("Failed to update quiz with new image");
        }

        setQuiz(updateResponse);
      }

      // Post to Facebook
      console.log('Posting to Facebook...');
      const response = await fetchApi<{ success: boolean; postId: string }>('facebook-posts', {
        method: 'POST',
        body: { quizId: quiz.id }
      });

      if (!response?.success) {
        throw new Error("Failed to post to Facebook");
      }

      // Refresh quiz data
      const updatedQuiz = await fetchApi<Quiz>(`quizzes/${quiz.id}`);
      setQuiz(updatedQuiz);

      toast({
        title: "Success",
        description: "Quiz published to Facebook successfully!",
      });

      router.push("/quizzes");

    } catch (err) {
      console.error('Publishing error:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to publish quiz";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  }, [quiz, router, toast]);

  const handleSave = async (data: EditQuizForm) => {
    try {
      const response = await fetch(`/api/scheduled-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz?.id,
          scheduledAt: data.scheduledFor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule quiz');
      }

      toast({
        title: 'Success',
        description: 'Quiz scheduled successfully',
      });
    } catch (err) {
      console.error('Error scheduling quiz:', err);
      toast({
        title: 'Error',
        description: 'Failed to schedule quiz',
        variant: 'destructive',
      });
    }
  };

  const handleScheduleNext = async () => {
    if (!quiz) {
      toast({
        title: "Error",
        description: "Quiz not found",
        variant: "destructive"
      });
      return;
    }

    setSchedulingSteps({
      findSlot: 'loading',
      createSchedule: 'pending'
    });

    try {
      // Find next available slot
      console.log('Finding next available slot...');
      const slotResponse = await fetchApi<{ scheduledAt: string }>('auto-schedule-slots/next-available');

      if (!slotResponse?.scheduledAt) {
        throw new Error("No available slot found");
      }
      console.log('Found available slot:', slotResponse.scheduledAt);
      setSchedulingSteps(prev => ({ ...prev, findSlot: 'complete', createSchedule: 'loading' }));

      // Create the schedule
      console.log('Creating schedule...');
      const response = await fetchApi<ScheduleResponse>('scheduled-posts', {
        method: 'POST',
        body: {
          quizId: quiz.id,
          scheduledAt: slotResponse.scheduledAt
        }
      });

      if (!response.success) {
        throw new Error("Failed to create schedule");
      }

      // Refresh quiz data
      const updatedQuiz = await fetchApi<Quiz>(`quizzes/${quiz.id}`);
      setQuiz(updatedQuiz);

      setSchedulingSteps(prev => ({ ...prev, createSchedule: 'complete' }));

      // Show success message with schedule time
      const scheduleDate = new Date(slotResponse.scheduledAt);
      const existingSchedules = updatedQuiz.scheduledPost ? 1 : 0;
      const message = existingSchedules > 0
        ? `Quiz scheduled for ${format(scheduleDate, "PPP 'at' p")}. This quiz now has ${existingSchedules + 1} scheduled posts.`
        : `Quiz scheduled for ${format(scheduleDate, "PPP 'at' p")}.`;

      toast({
        title: "Success",
        description: message,
      });

    } catch (error) {
      console.error('Scheduling error:', error);
      setSchedulingSteps({
        findSlot: error instanceof Error && error.message === "No available slot found" ? 'error' : 'complete',
        createSchedule: error instanceof Error && error.message === "No available slot found" ? 'pending' : 'error'
      });

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule quiz",
        variant: "destructive"
      });
    } finally {
      // Reset steps after a delay
      setTimeout(() => {
        setSchedulingSteps({
          findSlot: 'pending',
          createSchedule: 'pending'
        });
      }, 3000);
    }
  };

  if (!quiz) {
    return (
      <div className="container py-8 space-y-8">
        <LoadingIndicator
          size="lg"
          message="Loading quiz data..."
          centered={true}
          className="h-[300px]"
        />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 border-b pb-6 pt-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1 max-w-[500px]">
                  <h1 className="text-3xl font-bold truncate">{quiz?.title}</h1>
                  <p className="text-muted-foreground mt-1 truncate">
                    Template: {quiz?.template.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusVariant(quiz?.status)}>
                {quiz?.status}
              </Badge>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleScheduleNext}
                disabled={schedulingSteps.findSlot === 'loading' || isPublishing}
              >
                {schedulingSteps.findSlot === 'loading' ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Schedule Next
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleGenerateImage}
                disabled={schedulingSteps.findSlot === 'loading' || isPublishing}
              >
                {schedulingSteps.findSlot === 'loading' ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
              <Button
                className="gap-2"
                onClick={handlePublishToFacebook}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <ButtonLoader />
                ) : (
                  <>
                    <Facebook className="h-4 w-4" />
                    Publish to Facebook
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Scheduling Progress */}
      {schedulingSteps.findSlot === 'loading' && (
        <div className="bg-muted/40 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Scheduling Progress</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <ButtonLoader className="text-primary" />
              <span className="text-sm">Finding available slots...</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="pb-6">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="preview" className="m-0">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Preview */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>See how your quiz will appear to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    id="quiz-preview"
                    className={cn(
                      "w-full aspect-square bg-white rounded-lg overflow-hidden shadow-lg relative",
                      { "opacity-50": schedulingSteps.findSlot === 'loading' }
                    )}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  {schedulingSteps.findSlot === 'loading' && (
                    <div className="absolute bottom-4 right-4 bg-background/90 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
                      <ButtonLoader />
                      <span className="text-sm font-medium">Generating image...</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGenerateImage}
                    disabled={schedulingSteps.findSlot === 'loading' || isPublishing}
                  >
                    {schedulingSteps.findSlot === 'loading' ? (
                      <ButtonLoader />
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        Generate Preview Image
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {quiz.status === "SCHEDULED" && quiz.scheduledPost ? (
                          <>Scheduled for {formatDate(quiz.scheduledPost.scheduledAt)}</>
                        ) : quiz.status === "PUBLISHED" ? (
                          <>Published on {formatDate(quiz.createdAt)}</>
                        ) : (
                          <>Last updated {formatDate(quiz.updatedAt)}</>
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Answer
                      </h3>
                      <p className="text-sm text-muted-foreground">{quiz.answer}</p>
                    </div>
                  </CardContent>
                </Card>

                {quiz.variables?.hints && quiz.variables.hints.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Hints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {quiz.variables.hints.map((hint, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-sm font-medium">{index + 1}.</span>
                            <p className="text-sm text-muted-foreground flex-1">{hint}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="m-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Edit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Edit Quiz</CardTitle>
                  <CardDescription>Update quiz content and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Answer</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="solution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Solution</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(LANGUAGES).map(([code, name]) => (
                                  <SelectItem key={code} value={code}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.reset()}
                        >
                          Reset
                        </Button>
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Template & Variables */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Name</span>
                        <span className="font-medium">{quiz.template.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Type</span>
                        <span className="font-medium">{quiz.template.quizType}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] rounded-md border p-4">
                      <pre className="text-sm text-muted-foreground">
                        {JSON.stringify(quiz.variables, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="publish" className="m-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Publication</CardTitle>
                  <CardDescription>Set when to publish your quiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...form}>
                    <FormField
                      control={form.control}
                      name="scheduledFor"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Schedule For</FormLabel>
                          <div className="flex flex-col gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP 'at' p")
                                    ) : (
                                      <span>Pick a date and time</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => field.onChange(date?.toISOString() ?? null)}
                                  disabled={(date) => date < new Date()}
                                />
                                {field.value && (
                                  <div className="p-3 border-t">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-destructive"
                                      onClick={() => field.onChange(null)}
                                    >
                                      Clear scheduling
                                    </Button>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>

                  <div className="space-y-4">
                    <h3 className="font-medium">Status Timeline</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Created</span>
                        <span>{formatDate(quiz.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Last Updated</span>
                        <span>{formatDate(quiz.updatedAt)}</span>
                      </div>
                      {quiz.scheduledPost && (
                        <div className="flex items-center justify-between">
                          <span>Scheduled For</span>
                          <span>{formatDate(quiz.scheduledPost.scheduledAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => form.handleSubmit(handleSave)()}
                  >
                    Save Schedule
                  </Button>
                </CardFooter>
              </Card>

              {/* Facebook Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook Integration
                  </CardTitle>
                  <CardDescription>Manage your Facebook posts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3 border rounded-lg p-4">
                    {quiz.fbPostId ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Latest Post ID</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {quiz.fbPostId}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="success" className="capitalize">Published</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Published At</span>
                          <span>{formatDate(quiz.updatedAt)}</span>
                        </div>
                        <Separator />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => window.open(`https://facebook.com/${quiz.fbPostId}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View on Facebook
                          </Button>
                          <Button
                            className="w-full gap-2"
                            onClick={handlePublishToFacebook}
                            disabled={isPublishing}
                          >
                            {isPublishing ? (
                              <ButtonLoader />
                            ) : (
                              <>
                                <Facebook className="h-4 w-4" />
                                Publish Again
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <p className="text-muted-foreground">Not yet posted to Facebook</p>
                        <Button
                          className="gap-2"
                          onClick={handlePublishToFacebook}
                          disabled={isPublishing}
                        >
                          {isPublishing ? (
                            <ButtonLoader />
                          ) : (
                            <>
                              <Facebook className="h-4 w-4" />
                              Publish Now
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Share Options</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleGenerateImage}
                        disabled={schedulingSteps.findSlot === 'loading' || isPublishing}
                      >
                        {schedulingSteps.findSlot === 'loading' ? (
                          <ButtonLoader />
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download Image
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 