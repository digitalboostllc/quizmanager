"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { ButtonLoader, LoadingIndicator } from "@/components/ui/loading-indicator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/date";
import type { Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Home,
    ImageIcon,
    Loader2,
    Pencil,
    RefreshCw,
    SquareStack
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Grid background style
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

type StepStatus = 'pending' | 'loading' | 'complete' | 'error';

interface QuizDetailPageProps {
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

interface ScheduleSlot {
    dayOfWeek: number;
    timeOfDay: string;
    formattedTime?: string;
}

export default function DashboardQuizDetailPage({ params }: QuizDetailPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('schedule');
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [template, setTemplate] = useState<Quiz['template'] | null>(null);
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [schedulingSteps, setSchedulingSteps] = useState<Record<string, StepStatus>>({
        findSlot: 'pending',
        createSchedule: 'pending',
    });
    const [previewHtml, setPreviewHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<ScheduleSlot[]>([]);
    const [nextAvailableSlot, setNextAvailableSlot] = useState<string | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [quickOptions, setQuickOptions] = useState<{ label: string, value: string }[]>([]);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState<string>("12:00");
    const scrollContainerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const [scrollStates, setScrollStates] = useState<{ [key: number]: { left: number; isAtEnd: boolean } }>({});

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

    const updatePreview = useCallback((quizData: Quiz, templateData?: Quiz['template']) => {
        const templateToUse = templateData || quiz?.template;
        if (!quizData || !templateToUse || !templateToUse.html) {
            console.log("Missing template data for preview", quizData);
            setPreviewHtml("");
            return;
        }

        let processedHtml = templateToUse.html;

        // Replace template variables with quiz values
        const variables = {
            ...templateToUse.variables,
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
      <style>${templateToUse.css || ''}</style>
      ${processedHtml}
    `;

        setPreviewHtml(fullHtml);
    }, [quiz]);

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
                const quizData = await fetchApi<Quiz>(`/api/quizzes/${id}`);

                if (!quizData) {
                    throw new Error("Failed to load quiz data");
                }

                setQuiz(quizData);

                // If template data is already included, use it
                if (quizData.template) {
                    setTemplate(quizData.template);
                    updatePreview(quizData, quizData.template);
                } else {
                    // Otherwise, fetch the template separately
                    try {
                        const templateData = await fetchApi<Quiz['template']>(`/api/templates/${quizData.templateId}`);
                        if (templateData) {
                            setTemplate(templateData);
                            updatePreview(quizData, templateData);
                        }
                    } catch (templateError) {
                        console.error("Failed to load template:", templateError);
                        toast({
                            title: "Warning",
                            description: "Failed to load template data",
                            variant: "warning",
                        });
                    }
                }

                form.reset({
                    title: quizData.title || "",
                    answer: quizData.answer || "",
                    solution: quizData.solution || "",
                    language: quizData.language || "en",
                    scheduledFor: quizData.scheduledPost?.scheduledAt || null,
                    variables: quizData.variables || {},
                });
            } catch (error) {
                console.error("Failed to load quiz:", error);
                toast({
                    title: "Error",
                    description: "Failed to load quiz",
                    variant: "destructive",
                });
                router.push("/dashboard/quizzes");
            }
        }

        loadQuiz();
    }, [id, router, toast, updatePreview, form]);

    useEffect(() => {
        // Generate quick scheduling options
        const now = new Date();
        const options = [
            {
                label: 'Tomorrow',
                value: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0).toISOString()
            },
            {
                label: 'This Weekend',
                value: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()), 10, 0).toISOString()
            },
            {
                label: 'Next Monday',
                value: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (8 - now.getDay()), 9, 0).toISOString()
            },
            {
                label: 'Next Week',
                value: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12, 0).toISOString()
            }
        ];
        setQuickOptions(options);
    }, []);

    const handleSaveQuiz = async (data: EditQuizForm) => {
        if (!quiz) return;

        setIsSaving(true);

        try {
            const updatedQuiz = await fetchApi<Quiz>(`/api/quizzes/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    title: data.title,
                    answer: data.answer,
                    solution: data.solution || null,
                    language: data.language,
                    variables: data.variables || {},
                }),
            });

            setQuiz(updatedQuiz);
            updatePreview(updatedQuiz);

            toast({
                title: "Success",
                description: "Quiz updated successfully",
            });
        } catch (error) {
            console.error("Failed to update quiz:", error);
            toast({
                title: "Error",
                description: "Failed to update quiz",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!quiz) return;

        try {
            toast({
                title: "Generating image",
                description: "This may take a few moments...",
            });

            const updatedQuiz = await fetchApi<Quiz>(`/api/quizzes/${id}/regenerate-image`, {
                method: "POST",
            });

            setQuiz(updatedQuiz);

            toast({
                title: "Success",
                description: "Image generated successfully",
            });
        } catch (error) {
            console.error("Failed to generate image:", error);
            toast({
                title: "Error",
                description: "Failed to generate image",
                variant: "destructive",
            });
        }
    };

    const handlePublishQuiz = async () => {
        if (!quiz) return;

        setIsPublishing(true);

        try {
            const updatedQuiz = await fetchApi<Quiz>(`/api/quizzes/${id}/publish`, {
                method: "POST",
            });

            setQuiz(updatedQuiz);

            toast({
                title: "Success",
                description: "Quiz published successfully",
            });
        } catch (error) {
            console.error("Failed to publish quiz:", error);
            toast({
                title: "Error",
                description: "Failed to publish quiz",
                variant: "destructive",
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const loadAvailableSlots = async () => {
        setIsLoadingSlots(true);
        try {
            // Get all slots first to check if any exist
            const allSlots = await fetchApi<ScheduleSlot[]>('/api/auto-schedule-slots');
            let formattedSlots: ScheduleSlot[] = [];

            if (Array.isArray(allSlots) && allSlots.length > 0) {
                // Add formatted time for display
                formattedSlots = allSlots.map(slot => {
                    const [hours, minutes] = slot.timeOfDay.split(':');
                    const hour = parseInt(hours);
                    const hour12 = hour % 12 || 12;
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    return {
                        ...slot,
                        formattedTime: `${hour12}:${minutes} ${ampm}`
                    };
                });
                setAvailableSlots(formattedSlots);

                // Only try to get next available slot if we have slots
                try {
                    const nextSlot = await fetchApi<{ scheduledAt: string }>('/api/auto-schedule-slots/next-available');
                    if (nextSlot && nextSlot.scheduledAt) {
                        setNextAvailableSlot(nextSlot.scheduledAt);
                    }
                } catch (error) {
                    // If no active slots are found, this will fail but that's expected
                    console.log('No active schedule slots available');
                }
            } else {
                // No slots found at all
                setAvailableSlots([]);
            }
        } catch (error) {
            console.error('Failed to load scheduling slots:', error);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleToggleScheduler = async () => {
        const newState = !showScheduler;
        setShowScheduler(newState);
        if (newState && availableSlots.length === 0) {
            await loadAvailableSlots();
        }
    };

    const handleScheduleQuiz = async (scheduledAt: string) => {
        if (!quiz?.id) return;

        try {
            setIsLoading(true);

            // Create the scheduled post
            await fetchApi<ScheduleResponse>('/api/scheduled-posts', {
                method: 'POST',
                body: {
                    quizId: quiz.id,
                    scheduledAt
                }
            });

            // Fetch the updated quiz data to refresh the UI
            const updatedQuiz = await fetchApi<Quiz>(`/api/quizzes/${quiz.id}`);
            setQuiz(updatedQuiz);

            toast({
                title: "Success",
                description: "Quiz scheduled successfully"
            });

            // Close the scheduler drawer if it's open
            setShowScheduler(false);
        } catch (error) {
            console.error("Failed to schedule quiz:", error);
            toast({
                title: "Error",
                description: "Failed to schedule quiz",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleScheduleNext = async () => {
        if (!quiz?.id) return;

        try {
            setSchedulingSteps({ findSlot: 'loading' });

            // Get the next available slot
            const slotResponse = await fetchApi<{ scheduledAt: string }>('/api/auto-schedule-slots/next-available');

            if (!slotResponse?.scheduledAt) {
                throw new Error("No available slot found");
            }

            // Create the schedule using the automatically selected slot
            await fetchApi<ScheduleResponse>('/api/scheduled-posts', {
                method: 'POST',
                body: {
                    quizId: quiz.id,
                    scheduledAt: slotResponse.scheduledAt
                }
            });

            // Fetch the updated quiz data to refresh the UI
            const updatedQuiz = await fetchApi<Quiz>(`/api/quizzes/${quiz.id}`);
            setQuiz(updatedQuiz);

            toast({
                title: "Success",
                description: "Quiz scheduled for the next available slot"
            });
        } catch (error) {
            console.error("Failed to schedule quiz:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to schedule quiz",
                variant: "destructive"
            });
        } finally {
            setSchedulingSteps({ findSlot: 'pending' });
        }
    };

    const handleDeleteQuiz = async () => {
        if (!quiz) return;

        try {
            await fetchApi(`/api/quizzes/${id}`, {
                method: "DELETE",
            });

            toast({
                title: "Success",
                description: "Quiz deleted successfully",
            });

            router.push("/dashboard/quizzes");
        } catch (error) {
            console.error("Failed to delete quiz:", error);
            toast({
                title: "Error",
                description: "Failed to delete quiz",
                variant: "destructive",
            });
        }
    };

    const handleRefresh = async () => {
        try {
            setIsLoading(true);
            const refreshedQuiz = await fetchApi<Quiz>(`/api/quizzes/${id}`);

            setQuiz(refreshedQuiz);
            updatePreview(refreshedQuiz);
            toast({
                title: "Refreshed",
                description: "Quiz data has been updated",
            });
        } catch (error) {
            console.error("Failed to refresh quiz:", error);
            toast({
                title: "Error",
                description: "Failed to refresh quiz data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Replace the useTemplateScale hook with a fully automatic version
    const useQuizScale = () => {
        const iframeRef = useRef<HTMLIFrameElement>(null);
        const wrapperRef = useRef<HTMLDivElement>(null);

        // Auto-scale based on container dimensions
        const updateScale = useCallback(() => {
            if (!iframeRef.current || !wrapperRef.current) return;

            // Get the current container width and height
            const containerWidth = wrapperRef.current.clientWidth;
            const containerHeight = wrapperRef.current.clientHeight;

            // Calculate the scale needed to fit the 1080px content in the container width
            const scaleFactor = Math.min(containerWidth / 1080, containerHeight / 1080);

            // Apply transform to the iframe
            iframeRef.current.style.transform = `scale(${scaleFactor})`;
        }, []);

        // Update scale when previewHtml changes
        useEffect(() => {
            if (previewHtml) {
                // Try to update the scale multiple times to ensure it applies
                // after the iframe content has been loaded
                const timers = [
                    setTimeout(() => updateScale(), 0),
                    setTimeout(() => updateScale(), 50),
                    setTimeout(() => updateScale(), 200),
                    setTimeout(() => updateScale(), 500)
                ];

                return () => timers.forEach(timer => clearTimeout(timer));
            }
        }, [previewHtml, updateScale]);

        // Update scale on window resize
        useEffect(() => {
            // Add resize listener
            const handleResize = () => updateScale();
            window.addEventListener('resize', handleResize);

            // Update when iframe loads
            const handleIframeLoad = () => updateScale();
            if (iframeRef.current) {
                iframeRef.current.addEventListener('load', handleIframeLoad);
            }

            return () => {
                window.removeEventListener('resize', handleResize);
                if (iframeRef.current) {
                    iframeRef.current.removeEventListener('load', handleIframeLoad);
                }
            };
        }, [updateScale]);

        return { iframeRef, wrapperRef, updateScale };
    };

    const { iframeRef, wrapperRef, updateScale } = useQuizScale();

    // Load slots when component mounts or when the schedule tab is activated
    useEffect(() => {
        if (activeTab === 'schedule' && availableSlots.length === 0 && !isLoadingSlots) {
            loadAvailableSlots();
        }
    }, [activeTab]);

    // Helper function to combine date and time
    const getSelectedDateTime = () => {
        if (!date) return null;

        const selectedDate = new Date(date);
        const [hours, minutes] = time.split(":").map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);

        return selectedDate.toISOString();
    };

    // Update selectedSlot when date or time changes
    useEffect(() => {
        const dateTime = getSelectedDateTime();
        if (dateTime) {
            setSelectedSlot(dateTime);
        }
    }, [date, time]);

    // Add scroll event listener to track scroll positions
    useEffect(() => {
        const trackScrollPosition = (dayIndex: number, container: HTMLDivElement) => {
            const left = container.scrollLeft;
            const isAtEnd = container.scrollWidth - container.clientWidth - left < 10; // 10px threshold

            setScrollStates(prev => ({
                ...prev,
                [dayIndex]: { left, isAtEnd }
            }));
        };

        // Set up scroll tracking for each container
        Object.entries(scrollContainerRefs.current).forEach(([dayIndexStr, container]) => {
            if (container) {
                const dayIndex = parseInt(dayIndexStr);
                // Initialize scroll state
                trackScrollPosition(dayIndex, container);

                // Add scroll listener
                const handleScroll = () => trackScrollPosition(dayIndex, container);
                container.addEventListener('scroll', handleScroll);

                return () => {
                    container.removeEventListener('scroll', handleScroll);
                };
            }
        });
    }, [availableSlots]); // Re-run when availableSlots changes

    if (!quiz) {
        return (
            <div className="space-y-6">
                <LoadingIndicator
                    size="lg"
                    message="Loading quiz data..."
                    centered={true}
                    className="h-[300px]"
                />
            </div>
        );
    }

    // Additional check for template
    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Template data missing</h1>
                <p className="text-muted-foreground mb-4">Cannot display quiz preview without template data.</p>
                <div className="flex gap-4">
                    <Button onClick={() => router.push("/dashboard/quizzes")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Quizzes
                    </Button>
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Breadcrumb navigation */}
            <header>
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
                    <Link href="/dashboard/quizzes" className="hover:text-foreground transition-colors">
                        Quizzes
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">{quiz?.title || 'Quiz Details'}</span>
                </nav>

                {/* Header with background */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex flex-col space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.back()}
                                            className="p-0 h-8 w-8"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            <span className="sr-only">Back</span>
                                        </Button>
                                        <h1 className="text-2xl font-bold flex items-center">
                                            <SquareStack className="mr-2 h-5 w-5 text-primary" />
                                            {quiz?.title || 'Quiz Details'}
                                        </h1>
                                        {quiz?.status && (
                                            <Badge variant={getStatusVariant(quiz.status)} className="ml-2">
                                                {quiz.status === 'SCHEDULED' ? 'Scheduled' :
                                                    quiz.status === 'PUBLISHED' ? 'Published' :
                                                        quiz.status === 'DRAFT' ? 'Draft' :
                                                            quiz.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-1">
                                        Manage your quiz content and schedule
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateImage}
                                        disabled={isLoading}
                                        className="h-9"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Regenerate Image
                                    </Button>

                                    <Button
                                        size="sm"
                                        onClick={handlePublishQuiz}
                                        disabled={isPublishing || quiz?.status === 'PUBLISHED'}
                                        className="h-9"
                                    >
                                        {isPublishing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Publishing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Publish Quiz
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Quiz editor - 8 columns on large screens */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab}>
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 border-b">
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="schedule" className="text-xs">
                                        <CalendarClock className="w-4 h-4 mr-2" />
                                        Schedule
                                    </TabsTrigger>
                                    <TabsTrigger value="edit" className="text-xs">
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit Quiz
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent className="p-6">
                                <TabsContent value="schedule" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Current Schedule Status */}
                                        <Card className="border shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-full bg-primary/10">
                                                        <CalendarClock className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">Schedule Status</CardTitle>
                                                        <CardDescription>
                                                            Current scheduling information
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={quiz.status === 'SCHEDULED' ? 'info' : 'secondary'} className="text-xs">
                                                            {quiz.status === 'SCHEDULED' ? 'Scheduled' : 'Not Scheduled'}
                                                        </Badge>
                                                    </div>

                                                    {quiz.scheduledPost ? (
                                                        <div className="space-y-3">
                                                            <div className="p-3 rounded-lg bg-background/50 border">
                                                                <p className="text-sm font-medium mb-1">Scheduled for:</p>
                                                                <p className="text-lg font-semibold text-primary">
                                                                    {format(new Date(quiz.scheduledPost.scheduledAt), "PPP 'at' p")}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={handleToggleScheduler}
                                                                    className="flex-1"
                                                                >
                                                                    Reschedule
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={async () => {
                                                                        if (!quiz?.id) return;
                                                                        try {
                                                                            setIsLoading(true);
                                                                            await fetchApi(`/api/scheduled-posts/${quiz.scheduledPost?.id}`, {
                                                                                method: 'DELETE'
                                                                            });
                                                                            const updatedQuiz = await fetchApi<Quiz>(`/api/quizzes/${quiz.id}`);
                                                                            setQuiz(updatedQuiz);
                                                                            toast({
                                                                                title: "Success",
                                                                                description: "Scheduled post cancelled"
                                                                            });
                                                                        } catch (error) {
                                                                            console.error("Failed to cancel scheduled post:", error);
                                                                            toast({
                                                                                title: "Error",
                                                                                description: "Failed to cancel scheduled post",
                                                                                variant: "destructive"
                                                                            });
                                                                        } finally {
                                                                            setIsLoading(false);
                                                                        }
                                                                    }}
                                                                    className="flex-1"
                                                                >
                                                                    Cancel Schedule
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 rounded-lg bg-background/50 border text-center">
                                                            <p className="text-sm text-muted-foreground">
                                                                This quiz is not currently scheduled.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Manual Schedule Card - Replacing Quick Schedule */}
                                        <Card className="border shadow-sm">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-full bg-primary/10">
                                                        <CalendarClock className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">Manual Schedule</CardTitle>
                                                        <CardDescription>
                                                            Choose when to post this quiz
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal h-auto py-3",
                                                                        !date && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                                                                        <div>
                                                                            {date ? (
                                                                                <div className="space-y-1">
                                                                                    <p className="font-medium">
                                                                                        {format(date, "PPP")}
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        at {format(new Date().setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1])), "h:mm a")}
                                                                                    </p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-1">
                                                                                    <p>Select date and time</p>
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        Choose when to publish this quiz
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-auto p-0"
                                                                align="center"
                                                                side="bottom"
                                                                sideOffset={5}
                                                                alignOffset={0}
                                                                avoidCollisions={true}
                                                            >
                                                                <div className="p-4 border-b">
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-medium text-sm">Select Date</h4>
                                                                        <CalendarComponent
                                                                            mode="single"
                                                                            selected={date}
                                                                            onSelect={setDate}
                                                                            initialFocus
                                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 border-t">
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-medium text-sm">Select Time</h4>
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="time"
                                                                                    value={time}
                                                                                    onChange={(e) => setTime(e.target.value)}
                                                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                                                />
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Current selection: {format(new Date().setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1])), "h:mm a")}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>

                                                    <Button
                                                        className="w-full"
                                                        disabled={!selectedSlot || isLoading}
                                                        onClick={() => selectedSlot && handleScheduleQuiz(selectedSlot)}
                                                    >
                                                        {isLoading ? (
                                                            <ButtonLoader className="mr-2" />
                                                        ) : (
                                                            <CalendarClock className="h-4 w-4 mr-2" />
                                                        )}
                                                        Schedule Quiz
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={handleScheduleNext}
                                                        disabled={isLoading || schedulingSteps.findSlot === 'loading'}
                                                    >
                                                        {schedulingSteps.findSlot === 'loading' ? (
                                                            <ButtonLoader className="mr-2" />
                                                        ) : (
                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        )}
                                                        Use Next Available Slot
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Auto-Schedule Slots */}
                                    <Card className="border shadow-sm">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-full bg-primary/10">
                                                        <Calendar className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base">Available Slots</CardTitle>
                                                        <CardDescription className="text-xs">
                                                            Choose from your configured auto-schedule slots
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2"
                                                    onClick={() => {
                                                        setIsLoadingSlots(true);
                                                        loadAvailableSlots().finally(() => {
                                                            setIsLoadingSlots(false);
                                                        });
                                                    }}
                                                    disabled={isLoadingSlots}
                                                >
                                                    {isLoadingSlots ? (
                                                        <ButtonLoader className="mr-1" />
                                                    ) : (
                                                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                    )}
                                                    <span className="text-xs">Refresh</span>
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3">
                                            {isLoadingSlots ? (
                                                <div className="flex items-center justify-center h-28 border rounded-md bg-muted/10">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                                        <p className="text-xs text-muted-foreground">Loading slots...</p>
                                                    </div>
                                                </div>
                                            ) : availableSlots.length === 0 ? (
                                                <div className="flex items-center justify-center h-28 border rounded-md bg-muted/10">
                                                    <div className="flex flex-col items-center gap-2 text-center px-4 max-w-xs mx-auto">
                                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                                        <div>
                                                            <p className="text-xs font-medium">No scheduling slots configured</p>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => router.push('/dashboard/settings/auto-schedule')}
                                                                className="mt-2 h-7 text-xs"
                                                            >
                                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                                Configure Auto-Schedule
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex flex-col space-y-2">
                                                        {/* Days of the week */}
                                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                                                            const daySlots = availableSlots.filter(slot => slot.dayOfWeek === dayIndex);
                                                            if (daySlots.length === 0) return null;

                                                            // Calculate the next occurrence of this day
                                                            const now = new Date();
                                                            const targetDate = new Date();
                                                            const currentDayOfWeek = now.getDay();
                                                            const daysToAdd = (dayIndex - currentDayOfWeek + 7) % 7;
                                                            targetDate.setDate(now.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));

                                                            const formattedDate = format(targetDate, "MMM d");

                                                            return (
                                                                <div key={dayIndex} className="border rounded-md p-2">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                                                            <div>
                                                                                <h3 className="text-xs font-medium">{dayName} <span className="text-muted-foreground">• {formattedDate}</span></h3>
                                                                            </div>
                                                                        </div>
                                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                                                            {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="relative group">
                                                                        <div
                                                                            className="overflow-x-auto flex space-x-1.5 pb-1 scrollbar-hide"
                                                                            ref={(el) => { scrollContainerRefs.current[dayIndex] = el; }}
                                                                        >
                                                                            {daySlots.map((slot, slotIndex) => {
                                                                                const slotDate = new Date(targetDate);
                                                                                const [hours, minutes] = slot.timeOfDay.split(':');
                                                                                slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                                                                                if (slotDate < now && daysToAdd === 0) {
                                                                                    slotDate.setDate(slotDate.getDate() + 7);
                                                                                }

                                                                                const slotValue = slotDate.toISOString();

                                                                                return (
                                                                                    <Button
                                                                                        key={slotIndex}
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        className="h-7 text-xs px-2 flex-none w-20 justify-center"
                                                                                        onClick={() => handleScheduleQuiz(slotValue)}
                                                                                        disabled={isLoading}
                                                                                    >
                                                                                        {slot.formattedTime}
                                                                                    </Button>
                                                                                );
                                                                            })}
                                                                        </div>

                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 absolute left-0 top-0 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-background/90 transition-opacity disabled:opacity-0"
                                                                            onClick={() => {
                                                                                const container = scrollContainerRefs.current[dayIndex];
                                                                                if (container) {
                                                                                    container.scrollBy({ left: -100, behavior: 'smooth' });
                                                                                }
                                                                            }}
                                                                            disabled={!scrollStates[dayIndex] || scrollStates[dayIndex].left === 0}
                                                                        >
                                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                                            <span className="sr-only">Scroll left</span>
                                                                        </Button>

                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 absolute right-0 top-0 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-background/90 transition-opacity disabled:opacity-0"
                                                                            onClick={() => {
                                                                                const container = scrollContainerRefs.current[dayIndex];
                                                                                if (container) {
                                                                                    container.scrollBy({ left: 100, behavior: 'smooth' });
                                                                                }
                                                                            }}
                                                                            disabled={!scrollStates[dayIndex] || scrollStates[dayIndex].isAtEnd}
                                                                        >
                                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                                            <span className="sr-only">Scroll right</span>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push('/dashboard/settings/auto-schedule')}
                                                            className="text-xs h-7"
                                                        >
                                                            <Calendar className="h-3 w-3 mr-1.5" />
                                                            Manage Settings
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="edit" className="space-y-4 mt-0">
                                    <div className="grid gap-4">
                                        <div className="space-y-1.5">
                                            <h3 className="text-lg font-medium">Quiz Details</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Edit the quiz details below. Changes are saved automatically.
                                            </p>
                                        </div>

                                        <div className="grid gap-4">
                                            <div>
                                                <label htmlFor="title" className="block text-sm font-medium mb-1.5">
                                                    Title
                                                </label>
                                                <input
                                                    id="title"
                                                    {...form.register("title")}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                />
                                                {form.formState.errors.title && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        {form.formState.errors.title.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="answer" className="block text-sm font-medium mb-1.5">
                                                    Answer
                                                </label>
                                                <input
                                                    id="answer"
                                                    {...form.register("answer")}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                />
                                                {form.formState.errors.answer && (
                                                    <p className="text-sm text-red-500 mt-1">
                                                        {form.formState.errors.answer.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="solution" className="block text-sm font-medium mb-1.5">
                                                    Solution (Optional)
                                                </label>
                                                <textarea
                                                    id="solution"
                                                    {...form.register("solution")}
                                                    rows={4}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="language" className="block text-sm font-medium mb-1.5">
                                                    Language
                                                </label>
                                                <select
                                                    id="language"
                                                    {...form.register("language")}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                    <option value="de">German</option>
                                                    <option value="it">Italian</option>
                                                </select>
                                            </div>

                                            {/* Template Variables Editor */}
                                            <div className="space-y-4 mt-4">
                                                <div className="border-t pt-4">
                                                    <h3 className="text-lg font-medium mb-2">Template Variables</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Customize the quiz template by editing the variables below.
                                                    </p>

                                                    {quiz && quiz.variables && Object.keys(quiz.variables).length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {Object.entries(quiz.variables).map(([key, value]) => {
                                                                // Handle different types of variables
                                                                if (Array.isArray(value)) {
                                                                    return (
                                                                        <div key={key} className="col-span-2">
                                                                            <label className="block text-sm font-medium mb-1.5">
                                                                                {key} (Array)
                                                                            </label>
                                                                            <textarea
                                                                                {...form.register(`variables.${key}`)}
                                                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                                                rows={4}
                                                                                defaultValue={value.join('\n')}
                                                                            />
                                                                        </div>
                                                                    );
                                                                } else if (typeof value === 'number') {
                                                                    return (
                                                                        <div key={key}>
                                                                            <label className="block text-sm font-medium mb-1.5">
                                                                                {key} (Number)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                {...form.register(`variables.${key}`)}
                                                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                                                defaultValue={value}
                                                                            />
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div key={key}>
                                                                            <label className="block text-sm font-medium mb-1.5">
                                                                                {key}
                                                                            </label>
                                                                            <input
                                                                                {...form.register(`variables.${key}`)}
                                                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                                                                defaultValue={String(value || '')}
                                                                            />
                                                                        </div>
                                                                    );
                                                                }
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 border rounded-md bg-muted/20 text-center">
                                                            <p>No template variables available for this quiz.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4 border-t mt-4">
                                                <Button type="submit" disabled={isSaving}>
                                                    {isSaving ? <ButtonLoader className="mr-2" /> : null}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </CardContent>
                        </Card>
                    </Tabs>
                </div>

                {/* Sidebar - 4 columns on large screens */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Live Preview Card */}
                    <Card className="border shadow-sm sticky top-6 overflow-hidden">
                        <div className="relative bg-primary/5 px-6 py-4 border-b">
                            <div className="relative flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">Live Preview</h3>
                                    <p className="text-sm text-muted-foreground">
                                        View and interact with your quiz exactly as users will see it
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 ml-auto"
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-3">
                            {isLoading ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <LoadingIndicator />
                                </div>
                            ) : (
                                <div className="w-full flex justify-center">
                                    <div
                                        ref={wrapperRef}
                                        className="w-full max-w-xl aspect-square bg-white rounded-lg border shadow-sm overflow-hidden relative"
                                    >
                                        <iframe
                                            ref={iframeRef}
                                            srcDoc={previewHtml}
                                            title="Quiz Preview"
                                            style={{
                                                width: '1080px',
                                                height: '1080px',
                                                border: 'none',
                                                transformOrigin: '0 0',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0
                                            }}
                                            sandbox="allow-same-origin allow-scripts"
                                            onLoad={() => updateScale()}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quiz Image Card */}
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="relative bg-primary/5 px-6 py-4 border-b">
                            <div className="relative flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">Quiz Image</h3>
                                    <p className="text-sm text-muted-foreground">
                                        The visual representation for your quiz
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 ml-auto"
                                    onClick={handleGenerateImage}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="aspect-square bg-muted relative">
                            {quiz.imageUrl ? (
                                <img
                                    src={quiz.imageUrl}
                                    alt={quiz.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted/50 to-muted">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                                </div>
                            )}
                        </div>
                        <CardContent className="px-5 py-4">
                            <dl className="space-y-3 text-sm">
                                <div className="grid grid-cols-3 gap-1">
                                    <dt className="col-span-1 font-medium text-muted-foreground">Status</dt>
                                    <dd className="col-span-2 text-right">
                                        <Badge variant={getStatusVariant(quiz.status)}>
                                            {quiz.status}
                                        </Badge>
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <dt className="col-span-1 font-medium text-muted-foreground">Created</dt>
                                    <dd className="col-span-2 text-right">{formatDate(quiz.createdAt)}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <dt className="col-span-1 font-medium text-muted-foreground">Template</dt>
                                    <dd className="col-span-2 text-right">{template.name}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <dt className="col-span-1 font-medium text-muted-foreground">Language</dt>
                                    <dd className="col-span-2 text-right">{quiz.language ? quiz.language.toUpperCase() : 'N/A'}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <dt className="col-span-1 font-medium text-muted-foreground">ID</dt>
                                    <dd className="col-span-2 text-right">
                                        <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">
                                            {quiz.id.substring(0, 8)}
                                        </code>
                                    </dd>
                                </div>
                            </dl>
                            <div className="mt-4 pt-3 border-t">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleDeleteQuiz}
                                >
                                    Delete Quiz
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 