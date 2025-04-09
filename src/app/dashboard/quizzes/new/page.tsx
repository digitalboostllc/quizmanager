"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useQuizForm } from "@/hooks/useQuizForm";
import { QUIZ_TYPE_DISPLAY } from "@/lib/quiz-types";
import type { Template } from "@/lib/types";
import { LANGUAGES } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    ArrowRight,
    BrainCircuit,
    CheckCircle2,
    ChevronRight,
    Clock,
    EyeIcon,
    FileCode,
    FileType,
    GlobeIcon,
    Home,
    Info,
    Loader2,
    LockIcon,
    RotateCcw,
    Save,
    Sparkles,
    TagIcon,
    Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundSize: "40px 40px",
    backgroundImage:
        "linear-gradient(to right, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--primary-rgb), 0.05) 1px, transparent 1px)",
    backgroundPosition: "center center",
};

// Simple GenerationProgress component with types
interface GenerationProgressProps {
    progress: number;
    currentStage: string;
    currentField?: string;
    completedFields: string[];
    generationProgress: number;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
    progress,
    currentStage,
    currentField,
    completedFields,
    generationProgress
}) => {
    return (
        <div className="w-full">
            <h3 className="text-lg font-medium mb-3">Generating Content</h3>
            <div className="w-full bg-muted/30 rounded-full h-2.5 mb-4">
                <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
                {currentStage || "Initializing..."}
            </p>
            {completedFields && completedFields.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Completed fields:</p>
                    <div className="flex flex-wrap gap-2">
                        {completedFields.map((field: string) => (
                            <Badge key={field} variant="outline" className="bg-green-500/10 text-green-500">
                                {field}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// BatchGenerationProgress component with types
interface BatchError {
    quizTitle: string;
    error: string;
}

interface BatchGenerationProgressProps {
    isOpen: boolean;
    totalQuizzes: number;
    completedQuizzes: number;
    currentQuiz: { title: string; status: "generating" | "success" | "failed"; progress: number; };
    errors: BatchError[];
    onClose: () => void;
    onRetry: (quizTitle: string) => Promise<void>;
}

const BatchGenerationProgress: React.FC<BatchGenerationProgressProps> = ({
    isOpen,
    totalQuizzes,
    completedQuizzes,
    currentQuiz,
    errors,
    onClose,
    onRetry
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium mb-4">Generating Quizzes</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm mb-2">Progress: {completedQuizzes} of {totalQuizzes}</p>
                        <div className="w-full bg-muted/30 rounded-full h-2.5">
                            <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${(completedQuizzes / totalQuizzes) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {currentQuiz && (
                        <div className="p-3 border rounded bg-muted/10">
                            <p className="text-sm font-medium">Currently generating:</p>
                            <p className="text-sm">{currentQuiz.title}</p>
                            <div className="w-full bg-muted/30 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{ width: `${currentQuiz.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-destructive mb-2">Errors:</p>
                            <div className="max-h-32 overflow-y-auto">
                                {errors.map((error, index) => (
                                    <div key={index} className="p-2 mb-2 rounded bg-destructive/10 text-xs flex justify-between items-center">
                                        <span>{error.quizTitle}: {error.error}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onRetry(error.quizTitle)}
                                            className="h-6 text-xs"
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <Button onClick={onClose}>
                            {errors.length > 0 ? 'Close' : 'Continue'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function NewQuizPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("template");
    const previewWrapperRef = useRef<HTMLDivElement>(null);
    const previewIframeRef = useRef<HTMLIFrameElement>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [lastLoadedTemplateId, setLastLoadedTemplateId] = useState<
        string | null
    >(null);
    const { toast } = useToast();

    // Add a ref to track when we're updating to prevent infinite recursion
    const isSyncingTitleRef = useRef(false);

    const {
        form,
        isSubmitting,
        isGenerating,
        previewHtml,
        generationProgress,
        completedFields,
        currentField,
        currentTemplate,
        templates,
        fetchingTemplate,
        handleGenerateContent,
        handleSubmit,
        batchState,
        handleAIFill,
        closeBatchGeneration,
        retryFailedQuiz,
        regeneratePreviewHtml
    } = useQuizForm();

    // Add a local state for storing generation data
    const [generatedData, setGeneratedData] = useState(null);

    // Add a local state for tracking generation status
    const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

    // Add logging for template data
    console.log("Raw templates data:", templates);
    console.log("Template data type:", typeof templates);
    console.log("Is array:", Array.isArray(templates));

    // Fix template type
    const templateData = Array.isArray(templates)
        ? templates
        : (templates as { data: Template[] })?.data || [];
    console.log("Processed template data:", templateData);
    console.log("Template data length:", templateData.length);

    // Update when template is selected to show loading state
    useEffect(() => {
        if (currentTemplate) {
            // Show loading when a new template is selected (different from the last one)
            if (currentTemplate.id !== lastLoadedTemplateId) {
                setIsPreviewLoading(true);
                setLastLoadedTemplateId(currentTemplate.id);
            } else if (previewHtml) {
                // Give a slight delay to ensure CSS loads properly
                const timer = setTimeout(() => {
                    setIsPreviewLoading(false);
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [currentTemplate, previewHtml, lastLoadedTemplateId]);

    // Inside the useEffect section at the top of the component, add title synchronization
    // Add this after other useEffect hooks
    useEffect(() => {
        // Watch variables.title and sync it to the main title field
        const subscription = form.watch((value, { name }) => {
            if (name === 'variables.title' && !isSyncingTitleRef.current) {
                try {
                    isSyncingTitleRef.current = true; // Set flag before update
                    const variablesTitle = form.getValues('variables.title');
                    console.log('variables.title changed, updating main title:', variablesTitle);
                    if (variablesTitle) {
                        form.setValue('title', variablesTitle, { shouldDirty: true });
                    }
                } finally {
                    // Always clear flag when done, even if an error occurs
                    isSyncingTitleRef.current = false;
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [form]);

    // Add bi-directional sync from main title to variables.title
    useEffect(() => {
        // Watch main title and sync it to variables.title
        const subscription = form.watch((value, { name }) => {
            if (name === 'title' && !isSyncingTitleRef.current) {
                try {
                    isSyncingTitleRef.current = true; // Set flag before update
                    const mainTitle = form.getValues('title');
                    console.log('main title changed, updating variables.title:', mainTitle);
                    if (mainTitle) {
                        form.setValue('variables.title', mainTitle, {
                            shouldDirty: true,
                            shouldValidate: false
                        });
                    }
                } finally {
                    // Always clear flag when done, even if an error occurs
                    isSyncingTitleRef.current = false;
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [form]);

    const isGeneratingContent = Object.values(isGenerating).some(Boolean);
    const hasFormChanges = Object.keys(form.formState.dirtyFields).length > 0;

    // Function to update iframe scale
    const updatePreviewScale = useCallback(() => {
        if (previewWrapperRef.current && previewIframeRef.current) {
            const wrapperWidth = previewWrapperRef.current.offsetWidth;
            const scale = wrapperWidth / 1080;

            // Apply scale transform to the iframe
            previewIframeRef.current.style.transform = `scale(${scale})`;
        }
    }, []);

    // Update scale when window resizes or when preview changes
    useEffect(() => {
        window.addEventListener("resize", updatePreviewScale);

        return () => {
            window.removeEventListener("resize", updatePreviewScale);
        };
    }, [updatePreviewScale]);

    // Update preview scale when HTML changes
    useEffect(() => {
        if (previewHtml && previewIframeRef.current) {
            updatePreviewScale();
        }
    }, [previewHtml, updatePreviewScale]);

    // Add this helper function to calculate total progress
    function calculateTotalProgress() {
        // Count how many required fields are filled
        let filledFields = 0;
        let totalRequiredFields = 4; // template, title, question, answer

        if (currentTemplate) filledFields++;

        // Check form values using the form.watch method instead of getValues
        const formTitle = form.watch("title");
        const questionValue = currentTemplate && form.watch("variables.question");
        const answerValue = form.watch("answer");

        if (formTitle) filledFields++;
        if (questionValue) filledFields++;
        if (answerValue) filledFields++;

        // Add partial credit for optional fields
        let optionalFieldsCount = 0;
        let totalOptionalFields = 3; // description, tags, difficulty (removed timeLimit)

        const descriptionValue = form.watch("description");
        const tagsValue = form.watch("tags");
        const difficultyValue = form.watch("difficulty");

        if (descriptionValue) optionalFieldsCount++;
        if (tagsValue) optionalFieldsCount++;
        if (difficultyValue) optionalFieldsCount++;

        // Calculate percentage: 80% for required fields, 20% for optional fields
        const requiredPercentage = (filledFields / totalRequiredFields) * 80;
        const optionalPercentage = (optionalFieldsCount / totalOptionalFields) * 20;

        const totalPercentage = Math.round(requiredPercentage + optionalPercentage);
        return `${totalPercentage}%`;
    }

    // Add a function to handle content generation directly in the component
    const handleGenerateContentLocal = async () => {
        if (!currentTemplate) {
            toast({
                title: "Error",
                description: "Please select a template first",
                variant: "destructive",
            });
            return;
        }

        setIsGeneratingLocal(true);

        try {
            const response = await fetch(`/api/quizzes/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: currentTemplate.id,
                    language: form.getValues("language") || "en",
                }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            console.log("Generated data:", data);
            setGeneratedData(data);

            // Use form.setValue to properly update React Hook Form values
            if (data.data) {
                // Log all received fields for debugging
                console.log("Fields received in response:", Object.keys(data.data));

                // First look for specific known fields that might be inside variables
                // and copy them to the correct place
                if (data.data.variables && data.data.variables.title) {
                    console.log("Setting variables.title and syncing to main title:", data.data.variables.title);
                    form.setValue('variables.title', data.data.variables.title);
                    form.setValue('title', data.data.variables.title);
                } else if (data.data.title) {
                    // If only the main title is provided, copy it to variables.title
                    console.log("Main title found, copying to variables.title:", data.data.title);
                    form.setValue('title', data.data.title);
                    form.setValue('variables.title', data.data.title);
                }

                if (data.data.answer) {
                    console.log("Setting answer:", data.data.answer);
                    form.setValue('answer', data.data.answer);
                }

                if (data.data.solution) {
                    console.log("Setting solution:", data.data.solution);
                    form.setValue('solution', data.data.solution);
                }

                // Handle subtitle directly if it exists outside variables
                if (data.data.subtitle) {
                    console.log("Setting subtitle directly:", data.data.subtitle);
                    form.setValue('variables.subtitle', data.data.subtitle);
                }

                // Handle description if available
                if (data.data.description) {
                    console.log("Setting description:", data.data.description);
                    form.setValue('description', data.data.description);
                }

                // Variables
                if (data.data.variables) {
                    console.log("Setting variables:", data.data.variables);

                    // Ensure all template variables have values
                    if (currentTemplate && currentTemplate.html) {
                        // Find all template variables in the HTML
                        const templateVarMatches = currentTemplate.html.match(/{{([^}]+)}}/g) || [];
                        const templateVars = templateVarMatches.map(match => match.slice(2, -2));

                        console.log("Template variables found in HTML:", templateVars);

                        // Ensure all template variables exist in the data.variables
                        templateVars.forEach(varName => {
                            // Skip variables that aren't meant to be in the variables object
                            if (['language', 'difficulty', 'template'].includes(varName)) {
                                return;
                            }

                            // Check if the variable exists
                            if (!(varName in data.data.variables)) {
                                console.log(`Setting missing template variable: ${varName}`);
                                data.data.variables[varName] = "";
                                form.setValue(`variables.${varName}`, "");
                            }
                        });
                    }

                    // Ensure brandingText is set if it exists
                    if (data.data.variables.brandingText) {
                        console.log("Setting brandingText from variables:", data.data.variables.brandingText);
                        form.setValue('variables.brandingText', data.data.variables.brandingText);
                    }

                    // Set each individual variable field to ensure they're all updated
                    Object.entries(data.data.variables).forEach(([key, value]) => {
                        if (value === null || value === undefined) return;

                        // Skip title since we already handled it
                        if (key === 'title') return;

                        console.log(`Setting variable ${key}:`, value);
                        form.setValue(`variables.${key}`, value);
                    });

                    // Set the entire variables object at once AFTER individual fields
                    // to ensure nested values are properly set
                    form.setValue('variables', data.data.variables);
                }

                // Make sure language is preserved
                if (data.data.language) {
                    console.log("Setting language:", data.data.language);
                    form.setValue('language', data.data.language);
                }

                // Trigger validation
                form.trigger();
            }

            toast({
                title: "Success",
                description: "Quiz content generated successfully",
            });
        } catch (error) {
            console.error("Generation error:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error ? error.message : "Failed to generate content",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingLocal(false);
        }
    };

    const totalProgress = Math.round(
        (completedFields.length /
            (currentTemplate?.variables
                ? Object.keys(currentTemplate.variables).length
                : 1)) *
        100,
    );

    // Fix the type error for the field value
    const fieldValue =
        (form.watch("title") as string | null | undefined) ?? undefined;

    return (
        <div className="space-y-6">
            {/* Enhanced header section with breadcrumbs */}
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
                    <Link href="/dashboard/quizzes" className="hover:text-foreground transition-colors">
                        Quizzes
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">New Quiz</span>
                </nav>

                {/* Original header content */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex flex-col justify-between">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => router.push("/dashboard/quizzes")}
                                            className="h-8 w-8 mr-1"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            <span className="sr-only">Back to Quizzes</span>
                                        </Button>
                                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                            Quiz Creator
                                        </div>
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                        Create New Quiz
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Main column */}
                <div className="col-span-12 lg:col-span-8">
                    <Tabs defaultValue="template" value={activeTab} onValueChange={setActiveTab}>
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <div className="flex flex-col space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileType className="h-4 w-4" />
                                            <span>New Quiz</span>
                                        </div>
                                        {activeTab === "template" && currentTemplate?.quizType && (
                                            <Badge
                                                variant="outline"
                                                className="bg-muted/60 text-foreground border-border"
                                            >
                                                {QUIZ_TYPE_DISPLAY[currentTemplate.quizType]?.label || currentTemplate.quizType}
                                            </Badge>
                                        )}
                                    </div>

                                    <TabsList className="grid grid-cols-3 h-9">
                                        <TabsTrigger value="template" className="text-xs">
                                            <FileType className="w-4 h-4 mr-2" />
                                            Template
                                        </TabsTrigger>
                                        <TabsTrigger value="content" className="text-xs">
                                            <FileCode className="w-4 h-4 mr-2" />
                                            Content
                                        </TabsTrigger>
                                        <TabsTrigger value="settings" className="text-xs">
                                            <TagIcon className="w-4 h-4 mr-2" />
                                            Settings
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(handleSubmit)}
                                        className={cn(
                                            "space-y-6",
                                            (isGeneratingContent || isSubmitting) &&
                                            "opacity-70 pointer-events-none",
                                        )}
                                    >
                                        <div className="w-full mb-6">
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={`flex flex-col items-center relative cursor-pointer transition-opacity hover:opacity-90 ${!currentTemplate ? "" : "group"}`}
                                                    onClick={() => setActiveTab("template")}
                                                >
                                                    <div
                                                        className={`w-8 h-8 flex items-center justify-center rounded-full border-2 
                                                        ${activeTab === "template" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"}`}
                                                    >
                                                        <FileType className="h-4 w-4" />
                                                    </div>
                                                    <span
                                                        className={`text-xs font-medium mt-1 ${activeTab === "template" ? "text-primary" : "text-muted-foreground"}`}
                                                    >
                                                        Template
                                                    </span>
                                                </div>
                                                <div className="flex-1 flex items-center mx-4">
                                                    <div className="h-[2px] w-full bg-muted-foreground/20 relative translate-y-[-8px]">
                                                        <div
                                                            className={`absolute inset-0 bg-primary ${activeTab === "content" ? "w-full" : "w-0"} transition-all duration-300`}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex flex-col items-center cursor-pointer transition-opacity ${!currentTemplate ? "opacity-60 pointer-events-none" : "hover:opacity-90"}`}
                                                    onClick={() => currentTemplate && setActiveTab("content")}
                                                >
                                                    <div
                                                        className={`w-8 h-8 flex items-center justify-center rounded-full border-2 
                                                        ${activeTab === "content" ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"}`}
                                                    >
                                                        <FileCode className="h-4 w-4" />
                                                    </div>
                                                    <span
                                                        className={`text-xs font-medium mt-1 ${activeTab === "content" ? "text-primary" : "text-muted-foreground"}`}
                                                    >
                                                        Content
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <TabsContent value="template" className="p-0 m-0">
                                                <Card className="border border-border/50 shadow-sm">
                                                    <CardHeader className="pb-3 border-b">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <CardTitle className="flex items-center text-xl">
                                                                    <FileType className="h-5 w-5 mr-2 text-primary" />
                                                                    Select Quiz Template
                                                                </CardTitle>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-6">
                                                        <FormField
                                                            control={form.control}
                                                            name="templateId"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                        {templateData.length > 0 ? (
                                                                            templateData.map((template: Template) => {
                                                                                console.log(
                                                                                    "Processing template:",
                                                                                    template,
                                                                                );
                                                                                console.log(
                                                                                    "Template quiz type:",
                                                                                    template.quizType,
                                                                                );
                                                                                console.log(
                                                                                    "QUIZ_TYPE_DISPLAY:",
                                                                                    QUIZ_TYPE_DISPLAY,
                                                                                );

                                                                                const display = QUIZ_TYPE_DISPLAY[
                                                                                    template.quizType as keyof typeof QUIZ_TYPE_DISPLAY
                                                                                ] || {
                                                                                    label: template.quizType,
                                                                                    icon: FileType,
                                                                                };
                                                                                console.log("Template display:", display);

                                                                                return (
                                                                                    <div
                                                                                        key={template.id}
                                                                                        className={`group relative flex flex-col items-center p-0 rounded-lg cursor-pointer transition-all duration-200 border overflow-hidden h-full 
                                                                                        ${field.value ===
                                                                                                template.id
                                                                                                ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
                                                                                                : "hover:bg-primary/5 hover:shadow-md border-border hover:border-primary/30"
                                                                                            }`}
                                                                                        onClick={() => {
                                                                                            field.onChange(template.id);
                                                                                        }}
                                                                                    >
                                                                                        {field.value === template.id && (
                                                                                            <div className="absolute top-3 right-3 z-10">
                                                                                                <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-sm">
                                                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                                                </div>
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="relative w-full aspect-square overflow-hidden">
                                                                                            {template.previewImageUrl ? (
                                                                                                <Image
                                                                                                    src={template.previewImageUrl}
                                                                                                    alt={template.name}
                                                                                                    fill
                                                                                                    className="object-cover"
                                                                                                />
                                                                                            ) : (
                                                                                                <div
                                                                                                    className={`h-full w-full flex items-center justify-center bg-muted/50 transition-colors duration-200 group-hover:bg-muted`}
                                                                                                >
                                                                                                    {display.icon && (
                                                                                                        <display.icon className="h-16 w-16 text-muted-foreground/40 transition-opacity duration-300 group-hover:text-primary/40" />
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>

                                                                                        <div className="w-full p-4 bg-background/90 backdrop-blur-sm border-t">
                                                                                            <div className="flex flex-col items-center gap-2 mb-2">
                                                                                                <h3
                                                                                                    className="text-sm font-medium truncate w-full text-center"
                                                                                                    title={template.name}
                                                                                                >
                                                                                                    {template.name}
                                                                                                </h3>
                                                                                                <Badge
                                                                                                    variant="outline"
                                                                                                    className="bg-primary/10 hover:bg-primary/15 text-xs font-medium"
                                                                                                >
                                                                                                    {display.label}
                                                                                                </Badge>
                                                                                            </div>
                                                                                            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <BrainCircuit className="h-3.5 w-3.5" />
                                                                                                    <span>
                                                                                                        {template._count?.quizzes || 0}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <Clock className="h-3.5 w-3.5" />
                                                                                                    <span>
                                                                                                        {new Date(
                                                                                                            template.updatedAt,
                                                                                                        ).toLocaleDateString()}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <div className="col-span-3 p-8 text-center">
                                                                                <div className="flex flex-col items-center justify-center gap-3">
                                                                                    <div className="relative w-16 h-16">
                                                                                        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-75"></div>
                                                                                        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-primary/20">
                                                                                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                                                        </div>
                                                                                    </div>
                                                                                    <p className="text-lg font-medium text-muted-foreground">
                                                                                        Loading templates...
                                                                                    </p>
                                                                                    <div className="text-xs text-muted-foreground/70 mt-2 flex flex-col gap-1">
                                                                                        <p>
                                                                                            {Array.isArray(templates)
                                                                                                ? `Found ${templates.length} templates`
                                                                                                : "Templates data is not an array"}
                                                                                        </p>
                                                                                        {currentTemplate && (
                                                                                            <p>
                                                                                                Selected template:{" "}
                                                                                                {currentTemplate.name}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <div className="mt-6">
                                                            <div className="flex justify-between">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => form.reset()}
                                                                    disabled={
                                                                        !hasFormChanges ||
                                                                        isGeneratingContent ||
                                                                        isSubmitting
                                                                    }
                                                                    className="gap-2 border-muted-foreground/30 text-muted-foreground"
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                    Reset
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => setActiveTab("content")}
                                                                    disabled={!currentTemplate}
                                                                    className="gap-2 shadow-sm"
                                                                >
                                                                    Continue to Content
                                                                    <ArrowRight className="ml-1 h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Help text */}
                                                        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                                                            <div className="flex gap-3">
                                                                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                                                <div className="space-y-1">
                                                                    <p className="text-sm font-medium">
                                                                        Template Selection Tips
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Choose a template that best suits your content.
                                                                        Each template is optimized for specific quiz
                                                                        types and learning objectives.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="content" className="p-0 m-0">
                                                <Card className="border border-border/50 shadow-sm">
                                                    <CardHeader className="pb-3 border-b">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <CardTitle className="flex items-center text-xl">
                                                                    <FileCode className="h-5 w-5 mr-2 text-primary" />
                                                                    Quiz Content & Details
                                                                </CardTitle>
                                                                <CardDescription>
                                                                    Enter the details for your quiz
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-6 pt-6">
                                                        {/* Basic Content Section */}
                                                        <div className="space-y-5">
                                                            <div className="flex items-center gap-2 pb-1 border-b">
                                                                <div className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                                    1
                                                                </div>
                                                                <h3 className="text-base font-medium">
                                                                    Basic Content
                                                                </h3>
                                                            </div>

                                                            <FormField
                                                                control={form.control}
                                                                name="language"
                                                                render={({ field }) => (
                                                                    <FormItem className="bg-muted/30 rounded-lg p-3 border">
                                                                        <FormLabel className="flex items-center text-sm font-medium">
                                                                            <GlobeIcon className="h-4 w-4 mr-2 text-primary" />
                                                                            Language
                                                                        </FormLabel>
                                                                        <Select
                                                                            onValueChange={(value) => {
                                                                                // Set the language field
                                                                                field.onChange(value);

                                                                                // After language change, regenerate the preview after a short delay
                                                                                // This allows the form to update with the new language value
                                                                                setTimeout(async () => {
                                                                                    console.log("Language changed to:", value);
                                                                                    try {
                                                                                        const html = await regeneratePreviewHtml();
                                                                                        console.log("Preview HTML regenerated after language change:", html ? "success" : "empty");

                                                                                        if (previewIframeRef.current) {
                                                                                            setIsPreviewLoading(true);
                                                                                            setTimeout(() => {
                                                                                                updatePreviewScale();
                                                                                                setIsPreviewLoading(false);
                                                                                            }, 300);
                                                                                        }
                                                                                    } catch (error) {
                                                                                        console.error("Error updating preview after language change:", error);
                                                                                    }
                                                                                }, 100);
                                                                            }}
                                                                            defaultValue={field.value}
                                                                        >
                                                                            <FormControl>
                                                                                <SelectTrigger className="bg-background">
                                                                                    <SelectValue placeholder="Select a language" />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                {Object.entries(LANGUAGES).map(
                                                                                    ([code, name]) => (
                                                                                        <SelectItem key={code} value={code}>
                                                                                            {name}
                                                                                        </SelectItem>
                                                                                    ),
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="title"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel className="flex items-center text-sm">
                                                                                <span className="font-medium">Title</span>
                                                                                <span className="ml-1 text-xs text-primary">
                                                                                    *
                                                                                </span>
                                                                            </FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Quiz title"
                                                                                    {...field}
                                                                                    className="bg-background"
                                                                                    onChange={(e) => {
                                                                                        // First update the field value
                                                                                        field.onChange(e);

                                                                                        // Prevent recursion when manually updating
                                                                                        if (!isSyncingTitleRef.current) {
                                                                                            try {
                                                                                                isSyncingTitleRef.current = true;
                                                                                                // Then manually update variables.title
                                                                                                const newTitle = e.target.value;
                                                                                                console.log("Title input changed, updating variables.title:", newTitle);
                                                                                                form.setValue('variables.title', newTitle, {
                                                                                                    shouldDirty: true,
                                                                                                    shouldValidate: false
                                                                                                });
                                                                                            } finally {
                                                                                                isSyncingTitleRef.current = false;
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                {/* Time Limit field removed - not in database schema */}
                                                                {/* <FormField
                                                            control={form.control}
                                                            name="timeLimit"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="flex items-center text-sm">
                                                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                                                        <span className="font-medium">Time Limit (minutes)</span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min={1}
                                                                            max={60}
                                                                            placeholder="Time limit in minutes"
                                                                            {...field}
                                                                            onChange={(e) => {
                                                                                const value = parseInt(e.target.value);
                                                                                field.onChange(isNaN(value) ? '' : value);
                                                                            }}
                                                                            className="bg-background"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        /> */}
                                                            </div>

                                                            {/* Description field might be stored in the variables JSON field, keeping for now */}
                                                            <FormField
                                                                control={form.control}
                                                                name="description"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="flex items-center text-sm font-medium">
                                                                            Description
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Textarea
                                                                                placeholder="Brief description of the quiz"
                                                                                className="min-h-[80px] resize-y bg-background"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        {/* Template Variables Section */}
                                                        <div className="space-y-5 pt-4">
                                                            <div className="flex items-center gap-2 pb-1 border-b">
                                                                <div className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                                    2
                                                                </div>
                                                                <h3 className="text-base font-medium">
                                                                    Template Variables
                                                                </h3>
                                                            </div>

                                                            <div className="space-y-5">
                                                                {currentTemplate ? (
                                                                    currentTemplate.variables &&
                                                                        typeof currentTemplate.variables === "object" &&
                                                                        Object.keys(currentTemplate.variables).length >
                                                                        0 ? (
                                                                        <div className="grid grid-cols-1 gap-5">
                                                                            {Object.entries(
                                                                                currentTemplate.variables,
                                                                            ).map(([key, defaultValue], index) => {
                                                                                // Ensure we have a form value, or fall back to a controlled empty string
                                                                                const currentValue = form.watch(
                                                                                    `variables.${key}`,
                                                                                );

                                                                                return (
                                                                                    <FormField
                                                                                        key={`${key}-${index}`}
                                                                                        control={form.control}
                                                                                        name={`variables.${key}`}
                                                                                        render={({ field }) => (
                                                                                            <FormItem className="bg-muted/30 rounded-lg p-3 border">
                                                                                                <FormLabel className="capitalize flex items-center gap-2 text-sm">
                                                                                                    <span className="font-medium">
                                                                                                        {key
                                                                                                            .replace(/([A-Z])/g, " $1")
                                                                                                            .trim()}
                                                                                                    </span>
                                                                                                    {key === "question" && (
                                                                                                        <Badge
                                                                                                            variant="outline"
                                                                                                            className="text-[10px] font-normal py-0 h-4"
                                                                                                        >
                                                                                                            Required
                                                                                                        </Badge>
                                                                                                    )}
                                                                                                </FormLabel>
                                                                                                <FormControl>
                                                                                                    {key === "question" ? (
                                                                                                        <Textarea
                                                                                                            placeholder={`Enter ${key}`}
                                                                                                            className="min-h-[100px] resize-y bg-background"
                                                                                                            {...field}
                                                                                                            value={field.value ?? ""}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <Input
                                                                                                            placeholder={`Enter ${key}`}
                                                                                                            {...field}
                                                                                                            value={field.value ?? ""}
                                                                                                            className="bg-background"
                                                                                                        />
                                                                                                    )}
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                            </FormItem>
                                                                                        )}
                                                                                    />
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-5 border rounded-lg bg-muted/5">
                                                                            <div className="flex gap-3">
                                                                                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                                <div className="space-y-2">
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        This template doesn't have any variables
                                                                                        to customize.
                                                                                    </p>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        Skip to the next section to provide your
                                                                                        answer and other details.
                                                                                    </p>
                                                                                    {currentTemplate && (
                                                                                        <details className="mt-2">
                                                                                            <summary className="text-xs cursor-pointer text-primary">
                                                                                                Debug Information
                                                                                            </summary>
                                                                                            <div className="p-2 mt-2 bg-muted/20 rounded text-xs font-mono overflow-auto max-h-[200px]">
                                                                                                <p>
                                                                                                    Template ID: {currentTemplate.id}
                                                                                                </p>
                                                                                                <p>
                                                                                                    Template Type:{" "}
                                                                                                    {currentTemplate.quizType}
                                                                                                </p>
                                                                                                <p>
                                                                                                    Variables Type:{" "}
                                                                                                    {typeof currentTemplate.variables}
                                                                                                </p>
                                                                                                <p>
                                                                                                    Has Variables Property:{" "}
                                                                                                    {currentTemplate.hasOwnProperty(
                                                                                                        "variables",
                                                                                                    )
                                                                                                        ? "Yes"
                                                                                                        : "No"}
                                                                                                </p>
                                                                                                <p>
                                                                                                    Variables Content:{" "}
                                                                                                    {JSON.stringify(
                                                                                                        currentTemplate.variables,
                                                                                                        null,
                                                                                                        2,
                                                                                                    )}
                                                                                                </p>
                                                                                            </div>
                                                                                        </details>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <div className="p-5 border rounded-lg bg-muted/5">
                                                                        <div className="flex gap-3">
                                                                            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                            <p className="text-sm text-muted-foreground">
                                                                                Please select a template first to see
                                                                                customization options.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Answer and Properties Section */}
                                                        <div className="space-y-5 pt-4">
                                                            <div className="flex items-center gap-2 pb-1 border-b">
                                                                <h3 className="text-base font-medium flex items-center">
                                                                    <div className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                                                        3
                                                                    </div>
                                                                    Answer & Properties
                                                                </h3>
                                                            </div>

                                                            <FormField
                                                                control={form.control}
                                                                name="answer"
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-1">
                                                                        <FormLabel>
                                                                            <div className="flex items-center gap-1.5">
                                                                                Answer{" "}
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-[10px] font-normal py-0 h-4"
                                                                                >
                                                                                    Required
                                                                                </Badge>
                                                                            </div>
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="Enter the correct answer"
                                                                                {...field}
                                                                                className="max-w-md"
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription className="text-xs">
                                                                            This is what students need to provide to get
                                                                            credit
                                                                        </FormDescription>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="solution"
                                                                render={({ field }) => (
                                                                    <FormItem className="space-y-1">
                                                                        <FormLabel>
                                                                            <div className="flex items-center gap-1.5">
                                                                                Solution{" "}
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-[10px] font-normal py-0 h-4"
                                                                                >
                                                                                    Optional
                                                                                </Badge>
                                                                            </div>
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Textarea
                                                                                placeholder="Detailed explanation for the answer"
                                                                                {...field}
                                                                                className="resize-y min-h-[100px]"
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription className="text-xs">
                                                                            Explain the solution or add hints for students
                                                                        </FormDescription>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="tags"
                                                                    render={({ field }) => (
                                                                        <FormItem className="space-y-1">
                                                                            <FormLabel>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <TagIcon className="h-3.5 w-3.5 text-primary" />
                                                                                    Tags{" "}
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-[10px] font-normal py-0 h-4"
                                                                                    >
                                                                                        Optional
                                                                                    </Badge>
                                                                                </div>
                                                                            </FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Separate tags with commas (e.g., math, algebra)"
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                            <FormDescription className="text-xs">
                                                                                Help others discover your quiz
                                                                            </FormDescription>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <FormField
                                                                    control={form.control}
                                                                    name="visibility"
                                                                    render={({ field }) => (
                                                                        <FormItem className="space-y-1">
                                                                            <FormLabel>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <EyeIcon className="h-3.5 w-3.5 text-primary" />
                                                                                    Visibility{" "}
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-[10px] font-normal py-0 h-4"
                                                                                    >
                                                                                        Optional
                                                                                    </Badge>
                                                                                </div>
                                                                            </FormLabel>
                                                                            <Select
                                                                                onValueChange={field.onChange}
                                                                                defaultValue={field.value}
                                                                            >
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select visibility" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    <SelectItem value="private">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                            Private (only you)
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                    <SelectItem value="restricted">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                            Restricted (specific users)
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                    <SelectItem value="public">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <GlobeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                            Public (anyone)
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormDescription className="text-xs">
                                                                                Control who can see and use this quiz
                                                                            </FormDescription>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                        </div>

                                        <div className="flex justify-between mt-8 pt-6 border-t">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setActiveTab("template")}
                                                className="gap-2"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Back to Template
                                            </Button>
                                            <div className="flex gap-3">
                                                <Button
                                                    type="button"
                                                    onClick={handleAIFill}
                                                    disabled={isSubmitting || !currentTemplate}
                                                    className="gap-2 shadow-sm border-primary/30 text-primary hover:text-primary hover:bg-primary/10 relative overflow-hidden"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    <span>AI Fill</span>
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={isGeneratingContent || isSubmitting}
                                                    className="gap-2 shadow-sm"
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4" />
                                                    )}
                                                    Create Quiz
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </Form>
                            </Tabs>
                        </div>

                        {/* Preview Section with added tips */}
                        <div className="col-span-12 lg:col-span-4 space-y-4">
                            <Card className="border shadow-sm sticky top-6">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <EyeIcon className="h-5 w-5 text-primary" />
                                            Live Preview
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
                                            Preview
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div
                                        ref={previewWrapperRef}
                                        className={cn(
                                            "w-full aspect-square bg-white rounded-lg overflow-hidden shadow-sm border relative",
                                            {
                                                "items-center justify-center flex": !previewHtml || isPreviewLoading
                                            }
                                        )}
                                        style={{ transform: `scale(${1})` }}
                                    >
                                        <div className="w-full h-full overflow-hidden">
                                            {isGeneratingContent && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 bg-background/95">
                                                    <div className="w-full max-w-md">
                                                        <h3 className="text-lg font-medium mb-3 text-center">
                                                            Generating Content
                                                        </h3>
                                                        <div className="w-full bg-muted/30 rounded-full h-2.5 mb-4">
                                                            <div
                                                                className="bg-primary h-2.5 rounded-full"
                                                                style={{ width: `${generationProgress}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground text-center mb-2">
                                                            {currentField
                                                                ? `Generating ${currentField}...`
                                                                : "Initializing..."}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {previewHtml ? (
                                                <iframe
                                                    srcDoc={`
                                                <!DOCTYPE html>
                                                <html>
                                                <head>
                                                    <meta charset="UTF-8">
                                                    <meta name="viewport" content="width=1080, height=1080, initial-scale=1, user-scalable=no">
                                                    <style>
                                                        html, body {
                                                            margin: 0;
                                                            padding: 0;
                                                            width: 1080px;
                                                            height: 1080px;
                                                            overflow: hidden;
                                                            background-color: white;
                                                        }
                                                        * {
                                                            box-sizing: border-box;
                                                        }
                                                        ${currentTemplate?.css || ""}
                                                    </style>
                                                </head>
                                                <body>
                                                    ${previewHtml}
                                                </body>
                                                </html>
                                            `}
                                                    title="Quiz Preview"
                                                    style={{
                                                        width: "1080px",
                                                        height: "1080px",
                                                        border: "none",
                                                        transformOrigin: "0 0",
                                                        transform: "scale(0.3)",
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        opacity: isPreviewLoading ? 0 : 1,
                                                        transition: "opacity 0.3s ease-in-out",
                                                    }}
                                                    sandbox="allow-same-origin allow-scripts"
                                                    ref={previewIframeRef}
                                                    onLoad={updatePreviewScale}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                                                        <Sparkles className="h-8 w-8 text-primary/40" />
                                                    </div>
                                                    <h3 className="text-lg font-medium mb-2">
                                                        Preview Will Appear Here
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground max-w-md">
                                                        Select a template and fill in the content to see how
                                                        your quiz will look
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3 border-b bg-muted/20">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Quick Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-4 text-sm">
                                        <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                                            <h4 className="text-sm font-medium flex items-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                                Keep it concise
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Focus your quiz on a single, well-defined concept for higher engagement.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-md bg-muted/20 border">
                                            <h4 className="text-sm font-medium flex items-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                                Use clear language
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Write questions that are easy to understand. Avoid jargon and complex phrasing.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                </div>
            </div>
        </div>

            {/* Sticky footer for smaller screens */ }
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-md z-50 p-3 lg:hidden">
                <div className="container flex justify-between items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            activeTab === "content"
                                ? setActiveTab("template")
                                : router.push("/dashboard/quizzes")
                        }
                        className="h-9"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                        {activeTab === "content" ? "Back" : "Cancel"}
                    </Button>

                    {activeTab === "template" ? (
                        <Button
                            size="sm"
                            onClick={() => setActiveTab("content")}
                            disabled={!currentTemplate}
                            className="h-9"
                        >
                            Next
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            disabled={isGeneratingContent || isSubmitting}
                            onClick={form.handleSubmit(handleSubmit)}
                            className="h-9"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Create Quiz
                        </Button>
                    )}
                </div>
            </div>

            <BatchGenerationProgress
                isOpen={batchState.isOpen}
                totalQuizzes={batchState.totalQuizzes}
                completedQuizzes={batchState.completedQuizzes}
                currentQuiz={batchState.currentQuiz}
                errors={batchState.errors}
                onClose={closeBatchGeneration}
                onRetry={retryFailedQuiz}
            />
        </div >
    );
} 
