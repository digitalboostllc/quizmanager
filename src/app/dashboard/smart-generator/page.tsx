"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { AutomaticIcon } from "@/components/ui/custom-icons";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
    QuizPreview,
    ThemeInput
} from "@/components/ui/smart-generator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import type { Template } from "@/lib/types";
import { LANGUAGES, Language, QuizType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { animated, useSpring } from '@react-spring/web';
import confetti from 'canvas-confetti';
import { format } from "date-fns";
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    Brain,
    Calendar as CalendarIcon,
    CalendarRangeIcon,
    Check,
    CheckCircle2,
    Circle,
    Clock,
    Dices,
    FileImage,
    FileText,
    Globe,
    Image as ImageIcon,
    LayoutGrid,
    Loader2,
    Palette,
    Pencil,
    PencilRuler,
    RocketIcon,
    Settings,
    Shuffle,
    Sparkles,
    Stars,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { SAMPLE_TEMPLATES } from "./test-fixture";

// Extend Template type to include the properties we need
interface ExtendedTemplate extends Template {
    type: QuizType;
    thumbnailUrl?: string;
    description?: string;
}

// Define TemplateFixture to match SAMPLE_TEMPLATES
interface TemplateFixture {
    id: string;
    name: string;
    description?: string;
    quizType: QuizType;
    createdAt: string;
    [key: string]: any;
}

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
    generatedQuizzes: Array<{
        id?: string;
        title: string;
        type: string;
        scheduledAt: string;
        imageUrl?: string;
        status: 'pending' | 'generating' | 'processing' | 'completed' | 'error';
        progress: number;
    }>;
    stages: {
        id: string;
        name: string;
        description: string;
        progress: number;
        status: 'pending' | 'in_progress' | 'completed' | 'error';
        subStages?: {
            id: string;
            name: string;
            status: 'pending' | 'in_progress' | 'completed' | 'error';
        }[];
    }[];
    estimatedTimeRemaining?: number;
}

const DIFFICULTY_OPTIONS = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "progressive", label: "Progressive (Easy → Hard)" },
];

const TIME_SLOTS = [
    { id: "morning", label: "Morning (8-11 AM)", defaultMultiplier: 1, description: "Early morning quizzes" },
    { id: "lunch", label: "Lunch (11 AM-2 PM)", defaultMultiplier: 1, description: "Midday quizzes" },
    { id: "afternoon", label: "Afternoon (2-5 PM)", defaultMultiplier: 1, description: "Afternoon quizzes" },
    { id: "evening", label: "Evening (5-8 PM)", defaultMultiplier: 1, description: "Evening quizzes" },
    { id: "night", label: "Night (8-11 PM)", defaultMultiplier: 1, description: "Late night quizzes" },
];

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
    'WORDLE': 'Wordle',
    'NUMBER_SEQUENCE': 'Number Sequence',
    'RHYME_TIME': 'Rhyme Time',
    'CONCEPT_CONNECTION': 'Concept Connection'
};

// Add these types for the API responses
interface BatchResponseType {
    batchId: string;
    message?: string;
    [key: string]: any;
}

interface BatchStatusResponseType {
    isComplete: boolean;
    completedCount: number;
    currentTemplate?: string;
    stage?: "preparing" | "generating" | "scheduling" | "processing-images" | "complete";
    generatedQuizzes?: Array<{
        id: string;
        title: string;
        type: string;
        scheduledAt: string;
        imageUrl?: string;
    }>;
    error?: string;
    [key: string]: any;
}

// Add this new interface for auto-schedule slots
interface AutoScheduleSlot {
    id: string;
    dayOfWeek: number;
    timeOfDay: string;
    isActive: boolean;
}

export default function SmartGeneratorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    const [templates, setTemplates] = useState<ExtendedTemplate[]>([]);
    const [activeTab, setActiveTab] = useState("templates");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStats, setGenerationStats] = useState<GenerationStats>({
        completed: 0,
        total: 0,
        currentTemplate: "",
        currentStage: "preparing",
        progress: 0,
        timeRemaining: 0,
        stages: [
            {
                id: 'preparing',
                name: 'Preparing Generation',
                description: 'Initializing quiz generation process and validating inputs',
                progress: 0,
                status: 'pending',
                subStages: [
                    { id: 'validate-inputs', name: 'Validating inputs', status: 'pending' },
                    { id: 'check-limits', name: 'Checking generation limits', status: 'pending' },
                    { id: 'initialize-services', name: 'Initializing services', status: 'pending' }
                ]
            },
            {
                id: 'generating',
                name: 'Generating Quizzes',
                description: 'Creating quiz content and questions',
                progress: 0,
                status: 'pending',
                subStages: [
                    { id: 'generate-content', name: 'Generating quiz content', status: 'pending' },
                    { id: 'create-questions', name: 'Creating questions', status: 'pending' },
                    { id: 'validate-content', name: 'Validating content', status: 'pending' }
                ]
            },
            {
                id: 'processing-images',
                name: 'Processing Images',
                description: 'Generating and optimizing quiz images',
                progress: 0,
                status: 'pending',
                subStages: [
                    { id: 'generate-images', name: 'Generating images', status: 'pending' },
                    { id: 'optimize-images', name: 'Optimizing images', status: 'pending' },
                    { id: 'upload-images', name: 'Uploading images', status: 'pending' }
                ]
            },
            {
                id: 'scheduling',
                name: 'Scheduling Posts',
                description: 'Setting up post schedules and distribution',
                progress: 0,
                status: 'pending',
                subStages: [
                    { id: 'calculate-schedule', name: 'Calculating schedule', status: 'pending' },
                    { id: 'create-posts', name: 'Creating scheduled posts', status: 'pending' },
                    { id: 'verify-schedule', name: 'Verifying schedule', status: 'pending' }
                ]
            }
        ],
        estimatedTimeRemaining: undefined
    });
    const [selectedQuizPreview, setSelectedQuizPreview] = useState<{
        title: string;
        type: string;
        scheduledAt: string;
        answer: string;
        solution?: string;
        variables: Record<string, any>;
        imageUrl?: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showQuizPreview, setShowQuizPreview] = useState(false);

    // Add state for scheduling approach
    const [schedulingApproach, setSchedulingApproach] = useState<"manual" | "auto">("manual");

    // Add state for auto-schedule slots
    const [autoScheduleSlots, setAutoScheduleSlots] = useState<AutoScheduleSlot[]>([]);
    const [loadingAutoSchedule, setLoadingAutoSchedule] = useState(false);
    const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);

    // Add missing time slot state
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<Array<{ id: string; multiplier: number }>>([
        { id: "afternoon", multiplier: 1 },
        { id: "evening", multiplier: 1 }
    ]);

    // Grid background style
    const gridBgStyle = {
        backgroundSize: '40px 40px',
        backgroundImage: `
            linear-gradient(to right, var(--primary)/5% 1px, transparent 1px),
            linear-gradient(to bottom, var(--primary)/5% 1px, transparent 1px)
        `,
    };

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

    const methods = useForm<ConfigFormValues>({
        resolver: zodResolver(configSchema),
        defaultValues,
    });

    // Add isValid definition here, after methods is initialized
    const isValid = useMemo(() => methods.formState.isValid, [methods.formState.isValid]);

    const selectedTemplates = methods.watch("templates");
    const templateCount = selectedTemplates.length;

    // Load templates on page load
    useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            try {
                // Always attempt to fetch from API first, regardless of environment
                console.log('Smart Generator: Starting to load templates');
                const response = await fetchApi<any>('/api/templates');
                console.log('Smart Generator: Templates loaded successfully', response);

                // Check if response is valid and contains templates data
                let templatesData: any[] = [];

                // Handle different possible response formats
                if (Array.isArray(response)) {
                    templatesData = response;
                } else if (response?.data && Array.isArray(response.data)) {
                    templatesData = response.data;
                } else if (response?.templates && Array.isArray(response.templates)) {
                    templatesData = response.templates;
                } else {
                    console.error('API response does not contain a templates array:', response);
                    throw new Error('Invalid API response format');
                }

                if (templatesData.length > 0) {
                    // Create properly formatted ExtendedTemplate objects from the data
                    const extendedTemplates = templatesData.map((template: any) => {
                        return {
                            id: template.id || "",
                            name: template.name || "",
                            html: template.html || "<div>Sample template content</div>",
                            css: template.css || null,
                            variables: template.variables || {},
                            updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
                            createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
                            // Use quizType for the main type if available
                            type: template.quizType || template.type || 'CONCEPT_CONNECTION' as QuizType,
                            thumbnailUrl: template.thumbnailUrl || undefined,
                            description: template.description || ""
                        } as ExtendedTemplate;
                    });

                    setTemplates(extendedTemplates);
                    console.log('Templates loaded and processed:', extendedTemplates.length);
                } else {
                    throw new Error('No templates found in API response');
                }
            } catch (error) {
                // Fallback to sample templates if API fails
                console.error('Failed to fetch templates:', error);

                // Transform sample templates to match ExtendedTemplate interface
                const transformedTemplates = (SAMPLE_TEMPLATES as TemplateFixture[]).map(template => ({
                    ...template,
                    html: "<div>Sample template content</div>",
                    css: null,
                    variables: {},
                    createdAt: new Date(template.createdAt),
                    updatedAt: new Date(),
                    type: template.quizType || 'CONCEPT_CONNECTION' as QuizType,
                    description: template.description || ""
                })) as ExtendedTemplate[];

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

        loadTemplates();
    }, [toast]);

    // Track completion of each step
    const stepsCompleted = useMemo(() => {
        const templatesSelected = selectedTemplates.length > 0;
        const configComplete = methods.formState.isValid;
        return {
            templates: templatesSelected,
            configure: configComplete,
            schedule: configComplete,
        };
    }, [selectedTemplates.length, methods.formState.isValid]);

    const getNextTab = (currentTab: string) => {
        switch (currentTab) {
            case "templates":
                return "configure";
            case "configure":
                return "schedule";
            default:
                return currentTab;
        }
    };

    const handleContinue = () => {
        const nextTab = getNextTab(activeTab);
        setActiveTab(nextTab);
    };

    // Start generation
    const handleStartGeneration = async () => {
        // Validate form
        const valid = await methods.trigger();
        if (!valid) {
            console.error("Smart Generator: Form validation failed");
            console.log("Smart Generator: Current form values:", methods.getValues());
            console.log("Smart Generator: Form errors:", methods.formState.errors);

            toast({
                title: "Configuration incomplete",
                description: "Please complete all required fields before generating.",
                variant: "destructive",
            });
            return;
        }

        // Get form values
        const values = methods.getValues();

        // Additional validation
        if (!values.templates || values.templates.length === 0) {
            console.error("Smart Generator: No templates selected");
            toast({
                title: "No templates selected",
                description: "Please select at least one template to generate quizzes from.",
                variant: "destructive",
            });
            return;
        }

        if (!values.count || values.count <= 0) {
            console.error("Smart Generator: Invalid quiz count");
            toast({
                title: "Invalid quiz count",
                description: "Please specify how many quizzes to generate.",
                variant: "destructive",
            });
            return;
        }

        if (!values.timeSlots || values.timeSlots.length === 0) {
            console.error("Smart Generator: No time slots selected");
            // Set a default time slot
            values.timeSlots = [{ id: "morning", multiplier: 1 }];
            console.log("Smart Generator: Using default time slot:", values.timeSlots);
        }

        if (!values.startDate || !(values.startDate instanceof Date)) {
            console.error("Smart Generator: Invalid start date");
            // Set to today
            values.startDate = new Date();
            console.log("Smart Generator: Using default start date:", values.startDate);
        }

        setIsGenerating(true);
        setGenerationStats({
            completed: 0,
            total: values.count,
            currentTemplate: templates.find(t => t.id === values.templates[0])?.name || "Template",
            currentStage: "preparing",
            progress: 0,
            timeRemaining: values.count * 15, // Initial estimate
            stages: [
                {
                    id: 'preparing',
                    name: 'Preparing Generation',
                    description: 'Initializing quiz generation process and validating inputs',
                    progress: 0,
                    status: 'pending',
                    subStages: [
                        { id: 'validate-inputs', name: 'Validating inputs', status: 'pending' },
                        { id: 'check-limits', name: 'Checking generation limits', status: 'pending' },
                        { id: 'initialize-services', name: 'Initializing services', status: 'pending' }
                    ]
                },
                {
                    id: 'generating',
                    name: 'Generating Quizzes',
                    description: 'Creating quiz content and questions',
                    progress: 0,
                    status: 'pending',
                    subStages: [
                        { id: 'generate-content', name: 'Generating quiz content', status: 'pending' },
                        { id: 'create-questions', name: 'Creating questions', status: 'pending' },
                        { id: 'validate-content', name: 'Validating content', status: 'pending' }
                    ]
                },
                {
                    id: 'processing-images',
                    name: 'Processing Images',
                    description: 'Generating and optimizing quiz images',
                    progress: 0,
                    status: 'pending',
                    subStages: [
                        { id: 'generate-images', name: 'Generating images', status: 'pending' },
                        { id: 'optimize-images', name: 'Optimizing images', status: 'pending' },
                        { id: 'upload-images', name: 'Uploading images', status: 'pending' }
                    ]
                },
                {
                    id: 'scheduling',
                    name: 'Scheduling Posts',
                    description: 'Setting up post schedules and distribution',
                    progress: 0,
                    status: 'pending',
                    subStages: [
                        { id: 'calculate-schedule', name: 'Calculating schedule', status: 'pending' },
                        { id: 'create-posts', name: 'Creating scheduled posts', status: 'pending' },
                        { id: 'verify-schedule', name: 'Verifying schedule', status: 'pending' }
                    ]
                }
            ],
            estimatedTimeRemaining: undefined
        });

        try {
            // Start the generation process
            await generateQuizzes(values);
        } catch (error) {
            console.error("Error generating quizzes:", error);
            setGenerationStats(prev => ({
                ...prev,
                error: "Failed to generate quizzes. Please try again.",
                stages: prev.stages.map(stage => ({
                    ...stage,
                    status: 'error'
                }))
            }));
        }
    };

    // Add function to load auto-schedule settings
    const loadAutoScheduleSettings = useCallback(async () => {
        setLoadingAutoSchedule(true);
        try {
            // Load auto-schedule slots from the API
            const slots = await fetchApi<AutoScheduleSlot[]>('settings/schedule/time-slots');

            // Get the general settings to check if auto-schedule is enabled
            const settings = await fetchApi<{ autoScheduleEnabled: boolean }>('settings');

            setAutoScheduleSlots(slots || []);
            setAutoScheduleEnabled(settings?.autoScheduleEnabled || false);
        } catch (error) {
            console.error('Error loading auto-schedule settings:', error);
            toast({
                title: "Error",
                description: "Failed to load auto-schedule settings.",
                variant: "destructive",
            });
        } finally {
            setLoadingAutoSchedule(false);
        }
    }, [toast]);

    // Load auto-schedule settings when scheduling approach changes to auto
    useEffect(() => {
        if (schedulingApproach === "auto") {
            loadAutoScheduleSettings();
        }
    }, [schedulingApproach, loadAutoScheduleSettings]);

    // Real implementation for quiz generation
    const generateQuizzes = async (values: ConfigFormValues) => {
        console.log('Smart Generator: Starting quiz generation with values:', values);
        setGenerationStats(prev => ({
            ...prev,
            currentStage: 'preparing',
            progress: 5,
            stages: prev.stages.map(stage => ({
                ...stage,
                status: 'in_progress'
            }))
        }));

        const initialStats: GenerationStats = {
            completed: 0,
            total: values.count,
            currentTemplate: 'Initializing...',
            currentStage: 'preparing',
            progress: 5,
            timeRemaining: 60,
            generatedQuizzes: Array.from({ length: values.count }).map((_, i) => ({
                title: `Quiz ${i + 1}`,
                type: 'Unknown',
                scheduledAt: new Date().toISOString(),
                status: 'pending',
                progress: 0
            })),
            stages: [
                {
                    id: 'preparing',
                    name: 'Preparing Generation',
                    description: 'Validating inputs and preparing services',
                    progress: 0,
                    status: 'in_progress',
                    subStages: [
                        { id: 'validate-inputs', name: 'Validating inputs', status: 'in_progress' },
                        { id: 'check-limits', name: 'Checking generation limits', status: 'pending' },
                        { id: 'initialize-services', name: 'Initializing services', status: 'pending' }
                    ]
                },
                {
                    id: 'generating',
                    name: 'Generating Quizzes',
                    description: 'Creating questions and content',
                    progress: 0,
                    status: 'pending',
                    subStages: Array.from({ length: values.count }).map((_, i) => ({
                        id: `generate-content-${i + 1}`,
                        name: `Quiz ${i + 1} content`,
                        status: 'pending'
                    }))
                },
                {
                    id: 'processing-images',
                    name: 'Processing Images',
                    description: 'Generating and optimizing images',
                    progress: 0,
                    status: 'pending',
                    subStages: Array.from({ length: values.count }).map((_, i) => ({
                        id: `process-image-${i + 1}`,
                        name: `Quiz ${i + 1} image`,
                        status: 'pending'
                    }))
                },
                {
                    id: 'scheduling',
                    name: 'Scheduling Posts',
                    description: 'Creating scheduled posts',
                    progress: 0,
                    status: 'pending',
                    subStages: [
                        { id: 'calculate-schedule', name: 'Calculating schedule', status: 'pending' },
                        { id: 'create-posts', name: 'Creating scheduled posts', status: 'pending' },
                        { id: 'verify-schedule', name: 'Verifying schedule', status: 'pending' }
                    ]
                }
            ]
        };

        setGenerationStats(initialStats);

        try {
            // Step 1: Create payload for API request
            const distributionData = values.timeSlots.some(slot => slot.multiplier > 0)
                ? prepareTimeSlotDistribution(values.timeSlots, values.startDate, values.count)
                : prepareAutoScheduleDistribution(autoScheduleSlots, values.startDate, values.count);

            const payload = {
                templateIds: values.templates,
                count: values.count,
                theme: values.theme || "General knowledge",
                startDate: values.startDate.toISOString(),
                endDate: values.endDate ? values.endDate.toISOString() : null,
                difficulty: values.difficulty,
                variety: values.variety,
                timeSlotDistribution: distributionData, // Changed from 'distribution' to 'timeSlotDistribution'
                language: values.language || "en", // Ensure language is properly passed
            };

            console.log('Smart Generator: Preparing payload:', payload);

            // Step 2: Call API to start batch generation
            let batchId;
            try {
                // Update progress to show we're making the API call
                setGenerationStats(prev => ({
                    ...prev,
                    progress: 15,
                    stages: prev.stages.map(stage =>
                        stage.id === 'preparing' ?
                            {
                                ...stage,
                                progress: 50,
                                subStages: stage.subStages?.map(subStage =>
                                    subStage.id === 'validate-inputs' ?
                                        { ...subStage, status: 'completed' } :
                                        subStage.id === 'check-limits' ?
                                            { ...subStage, status: 'in_progress' } :
                                            subStage
                                )
                            } :
                            stage
                    )
                }));

                const batchResponse = await fetchApi<BatchResponseType>('quiz-generation/batch', {
                    method: 'POST',
                    body: payload,  // Remove JSON.stringify - fetchApi likely already handles this
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                batchId = batchResponse.batchId;
                console.log('Smart Generator: Batch started with ID:', batchId);

                // End of Step 2 - Update progress
                setGenerationStats(prev => ({
                    ...prev,
                    progress: 25,
                    stages: prev.stages.map(stage =>
                        stage.id === 'preparing' ?
                            {
                                ...stage,
                                progress: 100,
                                status: 'completed',
                                subStages: stage.subStages?.map(subStage => ({ ...subStage, status: 'completed' }))
                            } :
                            stage.id === 'generating' ?
                                { ...stage, status: 'in_progress', progress: 5 } :
                                stage
                    )
                }));

            } catch (error) {
                console.error('Smart Generator: Error starting batch:', error);
                setGenerationStats(prev => ({
                    ...prev,
                    error: 'Failed to start generation batch. Please try again.',
                    stages: prev.stages.map(stage =>
                        stage.id === 'preparing' ?
                            { ...stage, status: 'error' } :
                            stage
                    )
                }));
                return;
            }

            // Step 3: Poll for batch status until complete
            let isComplete = false;
            let progress = 25;
            let statusRetryCount = 0;
            let lastPollTime = Date.now();
            let pollInterval = 2000; // Start with 2 second interval

            while (!isComplete && statusRetryCount < 10) {
                // Dynamic polling interval based on stage
                const currentTime = Date.now();
                const timeSinceLastPoll = currentTime - lastPollTime;

                if (timeSinceLastPoll < pollInterval) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval - timeSinceLastPoll));
                    continue;
                }

                lastPollTime = Date.now();

                // Get batch status, falling back to mock if needed
                let statusResponse: BatchStatusResponseType;
                try {
                    statusResponse = await fetchApi<BatchStatusResponseType>(`quiz-generation/batch/${batchId}/status`);
                    console.log('Smart Generator: Received status response:', statusResponse);

                    // Update polling interval based on stage
                    if (statusResponse.stage === "processing-images") {
                        pollInterval = 3000; // Longer interval for image processing
                    } else if (statusResponse.stage === "generating") {
                        pollInterval = 2000; // Medium interval for generation
                    } else {
                        pollInterval = 1500; // Shorter interval for other stages
                    }

                    // Update stages based on backend status
                    setGenerationStats(prev => ({
                        ...prev,
                        stages: prev.stages.map(stage => {
                            if (stage.id === statusResponse.stage) {
                                // Calculate sub-stage progress
                                const subStages = stage.subStages?.map(subStage => {
                                    if (subStage.id === 'validate-inputs' && statusResponse.stage === 'preparing') {
                                        return { ...subStage, status: 'completed' };
                                    }
                                    if (subStage.id === 'generate-content' && statusResponse.stage === 'generating') {
                                        return { ...subStage, status: 'in_progress' };
                                    }
                                    if (subStage.id === 'processing-images' && statusResponse.stage === 'processing-images') {
                                        return { ...subStage, status: 'in_progress' };
                                    }
                                    if (subStage.id === 'scheduling' && statusResponse.stage === 'scheduling') {
                                        return { ...subStage, status: 'in_progress' };
                                    }
                                    return subStage;
                                });

                                // Calculate overall stage progress
                                const completedSubStages = subStages?.filter(s => s.status === 'completed').length || 0;
                                const totalSubStages = subStages?.length || 0;
                                const stageProgress = totalSubStages > 0
                                    ? Math.round((completedSubStages / totalSubStages) * 100)
                                    : 0;

                                return {
                                    ...stage,
                                    status: statusResponse.stage === stage.id ? 'in_progress' :
                                        statusResponse.stage === 'complete' ? 'completed' :
                                            statusResponse.stage === 'error' ? 'error' : 'pending',
                                    progress: stageProgress,
                                    subStages
                                };
                            }
                            // Mark previous stages as completed
                            if (prev.stages.findIndex(s => s.id === stage.id) <
                                prev.stages.findIndex(s => s.id === statusResponse.stage)) {
                                return {
                                    ...stage,
                                    status: 'completed',
                                    progress: 100,
                                    subStages: stage.subStages?.map(s => ({ ...s, status: 'completed' }))
                                };
                            }
                            return stage;
                        })
                    }));

                } catch (error) {
                    console.warn('Smart Generator: Status API request failed, retrying:', error);
                    // Retry with exponential backoff
                    try {
                        statusResponse = await fetchApi<BatchStatusResponseType>(`quiz-generation/batch/${batchId}/status`);
                    } catch (retryError) {
                        console.error('Smart Generator: Status API retry also failed:', retryError);
                        // Simulate progress for UI feedback, but don't increment retry count
                        statusResponse = {
                            batchId,
                            isComplete: false,
                            completedCount: Math.min(progress + 1, values.count),
                            stage: "generating",
                            generatedQuizzes: initialStats.generatedQuizzes.slice(0, Math.min(progress + 1, values.count))
                                .map(quiz => ({
                                    id: quiz.id || `temp-${Date.now()}-${Math.random()}`,
                                    title: quiz.title,
                                    type: quiz.type,
                                    scheduledAt: quiz.scheduledAt,
                                    imageUrl: quiz.imageUrl
                                }))
                        };
                        statusRetryCount++; // Only count retries when fallback is used
                    }
                }

                if (!statusResponse) {
                    throw new Error("Failed to get batch status");
                }

                // Update progress
                progress = statusResponse.completedCount || progress;

                // Get the current template being processed
                const currentTemplate = statusResponse.currentTemplate
                    ? templates.find(t => t.id === statusResponse.currentTemplate)?.name
                    : templates.find(t => t.id === values.templates[0])?.name || "Template";

                // Update generated quizzes if available
                if (statusResponse.generatedQuizzes && statusResponse.generatedQuizzes.length > 0) {
                    // Only add new quizzes
                    const newQuizzes = statusResponse.generatedQuizzes.filter(
                        (newQuiz) => !initialStats.generatedQuizzes.some(existingQuiz =>
                            existingQuiz.id && newQuiz.id && existingQuiz.id === newQuiz.id
                        )
                    );

                    initialStats.generatedQuizzes.push(...newQuizzes);
                }

                // Update UI
                const stage = statusResponse.stage || "generating";
                setGenerationStats(prev => ({
                    ...prev,
                    currentStage: stage,
                    progress,
                    stages: prev.stages.map(stage => {
                        if (stage.id === stage) {
                            return {
                                ...stage,
                                progress,
                                subStages: stage.subStages?.map(subStage => {
                                    if (subStage.id === 'generate-content' || subStage.id === 'process-image') {
                                        return { ...subStage, status: 'in_progress' };
                                    }
                                    return subStage;
                                })
                            };
                        }
                        return stage;
                    })
                }));

                // If we've just completed the image processing stage, wait a moment and fetch one final update
                // to ensure we have the latest image URLs
                if (stage === "processing-images" && statusResponse.completedCount === values.count) {
                    // Wait a bit longer for images to finish processing (multiple checks with increasing delays)
                    console.log('Smart Generator: Starting final image checks...');

                    // Make multiple attempts to get updated image URLs
                    for (let attempt = 1; attempt <= 5; attempt++) {
                        // Increase delay with each attempt
                        const delay = 3000;
                        console.log(`Smart Generator: Waiting ${delay}ms before image check attempt ${attempt}/5`);
                        await new Promise(resolve => setTimeout(resolve, delay));

                        try {
                            console.log(`Smart Generator: Fetching image status attempt ${attempt}/5`);
                            const finalStatus = await fetchApi<BatchStatusResponseType>(`quiz-generation/batch/${batchId}/status`);

                            // Count quizzes with images
                            const quizzesWithImages = finalStatus.generatedQuizzes?.filter(quiz => quiz.imageUrl)?.length || 0;
                            console.log(`Smart Generator: Found ${quizzesWithImages}/${finalStatus.generatedQuizzes?.length || 0} quizzes with images`);

                            if (finalStatus.generatedQuizzes && finalStatus.generatedQuizzes.length > 0) {
                                // Log all image URLs we received
                                finalStatus.generatedQuizzes.forEach((quiz, idx) => {
                                    console.log(`Smart Generator: Quiz ${idx} image URL: ${quiz.imageUrl || 'MISSING'}`);
                                });

                                // Check if we have at least some images
                                if (quizzesWithImages > 0) {
                                    console.log(`Smart Generator: Found ${quizzesWithImages} quizzes with images on attempt ${attempt}`);

                                    // Update our working list with the latest data including images
                                    if (finalStatus.generatedQuizzes) {
                                        // Clear the array and add the new quizzes
                                        initialStats.generatedQuizzes.splice(0, initialStats.generatedQuizzes.length, ...finalStatus.generatedQuizzes);
                                    }

                                    // Update the UI with the latest quiz data including images
                                    setGenerationStats(prev => ({
                                        ...prev,
                                        stages: prev.stages.map(stage => {
                                            if (stage.id === 'processing-images') {
                                                return {
                                                    ...stage,
                                                    progress: 100,
                                                    subStages: stage.subStages?.map(subStage => ({
                                                        ...subStage,
                                                        status: 'completed'
                                                    }))
                                                };
                                            }
                                            return stage;
                                        })
                                    }));
                                }

                                // If all quizzes have images, we can stop polling
                                if (quizzesWithImages === finalStatus.generatedQuizzes.length && quizzesWithImages > 0) {
                                    console.log('Smart Generator: All quizzes have images, stopping checks');
                                    break;
                                }
                            }
                        } catch (error) {
                            console.warn(`Smart Generator: Failed to get image status on attempt ${attempt}/5:`, error);
                        }
                    }

                    console.log('Smart Generator: Completed final image checks');
                }
            }

            // Step 4: Finalize scheduling
            setGenerationStats(prev => ({
                ...prev,
                currentStage: 'scheduling',
                progress: 92,
                stages: prev.stages.map(stage => {
                    if (stage.id === 'scheduling') {
                        return {
                            ...stage,
                            status: 'in_progress',
                            subStages: stage.subStages?.map(subStage => ({
                                ...subStage,
                                status: 'in_progress'
                            }))
                        };
                    }
                    return stage;
                })
            }));

            try {
                await fetchApi(`quiz-generation/batch/${batchId}/finalize`, {
                    method: 'POST'
                });
            } catch (error) {
                console.warn('Smart Generator: Finalize API request failed, retrying:', error);
                // Retry the finalize request
                try {
                    await fetchApi(`quiz-generation/batch/${batchId}/finalize`, {
                        method: 'POST'
                    });
                } catch (finalizeError) {
                    console.error('Smart Generator: Finalize retry also failed:', finalizeError);
                    // Continue anyway since the batch might be finalized on the server side
                }
            }

            // Step 5: Process images if any
            setGenerationStats(prev => ({
                ...prev,
                currentStage: 'processing-images',
                progress: 96,
                stages: prev.stages.map(stage => {
                    if (stage.id === 'processing-images') {
                        return {
                            ...stage,
                            status: 'in_progress',
                            subStages: stage.subStages?.map(subStage => ({
                                ...subStage,
                                status: 'in_progress'
                            }))
                        };
                    }
                    return stage;
                })
            }));

            // Step 6: Complete
            setGenerationStats(prev => ({
                ...prev,
                currentStage: 'complete',
                progress: 100,
                stages: prev.stages.map(stage => {
                    if (stage.id === 'scheduling') {
                        return {
                            ...stage,
                            status: 'completed',
                            subStages: stage.subStages?.map(subStage => ({
                                ...subStage,
                                status: 'completed'
                            }))
                        };
                    }
                    return stage;
                })
            }));

            toast({
                title: "Quiz generation complete!",
                description: `Successfully generated ${values.count} quizzes.`,
                variant: "default",
            });

        } catch (error) {
            console.error("Error during quiz generation:", error);
            setGenerationStats(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "An unknown error occurred",
                stages: prev.stages.map(stage => ({
                    ...stage,
                    status: 'error'
                }))
            }));

            toast({
                title: "Generation Failed",
                description: error instanceof Error ? error.message : "Failed to generate quizzes. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Helper to update generation progress in the UI
    const updateGenerationProgress = (
        stage: "preparing" | "generating" | "scheduling" | "processing-images" | "complete",
        progress: number,
        completed: number,
        total: number,
        currentTemplate: string | undefined,
        generatedQuizzes: Array<{
            title: string;
            type: string;
            scheduledAt: string;
            imageUrl?: string;
        }>
    ) => {
        // Calculate time remaining (rough estimate)
        const timeRemaining = (total - completed) * (stage === "complete" ? 0 : 15);

        setGenerationStats(prev => ({
            ...prev,
            currentStage: stage,
            progress,
            completed,
            total,
            currentTemplate: currentTemplate || "Unknown template",
            timeRemaining,
            generatedQuizzes
        }));
    };

    // Helper to prepare time slot distribution
    const prepareTimeSlotDistribution = (
        timeSlots: { id: string; multiplier: number }[],
        startDate: Date,
        totalQuizzes: number
    ) => {
        // Make sure we have valid data to work with
        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            console.warn('Smart Generator: No time slots provided, using default morning slot');
            // Create a default time slot if none provided
            return [{
                date: format(startDate || new Date(), "yyyy-MM-dd"),
                slotId: "morning",
                weight: 1
            }];
        }

        // Filter out slots with zero multiplier
        const activeTimeSlots = timeSlots.filter(slot => slot.multiplier > 0);

        // If no active slots, use the first one
        if (activeTimeSlots.length === 0) {
            return [{
                date: format(startDate || new Date(), "yyyy-MM-dd"),
                slotId: timeSlots[0].id || "morning",
                weight: 1
            }];
        }

        const totalWeight = activeTimeSlots.reduce((sum, slot) => sum + slot.multiplier, 0);
        const daysRequired = Math.ceil(totalQuizzes / Math.max(1, totalWeight));

        // Create distribution array
        const distribution: Array<{
            date: string;
            slotId: string;
            weight: number;
        }> = [];

        // Ensure valid startDate
        const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime())
            ? startDate
            : new Date();

        // For each day in the range
        for (let day = 0; day < daysRequired; day++) {
            const currentDate = new Date(validStartDate);
            currentDate.setDate(currentDate.getDate() + day);

            // For each selected time slot
            for (const slot of activeTimeSlots) {
                if (slot.multiplier > 0 && slot.id) {
                    distribution.push({
                        date: format(currentDate, "yyyy-MM-dd"),
                        slotId: slot.id,
                        weight: slot.multiplier
                    });
                }
            }
        }

        // Ensure we have at least one entry
        if (distribution.length === 0) {
            distribution.push({
                date: format(validStartDate, "yyyy-MM-dd"),
                slotId: "morning",
                weight: 1
            });
        }

        return distribution;
    };

    // Add helper to prepare distribution from auto-schedule slots
    const prepareAutoScheduleDistribution = (
        autoSlots: AutoScheduleSlot[],
        startDate: Date,
        totalQuizzes: number
    ) => {
        // Filter only active slots
        const activeSlots = autoSlots.filter(slot => slot.isActive);

        // If no active slots, return a default
        if (activeSlots.length === 0) {
            return [{
                date: format(startDate || new Date(), "yyyy-MM-dd"),
                slotId: "morning",
                weight: 1
            }];
        }

        // Calculate how many days we need based on available slots
        const slotsPerDay = activeSlots.length;
        const daysRequired = Math.ceil(totalQuizzes / Math.max(1, slotsPerDay));

        // Create distribution array
        const distribution: Array<{
            date: string;
            slotId: string;
            weight: number;
        }> = [];

        // Ensure valid startDate
        const validStartDate = startDate instanceof Date && !isNaN(startDate.getTime())
            ? startDate
            : new Date();

        // For each day in the range
        for (let day = 0; day < daysRequired; day++) {
            const currentDate = new Date(validStartDate);
            currentDate.setDate(currentDate.getDate() + day);
            const dateStr = format(currentDate, "yyyy-MM-dd");

            // Get day of week for this date (0-6, Sunday-Saturday)
            const dayOfWeek = currentDate.getDay();

            // Find slots for this day of week
            const daySlots = activeSlots.filter(slot => slot.dayOfWeek === dayOfWeek);

            if (daySlots.length > 0) {
                // Add slots for this day
                daySlots.forEach(slot => {
                    distribution.push({
                        date: dateStr,
                        slotId: slot.timeOfDay,
                        weight: 1
                    });
                });
            } else {
                // If no slots for this day, use a default morning slot
                distribution.push({
                    date: dateStr,
                    slotId: "09:00", // Default to 9am
                    weight: 1
                });
            }
        }

        return distribution;
    };

    const handleCancelGeneration = () => {
        setIsGenerating(false);
        setGenerationStats(prev => ({
            ...prev,
            stages: prev.stages.map(stage => ({
                ...stage,
                status: 'error'
            }))
        }));
    };

    const handleRestartGeneration = () => {
        setIsGenerating(false);
        setGenerationStats(prev => ({
            ...prev,
            stages: prev.stages.map(stage => ({
                ...stage,
                status: 'error'
            }))
        }));
        methods.reset();
        setActiveTab("templates");
    };

    // Template selection handler
    const handleTemplateSelect = (id: string, selected: boolean) => {
        const currentTemplates = methods.getValues("templates");

        if (selected) {
            methods.setValue("templates", [...currentTemplates, id]);
        } else {
            methods.setValue(
                "templates",
                currentTemplates.filter(templateId => templateId !== id)
            );
        }

        // Trigger validation after selection change
        methods.trigger("templates");
    };

    // Add the missing handleTimeSlotSelect function
    const handleTimeSlotSelect = useCallback((slotId: string) => {
        const currentTimeSlots = [...selectedTimeSlots];
        const slotIndex = currentTimeSlots.findIndex(slot => slot.id === slotId);

        if (slotIndex !== -1) {
            // Slot exists: increment multiplier, or remove if it's already 5
            const slot = currentTimeSlots[slotIndex];
            if (slot.multiplier >= 5) {
                // Reset to 0 (effectively removing it)
                slot.multiplier = 0;
            } else {
                // Increment multiplier
                slot.multiplier += 1;
            }

            // If slot is now 0, consider removing it
            if (slot.multiplier === 0) {
                currentTimeSlots.splice(slotIndex, 1);
            }
        } else {
            // Slot doesn't exist, add with multiplier 1
            currentTimeSlots.push({ id: slotId, multiplier: 1 });
        }

        setSelectedTimeSlots(currentTimeSlots);

        // Update the form value
        methods.setValue("timeSlots", currentTimeSlots);
        methods.trigger("timeSlots"); // Validate
    }, [selectedTimeSlots, methods]);

    // Move helper functions inside the component to access state

    // Helper function to get days required
    function getDaysRequired() {
        const count = methods.watch("count") || 0;
        const slotsPerDay = schedulingApproach === "manual"
            ? selectedTimeSlots.reduce((sum: number, slot) => sum + slot.multiplier, 0)
            : autoScheduleSlots.filter(s => s.isActive).length;

        if (!count || !slotsPerDay) return "N/A";
        return Math.ceil(count / slotsPerDay);
    }

    // Helper function to get end date
    function getEndDate() {
        const startDate = methods.watch("startDate");
        if (!startDate) return "Unknown";

        const daysRequired = getDaysRequired();
        if (daysRequired === "N/A") return "Unknown";

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Number(daysRequired));
        return format(endDate, "MMM d, yyyy");
    }

    return (
        <div className="space-y-6">
            {/* Enhanced header with grid background */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                <div className="absolute inset-0" style={gridBgStyle}></div>
                <div className="p-6 relative">
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-primary/10 text-primary px-2 py-0.5 text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
                                    </Badge>
                                    {isAuthenticated && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 px-2 py-0.5 text-xs">
                                            <Check className="h-3 w-3 mr-1" /> Pro Feature
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight">Smart Quiz Generator</h1>
                                <p className="text-muted-foreground max-w-[650px]">
                                    Create multiple quizzes at once with smart AI scheduling. Select templates, set a theme, and let the AI create a cohesive series of quizzes optimized for engagement.
                                </p>
                            </div>

                            {!isGenerating && activeTab === "templates" && (
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handleContinue}
                                        disabled={selectedTemplates.length === 0}
                                        className="gap-2"
                                    >
                                        <Zap className="h-4 w-4" />
                                        {templateCount > 0 ? `Continue with ${templateCount} Template${templateCount > 1 ? 's' : ''}` : 'Select Templates'}
                                    </Button>
                                </div>
                            )}

                            {!isGenerating && activeTab !== "templates" && (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveTab("templates")}
                                        className="gap-1.5"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit Selection
                                    </Button>

                                    {activeTab === "schedule" && (
                                        <Button
                                            onClick={handleStartGeneration}
                                            className="gap-2"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Generate Quizzes
                                        </Button>
                                    )}

                                    {activeTab === "configure" && (
                                        <Button
                                            onClick={handleContinue}
                                            className="gap-2"
                                        >
                                            Next: Scheduling
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isGenerating && (
                            <div className="pt-1">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-full max-w-3xl">
                                        <div className="absolute inset-0 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur-xl opacity-50 -z-10" />
                                        <div className="w-full bg-background/80 backdrop-blur-sm rounded-full border p-1">
                                            <div className="grid grid-cols-3 gap-1 relative">
                                                <div
                                                    onClick={() => setActiveTab("templates")}
                                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all
                                                    ${activeTab === "templates"
                                                            ? "bg-primary text-primary-foreground"
                                                            : stepsCompleted.templates
                                                                ? "text-primary bg-primary/10 hover:bg-primary/20"
                                                                : "text-muted-foreground bg-transparent hover:bg-muted/40"
                                                        }`}
                                                >
                                                    <LayoutGrid className="h-3.5 w-3.5" />
                                                    <span>1. Templates</span>
                                                </div>
                                                <div
                                                    onClick={() => stepsCompleted.templates && setActiveTab("configure")}
                                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                                    ${!stepsCompleted.templates ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                                                    ${activeTab === "configure"
                                                            ? "bg-primary text-primary-foreground"
                                                            : stepsCompleted.configure
                                                                ? "text-primary bg-primary/10 hover:bg-primary/20"
                                                                : "text-muted-foreground bg-transparent hover:bg-muted/40"
                                                        }`}
                                                >
                                                    <Settings className="h-3.5 w-3.5" />
                                                    <span>2. Configure</span>
                                                </div>
                                                <div
                                                    onClick={() => stepsCompleted.configure && setActiveTab("schedule")}
                                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                                    ${!stepsCompleted.configure ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                                                    ${activeTab === "schedule"
                                                            ? "bg-primary text-primary-foreground"
                                                            : stepsCompleted.schedule
                                                                ? "text-primary bg-primary/10 hover:bg-primary/20"
                                                                : "text-muted-foreground bg-transparent hover:bg-muted/40"
                                                        }`}
                                                >
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    <span>3. Schedule</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            {!isGenerating && (
                <FormProvider {...methods}>
                    <div className="space-y-8">
                        {/* Templates tab */}
                        {activeTab === "templates" && (
                            <div className="space-y-6">
                                <Card className="border shadow-sm">
                                    <CardHeader className="border-b pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">Select Templates</CardTitle>
                                                <CardDescription>
                                                    Choose one or more templates to generate quizzes from
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`text-sm font-normal ${selectedTemplates.length > 0
                                                    ? "bg-green-500/10 text-green-600 border-green-200"
                                                    : "bg-amber-500/10 text-amber-600 border-amber-200"}`}
                                            >
                                                {selectedTemplates.length > 0
                                                    ? `${selectedTemplates.length} Selected`
                                                    : "None Selected"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {isLoading ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {Array(8).fill(0).map((_, i) => (
                                                        <div key={i} className="flex flex-col rounded-md border overflow-hidden">
                                                            <Skeleton className="h-0 pb-[100%] w-full rounded-none relative" />
                                                            <div className="p-3 space-y-2">
                                                                <Skeleton className="h-4 w-4/5" />
                                                                <Skeleton className="h-3 w-3/5" />
                                                                <div className="flex justify-between items-center mt-2">
                                                                    <Skeleton className="h-3 w-20" />
                                                                    <Skeleton className="h-6 w-6 rounded-full" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {templates.length > 0 ? (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center">
                                                                <h3 className="text-sm font-medium">All Templates</h3>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="ml-2 text-xs font-normal bg-muted/20"
                                                                >
                                                                    {templates.length} template{templates.length !== 1 ? 's' : ''}
                                                                </Badge>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs h-7"
                                                                onClick={() => {
                                                                    // Check if all templates are selected
                                                                    const allSelected = templates.every(template =>
                                                                        selectedTemplates.includes(template.id)
                                                                    );

                                                                    // If all selected, unselect all; otherwise, select all
                                                                    if (allSelected) {
                                                                        methods.setValue("templates", []);
                                                                    } else {
                                                                        methods.setValue(
                                                                            "templates",
                                                                            templates.map(t => t.id)
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                {templates.every(template =>
                                                                    selectedTemplates.includes(template.id)
                                                                )
                                                                    ? "Unselect All"
                                                                    : "Select All"}
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                            {templates.map(template => (
                                                                <div
                                                                    key={template.id}
                                                                    className={`group relative flex flex-col rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${selectedTemplates.includes(template.id)
                                                                        ? "border-primary ring-1 ring-primary"
                                                                        : "hover:border-primary/50"
                                                                        }`}
                                                                    onClick={() => handleTemplateSelect(template.id, !selectedTemplates.includes(template.id))}
                                                                >
                                                                    {/* Template image - square aspect ratio */}
                                                                    <div className="relative pt-[100%] bg-muted/20 overflow-hidden">
                                                                        {template.thumbnailUrl ? (
                                                                            <img
                                                                                src={template.thumbnailUrl}
                                                                                alt={template.name}
                                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-primary/5">
                                                                                <FileText className="h-12 w-12 text-primary/30" />
                                                                            </div>
                                                                        )}

                                                                        {/* Type badge */}
                                                                        <div className="absolute top-2 right-2">
                                                                            <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                                                                                {QUIZ_TYPE_LABELS[template.type]}
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Selection indicator */}
                                                                        <div className="absolute top-2 left-2">
                                                                            <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${selectedTemplates.includes(template.id)
                                                                                ? "bg-primary border-primary text-primary-foreground"
                                                                                : "bg-background border-muted-foreground/30 group-hover:border-primary/50"
                                                                                }`}>
                                                                                {selectedTemplates.includes(template.id) && (
                                                                                    <Check className="h-3 w-3" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Template info */}
                                                                    <div className="p-3 space-y-1">
                                                                        <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>

                                                                        {template.description && (
                                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                {template.description}
                                                                            </p>
                                                                        )}

                                                                        <div className="flex items-center justify-between mt-2 pt-1">
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {template.createdAt instanceof Date
                                                                                    ? format(template.createdAt, 'MMM d, yyyy')
                                                                                    : format(new Date(template.createdAt), 'MMM d, yyyy')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                                        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <FileText className="h-8 w-8 text-primary/70" />
                                                        </div>
                                                        <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                                                        <p className="text-muted-foreground max-w-md mb-6">
                                                            We couldn't find any templates to generate quizzes from. Try creating a template first.
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => router.push('/dashboard/templates/new')}
                                                        >
                                                            Create Template
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {selectedTemplates.length > 0 && (
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleContinue}
                                            className="gap-2"
                                        >
                                            <Zap className="h-4 w-4" />
                                            Continue with {selectedTemplates.length} Template{selectedTemplates.length > 1 ? 's' : ''}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Configure tab */}
                        {activeTab === "configure" && (
                            <div className="space-y-6">
                                <Card className="border shadow-sm">
                                    <CardHeader className="pb-3 border-b">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-xl">Configure Generation</CardTitle>
                                                <CardDescription>
                                                    Customize how your AI-generated quizzes will be created
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left column */}
                                            <div className="space-y-8">
                                                {/* Theme Input */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Theme</Label>
                                                    </div>
                                                    <ThemeInput
                                                        value={methods.watch("theme") || ""}
                                                        onChange={(value) => methods.setValue("theme", value)}
                                                    />
                                                    {methods.formState.errors.theme && (
                                                        <p className="text-destructive text-xs mt-1">
                                                            {methods.formState.errors.theme.message as string}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        A theme helps AI create more cohesive and related quizzes
                                                    </p>
                                                </div>

                                                {/* Number of Quizzes slider */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <LayoutGrid className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Number of Quizzes</Label>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <Slider
                                                                value={[methods.watch("count")]}
                                                                min={1}
                                                                max={20}
                                                                step={1}
                                                                onValueChange={(values) => methods.setValue("count", values[0])}
                                                            />
                                                        </div>
                                                        <div className="w-12 h-9 rounded-md border flex items-center justify-center bg-background">
                                                            <span className="text-sm font-medium">
                                                                {methods.watch("count")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Generate between 1-20 quizzes in a single batch
                                                    </p>
                                                </div>

                                                {/* Language selection */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Language</Label>
                                                    </div>
                                                    <Select
                                                        value={methods.watch("language")}
                                                        onValueChange={(value) => methods.setValue("language", value as Language)}
                                                    >
                                                        <SelectTrigger className="w-full">
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
                                                    <p className="text-xs text-muted-foreground">
                                                        The language that will be used for AI-generated content
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right column */}
                                            <div className="space-y-8">
                                                {/* Difficulty selection */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Brain className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Difficulty</Label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {DIFFICULTY_OPTIONS.map((option) => (
                                                            <div
                                                                key={option.value}
                                                                className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-all
                                                                    ${methods.watch("difficulty") === option.value
                                                                        ? "bg-primary/10 border-primary"
                                                                        : "hover:bg-muted/40 hover:border-primary/30"
                                                                    }`}
                                                                onClick={() => methods.setValue("difficulty", option.value as "easy" | "medium" | "hard" | "progressive")}
                                                            >
                                                                <div className="flex flex-col items-center">
                                                                    <span className="font-medium text-sm">{option.label}</span>
                                                                    {option.value === "progressive" && (
                                                                        <span className="text-xs text-muted-foreground mt-1">
                                                                            Gradually increases
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        How challenging the generated quizzes will be
                                                    </p>
                                                </div>

                                                {/* Variety slider */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Shuffle className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Content Variety</Label>
                                                    </div>
                                                    <div className="pl-2 pt-2">
                                                        <div className="space-y-5">
                                                            <Slider
                                                                value={[methods.watch("variety")]}
                                                                min={0}
                                                                max={100}
                                                                step={10}
                                                                onValueChange={(values) => methods.setValue("variety", values[0])}
                                                            />
                                                            <div className="flex justify-between text-xs text-muted-foreground px-1">
                                                                <span>Focused</span>
                                                                <span>Balanced</span>
                                                                <span>Diverse</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-muted/20 p-3 rounded-md mt-3">
                                                        <p className="text-sm">
                                                            <span className="font-medium">
                                                                {methods.watch("variety") < 30
                                                                    ? "Focused content"
                                                                    : methods.watch("variety") < 70
                                                                        ? "Balanced variety"
                                                                        : "High diversity"
                                                                }
                                                            </span>
                                                            <span className="text-muted-foreground text-xs ml-2">
                                                                ({methods.watch("variety")}%)
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1.5">
                                                            {methods.watch("variety") < 30
                                                                ? "AI will generate closely related content with similar approaches and topics."
                                                                : methods.watch("variety") < 70
                                                                    ? "AI will provide a mix of related and diverse content and approaches."
                                                                    : "AI will maximize variety with diverse approaches, topics, and challenges."
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveTab("templates")}
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Templates
                                    </Button>

                                    <Button
                                        onClick={handleContinue}
                                        className="gap-2"
                                    >
                                        <CalendarIcon className="h-4 w-4" />
                                        Continue to Scheduling
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Schedule tab */}
                        {activeTab === "schedule" && (
                            <div className="space-y-6">
                                <Card className="border shadow-sm">
                                    <CardHeader className="pb-3 border-b">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-xl">Schedule Quizzes</CardTitle>
                                                <CardDescription>
                                                    Set when and how often your quizzes will be published
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left column */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Start Date</Label>
                                                    </div>

                                                    <div className="border rounded-md w-full overflow-hidden bg-card">
                                                        <Calendar
                                                            mode="single"
                                                            selected={methods.watch("startDate")}
                                                            onSelect={(date) => date && methods.setValue("startDate", new Date(date))}
                                                            disabled={(date) => date < new Date()}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Quizzes will be scheduled from this date onward
                                                    </p>
                                                </div>

                                                {/* Scheduling approach selector (moved to left column) */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <RocketIcon className="h-4 w-4 text-primary" />
                                                        <Label className="font-medium">Scheduling Approach</Label>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div
                                                            className={`flex flex-col items-center p-3 rounded-md border cursor-pointer transition-all ${schedulingApproach === "manual"
                                                                ? "bg-primary/10 border-primary"
                                                                : "hover:bg-muted/40 hover:border-primary/30"
                                                                }`}
                                                            onClick={() => setSchedulingApproach("manual")}
                                                        >
                                                            <CalendarRangeIcon className="h-5 w-5 mb-2" />
                                                            <span className="font-medium text-sm">Manual Schedule</span>
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                Define time slots manually
                                                            </span>
                                                        </div>

                                                        <div
                                                            className={`flex flex-col items-center p-3 rounded-md border cursor-pointer transition-all ${schedulingApproach === "auto"
                                                                ? "bg-primary/10 border-primary"
                                                                : "hover:bg-muted/40 hover:border-primary/30"
                                                                }`}
                                                            onClick={() => {
                                                                setSchedulingApproach("auto");
                                                                loadAutoScheduleSettings();
                                                            }}
                                                        >
                                                            <AutomaticIcon className="h-5 w-5 mb-2" />
                                                            <span className="font-medium text-sm">Auto Schedule</span>
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                Use your schedule settings
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {schedulingApproach === "auto" && (
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-muted-foreground">
                                                                {!autoScheduleEnabled
                                                                    ? "Auto-schedule is currently disabled in your settings."
                                                                    : autoScheduleSlots.filter(s => s.isActive).length === 0
                                                                        ? "No active time slots configured yet."
                                                                        : `Using ${autoScheduleSlots.filter(s => s.isActive).length} active time slots.`
                                                                }
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.push('/dashboard/settings/auto-schedule')}
                                                                className="h-7 text-xs"
                                                            >
                                                                Configure
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Schedule summary */}
                                                <div className="mt-6 bg-muted/20 rounded-lg border p-4">
                                                    <h3 className="text-sm font-medium mb-3">Publishing Schedule</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Total quizzes:</span>
                                                            <span className="font-medium">{methods.watch("count")}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Time slots:</span>
                                                            <span className="font-medium">
                                                                {schedulingApproach === "manual"
                                                                    ? methods.watch("timeSlots").length
                                                                    : autoScheduleSlots.filter(s => s.isActive).length}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Start date:</span>
                                                            <span className="font-medium">{format(methods.watch("startDate"), "MMM d, yyyy")}</span>
                                                        </div>
                                                        <div className="border-t my-2"></div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Quizzes per day:</span>
                                                            <span className="font-medium">
                                                                {schedulingApproach === "manual"
                                                                    ? Math.min(
                                                                        methods.watch("timeSlots").reduce((sum: number, slot: any) => sum + slot.multiplier, 0),
                                                                        methods.watch("count")
                                                                    )
                                                                    : autoScheduleSlots.filter(s => s.isActive).length || 0}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Days required:</span>
                                                            <span className="font-medium">{getDaysRequired()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">End date:</span>
                                                            <span className="font-medium">{getEndDate()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right column */}
                                            <div className="space-y-4">
                                                {schedulingApproach === "manual" ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-primary" />
                                                            <Label className="font-medium">Time Slots</Label>
                                                        </div>

                                                        <div className="bg-muted/10 p-3 rounded-md mb-3">
                                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                                Set when your quizzes should be published throughout the day.
                                                                Adjust the frequency to control how many quizzes are published during each time slot.
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {TIME_SLOTS.map((slot) => (
                                                                <div
                                                                    key={slot.id}
                                                                    className={`relative flex items-center border rounded-lg p-3 cursor-pointer transition-all ${selectedTimeSlots.some(s => s.id === slot.id && s.multiplier > 0)
                                                                        ? "border-primary bg-primary/5"
                                                                        : "hover:border-primary/50"
                                                                        }`}
                                                                    onClick={() => handleTimeSlotSelect(slot.id)}
                                                                >
                                                                    <div className="mr-3">
                                                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium text-sm">{slot.label}</h4>
                                                                        <p className="text-xs text-muted-foreground">{slot.description}</p>
                                                                    </div>

                                                                    <div className="absolute right-3">
                                                                        {selectedTimeSlots.some(s => s.id === slot.id && s.multiplier > 0) ? (
                                                                            <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 border-primary/20">
                                                                                {selectedTimeSlots.find(s => s.id === slot.id)?.multiplier || 1}x
                                                                            </Badge>
                                                                        ) : (
                                                                            <div className="h-6 w-6 rounded-full border border-muted-foreground/30"></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {methods.formState.errors.timeSlots && (
                                                            <p className="text-destructive text-xs mt-1">
                                                                {methods.formState.errors.timeSlots.message as string}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Auto scheduling preview
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <AutomaticIcon className="h-4 w-4 text-primary" />
                                                            <Label className="font-medium">Auto Schedule Preview</Label>
                                                        </div>

                                                        {loadingAutoSchedule ? (
                                                            <div className="flex justify-center py-8 border rounded-md">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="animate-spin mb-3">
                                                                        <AutomaticIcon className="h-8 w-8 text-primary/40" />
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">Loading schedule settings...</p>
                                                                </div>
                                                            </div>
                                                        ) : !autoScheduleEnabled ? (
                                                            <div className="flex flex-col items-center py-8 border rounded-md text-center">
                                                                <div className="rounded-full bg-muted p-3 mb-3">
                                                                    <QuestionMarkCircledIcon className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                                <h4 className="text-sm font-medium mb-1">Auto-Schedule is disabled</h4>
                                                                <p className="text-xs text-muted-foreground mb-3 max-w-md">
                                                                    Enable auto-scheduling in your settings to use this feature.
                                                                </p>
                                                            </div>
                                                        ) : autoScheduleSlots.filter(s => s.isActive).length === 0 ? (
                                                            <div className="flex flex-col items-center py-8 border rounded-md text-center">
                                                                <div className="rounded-full bg-muted p-3 mb-3">
                                                                    <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                                <h4 className="text-sm font-medium mb-1">No active time slots</h4>
                                                                <p className="text-xs text-muted-foreground mb-3 max-w-md">
                                                                    Configure and activate time slots in your auto-schedule settings.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="border rounded-lg p-3 bg-muted/10">
                                                                    <div className="grid grid-cols-7 gap-1.5 text-center mb-4">
                                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                                                            <div key={i} className="text-xs font-medium py-1 rounded bg-muted/30">
                                                                                {day}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="grid grid-cols-7 gap-1.5">
                                                                        {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                                                                            const daySlots = autoScheduleSlots.filter(
                                                                                slot => slot.dayOfWeek === dayOfWeek && slot.isActive
                                                                            );
                                                                            return (
                                                                                <div key={dayOfWeek} className="flex flex-col gap-1 min-h-14">
                                                                                    {daySlots.map(slot => (
                                                                                        <div key={slot.id} className="text-xs rounded bg-primary/10 border-primary/20 border px-2 py-1 text-center">
                                                                                            {slot.timeOfDay}
                                                                                        </div>
                                                                                    ))}
                                                                                    {daySlots.length === 0 && (
                                                                                        <div className="text-xs text-muted-foreground h-full flex items-center justify-center rounded border border-dashed border-muted-foreground/20 py-1">
                                                                                            -
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="mt-3">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-sm text-muted-foreground">Distribution:</span>
                                                                <span className="text-xs font-medium bg-muted/30 px-2 py-0.5 rounded">
                                                                    {autoScheduleSlots.filter(s => s.isActive).length} active time slots
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveTab("configure")}
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Configuration
                                    </Button>

                                    <Button
                                        onClick={handleStartGeneration}
                                        disabled={!isValid}
                                        className="gap-2"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Generate {methods.watch("count")} Quizzes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </FormProvider>
            )}

            {/* Show generation progress when generating */}
            {isGenerating && (
                <div className="mt-6">
                    <GenerationProgress
                        progress={generationStats.progress}
                        currentStage={generationStats.currentStage}
                        stages={generationStats.stages}
                        error={generationStats.error}
                        estimatedTimeRemaining={generationStats.estimatedTimeRemaining}
                        generatedQuizzes={generationStats.generatedQuizzes}
                    />
                </div>
            )}

            {/* Quiz preview modal */}
            <QuizPreview
                open={showQuizPreview}
                onOpenChange={setShowQuizPreview}
                quiz={selectedQuizPreview}
            />
        </div>
    );
}

// Replace the GenerationProgress component with an enhanced version
export const GenerationProgress = ({
    progress,
    currentStage,
    stages,
    error,
    estimatedTimeRemaining,
    generatedQuizzes
}: {
    progress: number;
    currentStage: "preparing" | "generating" | "scheduling" | "processing-images" | "complete";
    stages: GenerationStats['stages'];
    error?: string;
    estimatedTimeRemaining?: number;
    generatedQuizzes: GenerationStats['generatedQuizzes'];
}) => {
    // Animation for progress bar
    const progressAnimation = useSpring({
        width: `${progress}%`,
        from: { width: '0%' },
        config: { tension: 120, friction: 14 }
    });

    // Effect to trigger confetti when complete
    useEffect(() => {
        if (currentStage === "complete") {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const colors = ['#ffa500', '#4CAF50', '#2196F3', '#FF5722'];
            let animationFrameId: number;

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            };

            (function frame() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) return;

                confetti({
                    particleCount: 2,
                    angle: randomInRange(55, 125),
                    spread: randomInRange(50, 70),
                    origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.5) },
                    colors: [colors[Math.floor(Math.random() * colors.length)]],
                    zIndex: 9999,
                });

                animationFrameId = requestAnimationFrame(frame);
            }());

            // Clean up animation
            return () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            };
        }
    }, [currentStage]);

    // Stage icons with animations
    const getStageIcon = (stage: GenerationStats['stages'][0]) => {
        const size = 36;

        switch (stage.id) {
            case 'preparing':
                return stage.status === 'in_progress' ? (
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-blue-500"
                    >
                        <PencilRuler size={size} />
                    </motion.div>
                ) : stage.status === 'completed' ? (
                    <div className="text-green-500">
                        <PencilRuler size={size} />
                    </div>
                ) : stage.status === 'error' ? (
                    <div className="text-red-500">
                        <AlertCircle size={size} />
                    </div>
                ) : (
                    <div className="text-gray-300">
                        <PencilRuler size={size} />
                    </div>
                );
            case 'generating':
                return stage.status === 'in_progress' ? (
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="text-purple-500"
                    >
                        <Brain size={size} />
                    </motion.div>
                ) : stage.status === 'completed' ? (
                    <div className="text-green-500">
                        <Brain size={size} />
                    </div>
                ) : stage.status === 'error' ? (
                    <div className="text-red-500">
                        <AlertCircle size={size} />
                    </div>
                ) : (
                    <div className="text-gray-300">
                        <Brain size={size} />
                    </div>
                );
            case 'processing-images':
                return stage.status === 'in_progress' ? (
                    <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-amber-500"
                    >
                        <Palette size={size} />
                    </motion.div>
                ) : stage.status === 'completed' ? (
                    <div className="text-green-500">
                        <Palette size={size} />
                    </div>
                ) : stage.status === 'error' ? (
                    <div className="text-red-500">
                        <AlertCircle size={size} />
                    </div>
                ) : (
                    <div className="text-gray-300">
                        <Palette size={size} />
                    </div>
                );
            case 'scheduling':
                return stage.status === 'in_progress' ? (
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-cyan-500"
                    >
                        <Calendar size={size} />
                    </motion.div>
                ) : stage.status === 'completed' ? (
                    <div className="text-green-500">
                        <Calendar size={size} />
                    </div>
                ) : stage.status === 'error' ? (
                    <div className="text-red-500">
                        <AlertCircle size={size} />
                    </div>
                ) : (
                    <div className="text-gray-300">
                        <Calendar size={size} />
                    </div>
                );
            default:
                return stage.status === 'in_progress' ? (
                    <Loader2 size={size} className="animate-spin text-primary" />
                ) : stage.status === 'completed' ? (
                    <CheckCircle2 size={size} className="text-green-500" />
                ) : stage.status === 'error' ? (
                    <AlertCircle size={size} className="text-red-500" />
                ) : (
                    <Circle size={size} className="text-gray-300" />
                );
        }
    };

    // Format time remaining in a user-friendly way
    const formatTimeRemaining = (seconds?: number) => {
        if (!seconds) return "Calculating...";
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes} min${minutes !== 1 ? 's' : ''} ${remainingSeconds} sec${remainingSeconds !== 1 ? 's' : ''}`;
    };

    // Get the current stage info for detailed display
    const stagesInfo = stages.find(stage => stage.id === currentStage);

    // Calculate number of processed images for the preview grid
    const imagesProcessed = generatedQuizzes?.filter(quiz => quiz.status === 'completed').length || 0;

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {currentStage === "complete" ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <RocketIcon className="h-5 w-5 text-green-500" />
                            </motion.div>
                        ) : (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            >
                                <Dices className="h-5 w-5 text-primary" />
                            </motion.div>
                        )}
                        <CardTitle className="text-xl">
                            {currentStage === "complete" ? "Generation Complete!" : "Generating Your Quizzes"}
                        </CardTitle>
                    </div>
                    <div className="text-sm font-medium">
                        {currentStage !== "complete" && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatTimeRemaining(estimatedTimeRemaining)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 pb-6">
                <div className="space-y-6">
                    {currentStage !== "complete" ? (
                        <>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <div>
                                        <span className="text-2xl font-bold">{Math.round(progress)}%</span>
                                        <span className="text-muted-foreground text-sm ml-1">Complete</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {imagesProcessed} of {generatedQuizzes?.length || 0} quizzes
                                    </div>
                                </div>

                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <animated.div
                                        className="h-full bg-gradient-to-r from-blue-500 via-primary to-indigo-500 rounded-full"
                                        style={progressAnimation}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 border border-destructive/20 bg-destructive/10 text-destructive rounded-md mt-3 flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Error encountered</p>
                                            <p className="text-sm opacity-90">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {stages.map((stage, idx) => (
                                        <motion.div
                                            key={stage.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`flex flex-col items-center p-4 rounded-lg border ${stage.status === 'in_progress'
                                                ? 'bg-primary/5 border-primary/20'
                                                : stage.status === 'completed'
                                                    ? 'bg-green-500/5 border-green-500/20'
                                                    : stage.status === 'error'
                                                        ? 'bg-red-500/5 border-red-500/20'
                                                        : 'bg-muted/10 border-border'
                                                }`}
                                        >
                                            <div className="mb-3">
                                                {getStageIcon(stage)}
                                            </div>
                                            <h3 className="text-center font-medium text-sm mb-1">{stage.name}</h3>
                                            <p className="text-xs text-muted-foreground text-center mb-3">{stage.description}</p>

                                            {stage.status === 'in_progress' && (
                                                <div className="w-full">
                                                    <div className="h-1 bg-muted rounded-full overflow-hidden mb-1">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                                            style={{ width: `${stage.progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-center text-muted-foreground">
                                                        {stage.progress}%
                                                    </div>
                                                </div>
                                            )}

                                            {stage.status === 'completed' && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                    className="bg-green-500 text-white p-1 rounded-full"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </motion.div>
                                            )}

                                            {stage.status === 'error' && (
                                                <div className="bg-red-500 text-white p-1 rounded-full">
                                                    <AlertCircle className="h-4 w-4" />
                                                </div>
                                            )}

                                            {stage.status === 'pending' && (
                                                <div className="bg-muted text-muted-foreground p-1 rounded-full">
                                                    <Circle className="h-4 w-4" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Sub-Stage Animation */}
                            {stagesInfo?.subStages && stagesInfo.subStages.length > 0 && (
                                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/5">
                                    <h3 className="text-sm font-medium flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Current Activities
                                    </h3>

                                    <div className="space-y-3">
                                        {stagesInfo.subStages.map((subStage, idx) => (
                                            <motion.div
                                                key={subStage.id}
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`flex items-center gap-3 p-3 rounded-md ${subStage.status === 'in_progress'
                                                    ? 'bg-primary/10'
                                                    : subStage.status === 'completed'
                                                        ? 'bg-green-500/10'
                                                        : 'bg-muted/10'
                                                    }`}
                                            >
                                                {subStage.status === 'in_progress' ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                        className="w-6 h-6 flex items-center justify-center"
                                                    >
                                                        <Loader2 className="h-5 w-5 text-primary" />
                                                    </motion.div>
                                                ) : subStage.status === 'completed' ? (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-6 h-6 flex items-center justify-center"
                                                    >
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    </motion.div>
                                                ) : (
                                                    <div className="w-6 h-6 flex items-center justify-center">
                                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}

                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{subStage.name}</p>
                                                </div>

                                                {subStage.status === 'in_progress' && (
                                                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                                        <Sparkles className="h-3 w-3" />
                                                        <span>In progress</span>
                                                    </div>
                                                )}

                                                {subStage.status === 'completed' && (
                                                    <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        <span>Completed</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Generated Quizzes Grid */}
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FileImage className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-medium">Generated Quizzes</h3>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-normal bg-muted/20">
                                        {generatedQuizzes.filter(q => (q.status || 'pending') === 'completed').length} of {generatedQuizzes.length}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {generatedQuizzes.map((quiz, idx) => (
                                        <motion.div
                                            key={quiz.id || idx}
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="rounded-lg border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all"
                                        >
                                            <div className="relative aspect-square w-full bg-muted">
                                                {(quiz.status || 'pending') === 'completed' && quiz.imageUrl ? (
                                                    <img
                                                        src={quiz.imageUrl}
                                                        alt={quiz.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (quiz.status || 'pending') === 'processing' ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/5">
                                                        <motion.div
                                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                        >
                                                            <ImageIcon className="h-8 w-8 text-primary/30 mb-2" />
                                                        </motion.div>
                                                        <span className="text-xs text-muted-foreground">Processing image...</span>
                                                    </div>
                                                ) : (quiz.status || 'pending') === 'generating' ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/5">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                        >
                                                            <Brain className="h-8 w-8 text-primary/30 mb-2" />
                                                        </motion.div>
                                                        <span className="text-xs text-muted-foreground">Generating content...</span>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <FileText className="h-10 w-10 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs px-2 py-0.5 ${(quiz.status || 'pending') === 'completed'
                                                            ? 'bg-green-500/10 text-green-500 border-green-200'
                                                            : (quiz.status || 'pending') === 'error'
                                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                                : 'bg-primary/10 text-primary border-primary/20'
                                                            }`}
                                                    >
                                                        {(quiz.status || 'pending').charAt(0).toUpperCase() + (quiz.status || 'pending').slice(1)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-sm font-medium line-clamp-1" title={quiz.title}>
                                                    {quiz.title}
                                                </h4>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {quiz.scheduledAt ? format(new Date(quiz.scheduledAt), "MMM d, h:mm a") : "Not scheduled"}
                                                    </span>
                                                </div>
                                                {(quiz.status || 'pending') !== 'completed' && (
                                                    <div className="mt-2">
                                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-primary rounded-full"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${quiz.progress}%` }}
                                                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground mt-1 block">
                                                            {quiz.progress}% complete
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="py-6 flex flex-col items-center justify-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="mb-6"
                                >
                                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                                        <Stars className="h-12 w-12 text-green-600" />
                                    </div>
                                </motion.div>

                                <h2 className="text-2xl font-bold text-center mb-2">All Quizzes Generated!</h2>
                                <p className="text-muted-foreground text-center max-w-md mx-auto mb-6">
                                    Your {generatedQuizzes.length} quizzes have been generated and scheduled successfully.
                                </p>
                            </div>

                            {/* Final Generated Quizzes Grid */}
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <FileImage className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-medium">Generated Quizzes</h3>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-normal bg-muted/20">
                                        {generatedQuizzes.length} quizzes
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {generatedQuizzes.map((quiz, idx) => (
                                        <motion.div
                                            key={quiz.id || idx}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="rounded-lg border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all"
                                        >
                                            <div className="relative aspect-square w-full bg-muted">
                                                {quiz.imageUrl ? (
                                                    <img
                                                        src={quiz.imageUrl}
                                                        alt={quiz.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <FileText className="h-10 w-10 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 border-green-200"
                                                    >
                                                        Completed
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-sm font-medium line-clamp-1" title={quiz.title}>
                                                    {quiz.title}
                                                </h4>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(quiz.scheduledAt), "MMM d, h:mm a")}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between gap-3 pt-4">
                                <div>
                                    <Button variant="outline" onClick={() => window.location.reload()}>
                                        Generate More
                                    </Button>
                                </div>
                                <div>
                                    <Button asChild>
                                        <Link href="/dashboard/scheduled">View Scheduled Quizzes</Link>
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}; 