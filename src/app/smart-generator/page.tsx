"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useLoadingDelay } from "@/contexts/LoadingDelayContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import type { Template } from "@/lib/types";
import { LANGUAGES, Language, QuizType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
    Brain,
    Calendar as CalendarIcon,
    Check,
    CheckCircle,
    Clock,
    FileText,
    LayoutGrid,
    Loader2,
    RotateCcw,
    Settings,
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SAMPLE_TEMPLATES } from "./test-fixture";

// Smart generator configuration schema
const configSchema = z.object({
    templates: z.array(z.string()).min(1, "Select at least one template"),
    count: z.number().min(1).max(20),
    theme: z.string().min(3, "Theme must be at least 3 characters").optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    difficulty: z.enum(["easy", "medium", "hard", "progressive"]),
    variety: z.number().min(0).max(100),
    timeSlots: z.array(z.object({
        id: z.string(),
        multiplier: z.number().min(0).max(5)
    })).min(1, "Select at least one time slot"),
    language: z.enum(["en", "es", "fr", "de", "it", "pt", "nl"] as [Language, ...Language[]]).default("en"),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface TimeSlotWithMultiplier {
    id: string;
    label: string;
    multiplier: number;
}

interface GenerationStats {
    completed: number;
    total: number;
    currentTemplate: string;
    currentStage: "preparing" | "generating" | "scheduling" | "processing-images" | "complete";
    progress: number;
    timeRemaining: number;
    error?: string;
    generatedQuizzes?: Array<{
        title: string;
        type: string;
        scheduledAt: string;
        imageUrl?: string;
    }>;
}

const DIFFICULTY_OPTIONS = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "progressive", label: "Progressive (Easy → Hard)" },
];

const TIME_SLOTS = [
    { id: "morning", label: "Morning (8-11 AM)", defaultMultiplier: 1 },
    { id: "lunch", label: "Lunch (11 AM-2 PM)", defaultMultiplier: 1 },
    { id: "afternoon", label: "Afternoon (2-5 PM)", defaultMultiplier: 1 },
    { id: "evening", label: "Evening (5-8 PM)", defaultMultiplier: 1 },
    { id: "night", label: "Night (8-11 PM)", defaultMultiplier: 1 },
];

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
    'WORDLE': 'Wordle',
    'NUMBER_SEQUENCE': 'Number Sequence',
    'RHYME_TIME': 'Rhyme Time',
    'CONCEPT_CONNECTION': 'Concept Connection'
};

export default function SmartGeneratorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [activeTab, setActiveTab] = useState("templates");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null);
    const [selectedQuizPreview, setSelectedQuizPreview] = useState<{
        title: string;
        type: string;
        scheduledAt: string;
        answer: string;
        solution?: string;
        variables: Record<string, any>;
        imageUrl?: string;
    } | null>(null);
    const [useSimulationMode, setUseSimulationMode] = useState(false);
    const { simulateLoading } = useLoadingDelay();
    const [isLoading, setIsLoading] = useState(true);

    // Default form values
    const defaultValues: Partial<ConfigFormValues> = {
        templates: [],
        count: 5,
        theme: "",
        startDate: new Date(),
        difficulty: "medium",
        variety: 50,
        timeSlots: [
            { id: "afternoon", multiplier: 1 },
            { id: "evening", multiplier: 1 }
        ],
        language: "en",
    };

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(configSchema),
        defaultValues,
    });

    // Load templates on page load
    useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            try {
                // Always attempt to fetch from API first, regardless of environment
                console.log('Smart Generator: Starting to load templates');
                const templates = await simulateLoading(fetchApi<Template[]>('/templates'));
                console.log('Smart Generator: Templates loaded successfully');
                setTemplates(templates);
            } catch (error) {
                // Fallback to sample templates if API fails
                console.error('Failed to fetch templates:', error);

                // Transform sample templates to match Template interface
                const transformedTemplates = SAMPLE_TEMPLATES.map(template => ({
                    ...template,
                    html: "<div>Sample template content</div>",
                    css: null,
                    variables: {},
                    createdAt: new Date(template.createdAt),
                    updatedAt: new Date(),
                })) as Template[];

                setTemplates(transformedTemplates);

                toast({
                    title: "Using sample templates",
                    description: "Could not fetch your templates. Using sample data for demonstration.",
                    variant: "default",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            loadTemplates();
        } else {
            // If not authenticated, still try to load templates
            // since we've removed authentication requirements
            loadTemplates();
        }
    }, [isAuthenticated, toast, simulateLoading]);

    // Add function to toggle simulation mode
    const toggleSimulationMode = () => {
        setUseSimulationMode(prev => !prev);
    };

    // Progress simulation for demo purposes
    // In a real application, this would be replaced with actual API calls and progress tracking
    const simulateGeneration = async () => {
        const values = form.getValues();
        const count = values.count;

        setIsGenerating(true);
        setGenerationStats({
            completed: 0,
            total: count,
            currentTemplate: templates.find(t => t.id === values.templates[0])?.name || "",
            currentStage: "preparing",
            progress: 0,
            timeRemaining: count * 8, // 8 seconds per quiz as an estimate
        });

        // Simulate the generation process
        let completed = 0;
        const stages: GenerationStats["currentStage"][] = ["preparing", "generating", "processing-images", "scheduling"];

        const updateProgress = (stage: GenerationStats["currentStage"], templateIndex: number) => {
            const currentTemplate = templates.find(t => t.id === values.templates[templateIndex % values.templates.length])?.name || "";

            setGenerationStats(prev => ({
                ...prev!,
                currentStage: stage,
                currentTemplate,
                progress: (((completed / count) * 100) + ((stages.indexOf(stage) / stages.length) * (100 / count))),
                timeRemaining: (count - completed) * 8,
            }));
        };

        // Simulate each quiz generation
        for (let i = 0; i < count; i++) {
            const templateIndex = i % values.templates.length;

            // Simulate various stages for each quiz
            for (const stage of stages) {
                updateProgress(stage, templateIndex);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work being done
            }

            completed++;
            setGenerationStats(prev => ({
                ...prev!,
                completed,
                progress: (completed / count) * 100,
                timeRemaining: (count - completed) * 8,
            }));
        }

        // Generate dummy quiz data
        const generatedQuizzes: Array<{
            id: string;
            title: string;
            type: string;
            scheduledAt: string;
            answer: string;
            solution: string;
            variables: Record<string, any>;
            imageUrl?: string;
        }> = [];

        const selectedTemplateIds = values.templates;

        for (let i = 0; i < count; i++) {
            const templateId = selectedTemplateIds[i % selectedTemplateIds.length];
            const template = templates.find(t => t.id === templateId) || templates[0];
            const quizDate = new Date();
            quizDate.setDate(quizDate.getDate() + Math.floor(i / 3)); // Schedule over a few days

            // Add placeholder images based on quiz type
            let placeholderImage = "/images/placeholder-quiz.png";
            if (template.quizType === 'WORDLE') {
                placeholderImage = "/images/wordpuzzle-preview.png";
            } else if (template.quizType === 'NUMBER_SEQUENCE') {
                placeholderImage = "/images/sequence-preview.png";
            } else if (template.quizType === 'RHYME_TIME') {
                placeholderImage = "/images/rhyme-preview.png";
            } else if (template.quizType === 'CONCEPT_CONNECTION') {
                placeholderImage = "/images/concept-preview.png";
            }

            generatedQuizzes.push({
                id: `sim_${Date.now()}_${i}`,
                title: `${values.theme || 'Quiz'} ${template.quizType.toLowerCase().replace('_', ' ')} #${i + 1}`,
                type: template.quizType,
                scheduledAt: quizDate.toLocaleString(),
                answer: values.theme ? values.theme.substring(0, 5).toUpperCase() : "QUIZ",
                solution: `This is a simulated solution for the ${values.theme || 'generated'} quiz.`,
                variables: {
                    description: `${values.theme ? `Quiz about ${values.theme}` : 'Generated quiz'}`,
                    theme: values.theme || '',
                    hint: "This is a simulated hint."
                },
                imageUrl: placeholderImage // Use type-specific placeholder images
            });
        }

        // Generation complete
        setGenerationStats(prev => ({
            ...prev!,
            currentStage: "complete",
            progress: 100,
            timeRemaining: 0,
            generatedQuizzes
        }));

        // Wait a moment before showing completion
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: "Generation Complete (Simulation)",
            description: `Successfully simulated ${count} quizzes. Note: These quizzes are not actually created in the database.`,
        });
    };

    // Update handleGenerate to use simulation if needed
    const handleGenerate = async () => {
        const values = form.getValues();

        // Use simulation mode if explicitly enabled or in development without API key
        if (useSimulationMode) {
            await simulateGeneration();
            return;
        }

        // Show generation UI
        setIsGenerating(true);
        setGenerationStats({
            completed: 0,
            total: values.count,
            currentTemplate: templates.find(t => t.id === values.templates[0])?.name || "",
            currentStage: "preparing",
            progress: 0,
            timeRemaining: values.count * 8, // estimate
        });

        try {
            // Convert form values to API request format
            const requestPayload = {
                templates: values.templates,
                count: values.count,
                ...(values.theme ? { theme: values.theme } : {}),
                startDate: values.startDate.toISOString(),
                difficulty: values.difficulty,
                variety: values.variety,
                timeSlots: values.timeSlots,
                language: values.language,
            };

            // Start progress animation
            const progressInterval = setInterval(() => {
                setGenerationStats(prev => {
                    if (!prev) return null;

                    // Slowly increase progress but stay under 90% until we get the API response
                    const newProgress = Math.min(prev.progress + 0.5, 90);
                    return {
                        ...prev,
                        progress: newProgress,
                        currentStage:
                            newProgress < 30 ? "preparing" :
                                newProgress < 60 ? "generating" :
                                    "scheduling",
                        timeRemaining: Math.max(0, prev.timeRemaining - 0.5),
                    };
                });
            }, 400);

            // Make the API call with explicit JSON parsing error handling
            console.log('Smart Generator: Starting quiz generation');
            const response = await simulateLoading(
                fetch('/api/smart-generator', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload),
                })
            );
            console.log('Smart Generator: Quiz generation completed');

            // Clear animation interval
            clearInterval(progressInterval);

            // Check if response is OK
            if (!response.ok) {
                // Try to parse the error response
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: 'Failed to generate quizzes. Please try again.' };
                }

                // Handle region restriction errors specifically
                if (response.status === 403 && errorData?.code === 'REGION_RESTRICTED') {
                    setGenerationStats({
                        completed: 0,
                        total: values.count,
                        currentTemplate: 'Error',
                        currentStage: 'complete',
                        progress: 100,
                        timeRemaining: 0,
                        error: 'OpenAI services are not available in your region. Please use a VPN or try a different location.',
                        generatedQuizzes: []
                    });
                    setIsGenerating(false);
                    return; // Return early to show the specific message
                }

                // Handle other errors
                setGenerationStats({
                    completed: 0,
                    total: values.count,
                    currentTemplate: 'Error',
                    currentStage: 'complete',
                    progress: 100,
                    timeRemaining: 0,
                    error: errorData.error || 'Failed to generate quizzes. Please try again.',
                    generatedQuizzes: []
                });
                setIsGenerating(false);
                return;
            }

            // Try to parse the response as JSON
            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                console.error("Failed to parse JSON response", jsonError);

                setGenerationStats(prev => ({
                    ...prev!,
                    currentStage: "complete",
                    progress: 100,
                    error: "Failed to parse server response. The response was not valid JSON.",
                }));

                toast({
                    title: "Generation Failed",
                    description: "Failed to parse server response. The response was not valid JSON.",
                    variant: "destructive",
                });

                return;
            }


            // Show success toast
            toast({
                title: "Generation Complete",
                description: responseData.message || `Successfully generated and scheduled ${values.count} quizzes.`,
            });

        } catch (error) {
            console.error('Generation error:', error);

            // Show error state
            setGenerationStats(prev => ({
                ...prev!,
                currentStage: "complete",
                progress: 100,
                error: error instanceof Error ? error.message : "Failed to complete generation",
            }));

            toast({
                title: "Generation Failed",
                description: error instanceof Error
                    ? `Error: ${error.message}`
                    : "An error occurred during quiz generation.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        form.reset(defaultValues);
        setActiveTab("templates");
        setIsGenerating(false);
        setGenerationStats(null);
    };

    const handleQuizPreview = (quiz: any) => {
        setSelectedQuizPreview(quiz);
    };

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Smart Generator
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Smart Quiz Generator</h1>
                <p className="text-muted-foreground text-lg">
                    Generate and schedule multiple quizzes in bulk with AI assistance
                </p>
            </div>

            <Separator />

            {!isAuthenticated ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please log in to use the Smart Generator feature.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {isGenerating ? (
                            <GenerationProgress stats={generationStats} onReset={handleReset} onPreviewQuiz={handleQuizPreview} />
                        ) : (
                            <>
                                <ConfigurationTabs
                                    templates={templates}
                                    form={form}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    onGenerate={handleGenerate}
                                    onReset={handleReset}
                                    useSimulationMode={useSimulationMode}
                                    onToggleSimulationMode={toggleSimulationMode}
                                    isLoading={isLoading}
                                />

                                <Card className="border border-border/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">Generation Analytics</CardTitle>
                                            <Badge variant="outline" className="text-xs font-normal">
                                                Beta
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            Statistics and insights from your previous generations
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1 border rounded-md p-3">
                                                <div className="text-sm text-muted-foreground">Total Quizzes Generated</div>
                                                <div className="text-2xl font-bold">
                                                    {/* This would ideally come from server-side data */}
                                                    42
                                                </div>
                                            </div>
                                            <div className="space-y-1 border rounded-md p-3">
                                                <div className="text-sm text-muted-foreground">User Engagement</div>
                                                <div className="text-2xl font-bold">
                                                    {/* This would ideally come from server-side data */}
                                                    78%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t">
                                            <h4 className="text-sm font-medium mb-2">Top Quiz Types</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span>Wordle</span>
                                                    <div className="flex-1 mx-4">
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="bg-primary h-full" style={{ width: '65%' }}></div>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground">65%</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span>Concept Connection</span>
                                                    <div className="flex-1 mx-4">
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="bg-primary h-full" style={{ width: '20%' }}></div>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground">20%</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span>Number Sequence</span>
                                                    <div className="flex-1 mx-4">
                                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="bg-primary h-full" style={{ width: '15%' }}></div>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground">15%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="border border-border/50 shadow-sm sticky top-8">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    AI Smart Generator Guide
                                </CardTitle>
                                <CardDescription>
                                    Learn how to use the AI-powered bulk generation tool
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">How It Works</h3>
                                    <p className="text-muted-foreground text-sm">
                                        This tool uses AI to create multiple fully-formed quizzes based on your templates,
                                        generating unique content and answers for each quiz.
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <h3 className="font-semibold mb-1">Quick Steps</h3>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-primary text-xs font-medium">1</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Select Templates</p>
                                            <p className="text-sm text-muted-foreground">Choose which quiz templates to use</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-primary text-xs font-medium">2</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Configure AI Settings</p>
                                            <p className="text-sm text-muted-foreground">Set theme, difficulty, and content variety</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-primary text-xs font-medium">3</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Schedule AI-Generated Quizzes</p>
                                            <p className="text-sm text-muted-foreground">Choose when to publish your quizzes</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="font-semibold mb-1">AI Generation Tips</h3>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li className="flex gap-2">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>Choose specific themes for more focused AI content</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>Mix different quiz types for variety</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>Progressive difficulty increases engagement</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>AI creates content without manual editing needed</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {selectedQuizPreview && (
                <Dialog open={!!selectedQuizPreview} onOpenChange={(open) => !open && setSelectedQuizPreview(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{selectedQuizPreview.title}</DialogTitle>
                            <DialogDescription>
                                AI-generated {selectedQuizPreview.type.replace('_', ' ').toLowerCase()} quiz
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {selectedQuizPreview.imageUrl && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Quiz Image</h4>
                                    <div className="w-full h-48 rounded-md overflow-hidden border bg-accent/10">
                                        <img
                                            src={selectedQuizPreview.imageUrl}
                                            alt={selectedQuizPreview.title}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                // If image fails to load, show a placeholder
                                                const target = e.target as HTMLImageElement;
                                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedQuizPreview.title)}&background=random&size=200`;
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Scheduled</h4>
                                <p className="text-sm">{selectedQuizPreview.scheduledAt}</p>
                            </div>

                            {selectedQuizPreview.answer && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Answer</h4>
                                    <div className="bg-secondary p-2 rounded text-sm">
                                        {selectedQuizPreview.answer}
                                    </div>
                                </div>
                            )}

                            {selectedQuizPreview.solution && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Solution</h4>
                                    <p className="text-sm">{selectedQuizPreview.solution}</p>
                                </div>
                            )}

                            {selectedQuizPreview.variables && Object.keys(selectedQuizPreview.variables).length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Quiz Details</h4>
                                    <div className="text-xs space-y-2">
                                        {Object.entries(selectedQuizPreview.variables).map(([key, value]) => (
                                            <div key={key} className="space-y-1">
                                                <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                <div className="pl-3">
                                                    {typeof value === 'string' ? (
                                                        <p>{value}</p>
                                                    ) : typeof value === 'object' && value !== null ? (
                                                        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(value, null, 2)}</pre>
                                                    ) : (
                                                        <p>{String(value)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// Tab-based configuration component
function ConfigurationTabs({
    templates,
    form,
    activeTab,
    setActiveTab,
    onGenerate,
    onReset,
    useSimulationMode,
    onToggleSimulationMode,
    isLoading
}: {
    templates: Template[],
    form: any,
    activeTab: string,
    setActiveTab: (tab: string) => void,
    onGenerate: () => void,
    onReset: () => void,
    useSimulationMode: boolean,
    onToggleSimulationMode: () => void,
    isLoading: boolean
}) {
    const startDate = form.watch("startDate");
    const count = form.watch("count");

    const handleTabChange = (tab: string) => {
        // Only allow moving to next tab if current tab is valid
        if (tab === "configure" && templates.length === 0) {
            return;
        }
        if (tab === "schedule" && !form.getValues("difficulty")) {
            setActiveTab("configure");
            form.setError("difficulty", {
                type: "manual",
                message: "Please select a difficulty level before scheduling"
            });
            return;
        }
        setActiveTab(tab);
    };

    const isNextButtonDisabled = () => {
        if (activeTab === "templates") {
            return templates.length === 0;
        }
        if (activeTab === "configure") {
            return !form.getValues("difficulty");
        }
        return false;
    };

    // Template Card Skeleton component for loading state
    const TemplateCardSkeleton = () => (
        <div className="flex items-start border rounded-md p-4 space-x-4 animate-pulse">
            <Skeleton className="h-5 w-5 rounded mt-1" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );

    return (
        <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle>Smart Quiz Generation</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                        <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
                    </Badge>
                </div>
                <CardDescription>Generate multiple quizzes at once with AI assistance</CardDescription>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="px-6">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="templates" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" /> Templates
                        </TabsTrigger>
                        <TabsTrigger value="configure" className="flex items-center gap-1">
                            <Settings className="h-4 w-4" /> Configure
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" /> Schedule
                        </TabsTrigger>
                    </TabsList>
                </div>

                <CardContent className="p-0">
                    <TabsContent value="templates" className="space-y-6 m-0 p-6 pt-2">
                        <div>
                            <Label className="mb-3 block">Select Templates <span className="text-destructive">*</span></Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {isLoading ? (
                                    // Show skeleton cards while loading
                                    Array(6).fill(0).map((_, index) => (
                                        <TemplateCardSkeleton key={index} />
                                    ))
                                ) : templates.length > 0 ? (
                                    // Show actual templates when loaded
                                    templates.map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            isSelected={form.watch("templates").includes(template.id)}
                                            onToggle={(checked) => {
                                                const current = form.getValues("templates");
                                                if (checked) {
                                                    form.setValue("templates", [...current, template.id]);
                                                } else {
                                                    form.setValue("templates", current.filter((id: string) => id !== template.id));
                                                }
                                            }}
                                        />
                                    ))
                                ) : (
                                    // Show message when no templates are found
                                    <div className="col-span-2 py-8 text-center text-muted-foreground">
                                        No templates found. Please create some templates first.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                disabled={isNextButtonDisabled()}
                                onClick={() => handleTabChange("configure")}
                            >
                                Next: Configure
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="configure" className="space-y-6 m-0 p-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="count">Number of Quizzes</Label>
                                    <div className="flex items-center gap-3">
                                        <Slider
                                            value={[count]}
                                            min={1}
                                            max={20}
                                            step={1}
                                            onValueChange={(value) => form.setValue("count", value[0])}
                                        />
                                        <div className="w-12 text-center">{count}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="theme">Theme</Label>
                                    <Input
                                        id="theme"
                                        placeholder="E.g., Space, Animals, Sports..."
                                        {...form.register("theme")}
                                    />
                                    {form.formState.errors.theme && (
                                        <p className="text-destructive text-sm">{form.formState.errors.theme.message as string}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="difficulty">Difficulty Level <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={form.watch("difficulty")}
                                        onValueChange={(value) => form.setValue("difficulty", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIFFICULTY_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="variety">Variety</Label>
                                    <div className="flex items-center gap-3">
                                        <Slider
                                            value={[form.watch("variety")]}
                                            min={0}
                                            max={100}
                                            step={10}
                                            onValueChange={(value) => form.setValue("variety", value[0])}
                                        />
                                        <div className="w-12 text-center">{form.watch("variety")}%</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Higher variety means more diverse topics and approaches
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="language">Language <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={form.watch("language")}
                                        onValueChange={(value) => form.setValue("language", value as Language)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(LANGUAGES).map(([code, name]) => (
                                                <SelectItem key={code} value={code}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        Language for generated content
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => handleTabChange("templates")}>
                                Back: Templates
                            </Button>
                            <Button
                                disabled={isNextButtonDisabled()}
                                onClick={() => handleTabChange("schedule")}
                            >
                                Next: Schedule
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-6 m-0 p-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label>Start Date <span className="text-destructive">*</span></Label>
                                <div className="border rounded-md w-full overflow-hidden bg-card">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => date && form.setValue("startDate", date)}
                                        disabled={(date) => date < new Date()}
                                        className="w-full"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Quizzes will be scheduled from this date forward
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Label>Time Slots <span className="text-destructive">*</span></Label>
                                <div className="bg-muted/30 p-3 rounded-md mb-3 text-sm">
                                    <p className="font-medium mb-1">Time Slot Multipliers</p>
                                    <p className="text-muted-foreground">Use multipliers to control how many quizzes are generated per time slot each day.</p>
                                    <p className="text-muted-foreground">Example: Setting "Morning" to 3x will schedule 3 quizzes in morning hours each day.</p>
                                </div>
                                <div className="space-y-3">
                                    {TIME_SLOTS.map((slot) => {
                                        const timeSlot = form.watch("timeSlots").find((ts: any) => ts.id === slot.id);
                                        const isSelected = Boolean(timeSlot);
                                        const multiplier = timeSlot?.multiplier || slot.defaultMultiplier;

                                        return (
                                            <div key={slot.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={slot.id}
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => {
                                                        const current = form.getValues("timeSlots");
                                                        if (checked) {
                                                            form.setValue("timeSlots", [...current, { id: slot.id, multiplier: slot.defaultMultiplier }]);
                                                        } else {
                                                            form.setValue("timeSlots", current.filter((ts: any) => ts.id !== slot.id));
                                                        }
                                                    }}
                                                />
                                                <div className="flex flex-1 items-center justify-between">
                                                    <label
                                                        htmlFor={slot.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {slot.label}
                                                    </label>

                                                    {isSelected && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="h-6 w-6 rounded border flex items-center justify-center text-xs"
                                                                disabled={multiplier <= 1}
                                                                onClick={() => {
                                                                    const current = form.getValues("timeSlots");
                                                                    const updated = current.map((ts: any) =>
                                                                        ts.id === slot.id
                                                                            ? { ...ts, multiplier: Math.max(1, ts.multiplier - 1) }
                                                                            : ts
                                                                    );
                                                                    form.setValue("timeSlots", updated);
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-5 text-center text-sm">{multiplier}x</span>
                                                            <button
                                                                type="button"
                                                                className="h-6 w-6 rounded border flex items-center justify-center text-xs"
                                                                disabled={multiplier >= 5}
                                                                onClick={() => {
                                                                    const current = form.getValues("timeSlots");
                                                                    const updated = current.map((ts: any) =>
                                                                        ts.id === slot.id
                                                                            ? { ...ts, multiplier: Math.min(5, ts.multiplier + 1) }
                                                                            : ts
                                                                    );
                                                                    form.setValue("timeSlots", updated);
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Selected time slots: {form.watch("timeSlots").length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total distribution slots: {form.watch("timeSlots").reduce((sum: number, slot: any) => sum + slot.multiplier, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Quizzes per day: {Math.min(
                                        form.watch("timeSlots").reduce((sum: number, slot: any) => sum + slot.multiplier, 0),
                                        form.watch("count")
                                    )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Total days: {Math.ceil(
                                        form.watch("count") /
                                        Math.max(1, form.watch("timeSlots").reduce((sum: number, slot: any) => sum + slot.multiplier, 0))
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="border rounded-md p-4 bg-muted/30">
                                <h3 className="font-medium mb-2">Schedule Summary</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span>Total quizzes:</span>
                                        <span className="font-medium">{form.watch("count")}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Selected time slots:</span>
                                        <span className="font-medium">{form.watch("timeSlots").length}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Quizzes per day:</span>
                                        <span className="font-medium">
                                            {Math.min(
                                                form.watch("timeSlots").reduce((sum: number, slot: any) => sum + slot.multiplier, 0),
                                                form.watch("count")
                                            )}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Total days needed:</span>
                                        <span className="font-medium">
                                            {Math.ceil(
                                                form.watch("count") /
                                                Math.max(1, form.watch("timeSlots").reduce((sum: number, slot: any) => sum + slot.multiplier, 0))
                                            )}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>First day:</span>
                                        <span className="font-medium">{format(form.watch("startDate"), "MMM d, yyyy")}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Last day:</span>
                                        <span className="font-medium">
                                            {format(
                                                (() => {
                                                    const lastDay = new Date(form.watch("startDate"));
                                                    const totalTimeSlots = form.watch("timeSlots").reduce(
                                                        (sum: number, slot: any) => sum + slot.multiplier, 0
                                                    );
                                                    lastDay.setDate(
                                                        lastDay.getDate() +
                                                        Math.ceil(form.watch("count") / totalTimeSlots) - 1
                                                    );
                                                    return lastDay;
                                                })(),
                                                "MMM d, yyyy"
                                            )}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => handleTabChange("configure")}
                            >
                                Back
                            </Button>
                            <div className="space-x-3">
                                <Button variant="outline" onClick={onReset}>
                                    <RotateCcw className="h-4 w-4 mr-2" /> Reset
                                </Button>
                                <Button onClick={onGenerate}>
                                    <Brain className="h-4 w-4 mr-2" /> Generate Quizzes
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="simulation-mode"
                                    checked={useSimulationMode}
                                    onCheckedChange={onToggleSimulationMode}
                                />
                                <label
                                    htmlFor="simulation-mode"
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Use simulation mode (no API calls) — for development without OpenAI API key
                                </label>
                            </div>
                            {useSimulationMode && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    <span className="text-warning">Note:</span> In simulation mode, quizzes are not actually created or saved to the database.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    );
}

// Template card component with selection
function TemplateCard({
    template,
    isSelected,
    onToggle
}: {
    template: Template,
    isSelected: boolean,
    onToggle: (checked: boolean) => void
}) {
    return (
        <div
            className={`relative border rounded-lg p-4 transition-all cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                }`}
            onClick={() => onToggle(!isSelected)}
        >
            <div className="absolute top-3 right-3">
                <Checkbox checked={isSelected} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />
            </div>
            <h3 className="font-medium text-foreground pr-6">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                    {QUIZ_TYPE_LABELS[template.quizType]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                    {new Date(template.createdAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}

// Progress component with animation and stats
function GenerationProgress({
    stats,
    onReset,
    onPreviewQuiz
}: {
    stats: GenerationStats | null,
    onReset: () => void,
    onPreviewQuiz: (quiz: any) => void
}) {
    const router = useRouter();

    if (!stats) return null;

    // Format time remaining in minutes and seconds
    const formatTimeRemaining = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // Get stage-specific text and icon
    const getStageInfo = () => {
        switch (stats.currentStage) {
            case "preparing":
                return {
                    text: "Preparing AI generation...",
                    icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />
                };
            case "generating":
                return {
                    text: "AI generating quiz content...",
                    icon: <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                };
            case "processing-images":
                return {
                    text: "Creating quiz images...",
                    icon: <LayoutGrid className="h-5 w-5 text-primary animate-pulse" />
                };
            case "scheduling":
                return {
                    text: "Scheduling AI-generated quizzes...",
                    icon: <CalendarIcon className="h-5 w-5 text-primary animate-pulse" />
                };
            case "complete":
                return {
                    text: "AI generation complete!",
                    icon: <CheckCircle className="h-5 w-5 text-primary" />
                };
            default:
                return {
                    text: "AI processing...",
                    icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />
                };
        }
    };

    const stageInfo = getStageInfo();

    return (
        <Card className="border border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Brain className={`h-6 w-6 ${stats.currentStage !== "complete" ? "animate-pulse text-primary" : "text-primary"}`} />
                        Smart Generator
                    </div>
                    {stats.currentStage === "complete" && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={onReset}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Start Over
                            </Button>
                            <Button size="sm" onClick={() => router.push('/calendar')}>
                                <CalendarIcon className="h-4 w-4 mr-2" /> View Calendar
                            </Button>
                        </div>
                    )}
                </CardTitle>
                <CardDescription>
                    {stats.currentStage === "complete"
                        ? `Successfully generated ${stats.total} quizzes`
                        : `Generating ${stats.total} quizzes...`}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Brain animation */}
                <div className="flex justify-center py-6">
                    <div className="relative">
                        <Brain className="h-24 w-24 text-muted-foreground" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain
                                className={`h-24 w-24 text-primary/80 ${stats.currentStage !== "complete" ? "animate-pulse" : ""
                                    }`}
                                style={{
                                    clipPath: `inset(${100 - stats.progress}% 0 0 0)`,
                                    transition: "clip-path 0.5s ease-in-out"
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(stats.progress)}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-2" />
                </div>

                {/* Current status */}
                <div className="bg-muted rounded-md p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        {stageInfo.icon}
                        <span className="font-medium">{stageInfo.text}</span>
                    </div>

                    {stats.currentStage !== "complete" && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Current template:</span>
                                <span>{stats.currentTemplate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Quizzes completed:</span>
                                <span>{stats.completed} of {stats.total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Estimated time remaining:</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> {formatTimeRemaining(stats.timeRemaining)}
                                </span>
                            </div>
                        </>
                    )}

                    {stats.error && (
                        <div className="text-destructive text-sm mt-2">
                            <p>{stats.error}</p>

                            {stats.error.includes("OpenAI API key") && (
                                <div className="mt-3 p-3 bg-muted rounded-md">
                                    <h4 className="text-sm font-medium mb-1">Setup Guide</h4>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The Smart Generator requires an OpenAI API key to generate quiz content.
                                    </p>
                                    <ol className="text-xs space-y-1 list-decimal list-inside">
                                        <li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI</a></li>
                                        <li>Add the API key to your .env.local file as <code className="bg-secondary/50 p-0.5 rounded">OPENAI_API_KEY=your-key-here</code></li>
                                        <li>Restart your development server</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}

                    {stats.currentStage === "complete" && (
                        <div className="pt-3 mt-3 border-t">
                            <p className="text-sm text-muted-foreground mb-3">
                                Your quizzes have been successfully generated using AI and scheduled.
                                View them in the calendar to see when they will be published.
                            </p>

                            {stats.generatedQuizzes && stats.generatedQuizzes.length > 0 && (
                                <div className="mt-4 mb-3 space-y-3">
                                    <h4 className="text-sm font-medium">Generated Quizzes:</h4>
                                    <ScrollArea className="h-[200px]">
                                        <div className="space-y-2">
                                            {stats.generatedQuizzes.map((quiz, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-secondary/30 p-2 rounded-md text-xs hover:bg-secondary/50 cursor-pointer transition-colors"
                                                    onClick={() => onPreviewQuiz(quiz)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {quiz.imageUrl && (
                                                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={quiz.imageUrl}
                                                                    alt={quiz.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        // If image fails to load, show a placeholder
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(quiz.title)}&background=random`;
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="font-medium">{quiz.title}</div>
                                                            <div className="flex justify-between mt-1">
                                                                <span className="text-muted-foreground">{quiz.type}</span>
                                                                <span className="text-muted-foreground">{quiz.scheduledAt}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            <Button variant="default" className="w-full" onClick={() => router.push('/calendar')}>
                                <CalendarIcon className="h-4 w-4 mr-2" /> Go to Calendar
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 