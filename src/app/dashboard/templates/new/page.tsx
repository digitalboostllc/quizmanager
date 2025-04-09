'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    Crown,
    FileCode,
    FileType,
    Globe,
    Home,
    ImageIcon,
    Layers3,
    Loader2,
    Lock,
    Palette,
    Save,
    Settings,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// CSS for grid background pattern
const gridBgStyle = {
    backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
    backgroundSize: '20px 20px',
};

// Quiz type details
const QUIZ_TYPES = [
    {
        id: 'WORDLE',
        name: 'Wordle',
        color: 'bg-muted/60 text-foreground border-border',
    },
    {
        id: 'NUMBER_SEQUENCE',
        name: 'Number Sequence',
        color: 'bg-blue-500/10 text-blue-500 border-blue-200',
    },
    {
        id: 'RHYME_TIME',
        name: 'Rhyme Time',
        color: 'bg-purple-500/10 text-purple-500 border-purple-200',
    },
    {
        id: 'CONCEPT_CONNECTION',
        name: 'Concept Connection',
        color: 'bg-amber-500/10 text-amber-500 border-amber-200',
    }
];

// Sample subscription plans
const SUBSCRIPTION_PLANS = [
    { id: 'FREE', name: 'Free', description: 'Basic templates' },
    { id: 'BASIC', name: 'Basic', description: 'Standard templates' },
    { id: 'PRO', name: 'Pro', description: 'Premium templates' }
];

// Define the template variables type to use consistently with Input component requirements
type TemplateVariableValue = string | number | string[];

// After the imports section, add a new constant for default AI-generated prompt examples
const AI_PROMPT_EXAMPLES = [
    "Create a clean modern Wordle template with rounded boxes and a subtle gradient background",
    "Design a Number Sequence puzzle with a dark theme and glowing neon elements",
    "Make a Rhyme Time quiz template with playful typography and pastel colors",
    "Generate a Concept Connection template with a minimalist design and monochrome color scheme"
];

// Add type definition for Template at the top of the file after imports
type Template = {
    id: string;
    name: string;
    description: string;
    html: string;
    css: string;
    variables: Record<string, unknown>;
    quizType: string;
    isPublic?: boolean;
};

const createTemplateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    html: z.string().min(1, "HTML template is required"),
    css: z.string().optional(),
    variables: z.record(z.union([z.string(), z.number()])),
    quizType: z.string().min(1, "Quiz type is required"),
    description: z.string().optional(),
    isPublic: z.boolean().default(false),
    planId: z.string().optional(),
});

type CreateTemplateForm = z.infer<typeof createTemplateSchema>;

// Define the template response type for better type checking
interface TemplateResponse {
    id?: string;
    name: string;
    description: string;
    html: string;
    css: string;
    variables: Record<string, any>;
    quizType: string;
}

// Update the AI template generation function with proper TypeScript types
async function generateTemplateWithAI(prompt: string, quizType: string): Promise<TemplateResponse> {
    try {
        const response = await fetch('/api/templates/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, quizType }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to generate template");
    }
}

export default function NewTemplatePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const previewWrapperRef = useRef<HTMLDivElement>(null);
    const previewIframeRef = useRef<HTMLIFrameElement>(null);
    const [activeTab, setActiveTab] = useState("details");
    const [previewScale, setPreviewScale] = useState(1);

    // State for AI generation
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedAiQuizType, setSelectedAiQuizType] = useState(QUIZ_TYPES[0].id);

    // Default HTML template
    const defaultHtml = `<div class="quiz-container">
  <h1>{{title}}</h1>
  <h2>{{subtitle}}</h2>
  <div class="content">
    {{content}}
  </div>
  <div class="hint">
    <p>{{hint}}</p>
  </div>
</div>`;

    // Default CSS template
    const defaultCss = `/* Quiz Container */
.quiz-container {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

h2 {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.content {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.5;
}

.hint {
  font-style: italic;
  color: #777;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}`;

    // Default variables
    const defaultVariables = {
        title: "Quiz Title",
        subtitle: "Quiz Subtitle",
        content: "Your main quiz content goes here.",
        hint: "Optional hint for the quiz taker."
    };

    const form = useForm<CreateTemplateForm>({
        resolver: zodResolver(createTemplateSchema),
        defaultValues: {
            name: '',
            html: defaultHtml,
            css: defaultCss,
            variables: defaultVariables,
            quizType: 'CONCEPT_CONNECTION',
            description: '',
            isPublic: false,
            planId: 'FREE',
        },
    });

    const watchedName = form.watch("name");
    const watchedDescription = form.watch("description");
    const watchedQuizType = form.watch("quizType");
    const watchedIsPublic = form.watch("isPublic");
    const watchedHtml = form.watch("html");
    const watchedCss = form.watch("css");
    const watchedVariables = form.watch("variables");

    // Get the details of the selected quiz type
    const quizTypeDetails = QUIZ_TYPES.find(type => type.id === watchedQuizType) || QUIZ_TYPES[0];

    // Handle form submission
    const onSubmit = async (data: CreateTemplateForm) => {
        try {
            setIsSubmitting(true);
            const response = await fetchApi('/api/templates', {
                method: 'POST',
                body: data
            });

            toast({
                title: "Success!",
                description: "Template created successfully.",
            });

            // Redirect to the template detail page
            router.push(`/dashboard/templates/${response.id}`);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create template",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updatePreview = useCallback(() => {
        // Get values from form
        const html = watchedHtml || defaultHtml;
        const css = watchedCss || defaultCss;
        const variables = watchedVariables || defaultVariables;

        if (!html) return;

        try {
            // Replace variables in template
            let processedHtml = html;
            Object.entries(variables).forEach(([key, value]) => {
                processedHtml = processedHtml.replace(
                    new RegExp(`{{${key}}}`, "g"),
                    String(value || '')
                );
            });

            // Create a complete HTML document with proper structure - using fixed dimensions
            const fullHtml = `
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
                  /* Template CSS */
                  ${css || ''}
                </style>
              </head>
              <body>
                ${processedHtml}
              </body>
            </html>`;

            setPreviewHtml(fullHtml);
        } catch (error) {
            console.error('Error updating preview:', error);
        }
    }, [watchedHtml, watchedCss, watchedVariables, defaultHtml, defaultCss, defaultVariables]);

    // Update preview when form changes
    useEffect(() => {
        updatePreview();
    }, [updatePreview]);

    // Handle preview scaling
    useEffect(() => {
        const updateScale = () => {
            if (!previewWrapperRef.current) return;

            const wrapperWidth = previewWrapperRef.current.clientWidth;
            // Target dimensions are 1080x1080
            const scale = Math.min(1, wrapperWidth / 1080);
            setPreviewScale(scale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);

        return () => {
            window.removeEventListener('resize', updateScale);
        };
    }, []);

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
                    <Link href="/dashboard/templates" className="hover:text-foreground transition-colors">
                        Templates
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">New Template</span>
                </nav>

                {/* Header with background */}
                <div className="relative rounded-xl overflow-hidden mb-6 bg-primary/5 border">
                    <div className="absolute inset-0" style={gridBgStyle}></div>
                    <div className="p-6 relative">
                        <div className="flex flex-col space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold flex items-center">
                                            <Layers3 className="mr-2 h-5 w-5 text-primary" />
                                            Create Template
                                        </h1>
                                    </div>
                                    <p className="text-muted-foreground mt-1">
                                        Design a reusable template for your quizzes
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => form.reset()}
                                        disabled={isSubmitting}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Template
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
                {/* AI Template Generator */}
                <div className="col-span-12 mb-6">
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="relative">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)',
                                backgroundSize: '20px 20px',
                                opacity: 0.5
                            }}></div>
                            <CardHeader className="pb-3 border-b relative bg-primary/5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl flex items-center">
                                        <Sparkles className="h-5 w-5 mr-2 text-primary" />
                                        AI Template Generator
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        Beta
                                    </Badge>
                                </div>
                            </CardHeader>
                        </div>
                        <CardContent className="pt-5 relative">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-9">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-base font-medium">Describe your template</label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Tell the AI what kind of template you want to create. Be specific about styles, colors, and layout.
                                            </p>
                                            <Textarea
                                                className="mt-1.5 font-normal"
                                                placeholder="E.g. Create a modern Wordle template with rounded boxes and a subtle gradient background"
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {AI_PROMPT_EXAMPLES.map((example, index) => (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-muted/20 hover:bg-muted/30 text-xs"
                                                    onClick={() => setAiPrompt(example)}
                                                >
                                                    {example.length > 40 ? example.substring(0, 40) + '...' : example}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">Quiz Type</label>
                                        <Select
                                            value={selectedAiQuizType}
                                            onValueChange={setSelectedAiQuizType}
                                        >
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder="Select quiz type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {QUIZ_TYPES.map((type) => (
                                                    <SelectItem key={type.id} value={type.id} className="flex items-center">
                                                        <div className="flex items-center">
                                                            <div className={`h-2 w-2 rounded-full mr-2 ${type.color.includes('bg-') ? type.color : 'bg-primary'}`}></div>
                                                            {type.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex justify-center pt-4">
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                if (!aiPrompt) {
                                                    toast({
                                                        title: "Error",
                                                        description: "Please enter a prompt for the AI to generate a template",
                                                        variant: "destructive",
                                                    });
                                                    return;
                                                }

                                                setIsGenerating(true);

                                                fetch('/api/templates/generate', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        prompt: aiPrompt,
                                                        quizType: selectedAiQuizType
                                                    }),
                                                })
                                                    .then((response: Response) => {
                                                        if (!response.ok) {
                                                            throw new Error(`API request failed with status: ${response.status}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then((data: Template) => {
                                                        // Populate the form with the generated template data
                                                        form.setValue("name", data.name || "");
                                                        form.setValue("description", data.description || "");
                                                        form.setValue("html", data.html || defaultHtml);
                                                        form.setValue("css", data.css || defaultCss);

                                                        // Process variables to ensure compatibility with form inputs
                                                        if (data.variables && typeof data.variables === 'object') {
                                                            const processedVars: Record<string, string | number> = {};

                                                            Object.entries(data.variables).forEach(([key, val]) => {
                                                                // Convert all values to string or number for Input compatibility
                                                                if (typeof val === 'string' || typeof val === 'number') {
                                                                    processedVars[key] = val;
                                                                } else {
                                                                    processedVars[key] = JSON.stringify(val);
                                                                }
                                                            });

                                                            form.setValue("variables", processedVars);
                                                        }

                                                        if (data.quizType) {
                                                            form.setValue("quizType", data.quizType);
                                                        }

                                                        // Update preview
                                                        updatePreview();

                                                        // Move to the details tab
                                                        setActiveTab("details");

                                                        toast({
                                                            title: "Success!",
                                                            description: "Template generated successfully. Customize it further if needed.",
                                                        });
                                                    })
                                                    .catch(error => {
                                                        toast({
                                                            variant: "destructive",
                                                            title: "Generation Error",
                                                            description: error instanceof Error ? error.message : "Failed to generate template",
                                                        });
                                                    })
                                                    .finally(() => {
                                                        setIsGenerating(false);
                                                    });
                                            }}
                                            disabled={isGenerating || !aiPrompt}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate Template
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {isGenerating && (
                                <div className="mt-6 bg-background/80 border rounded-lg p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="relative h-10 w-10 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-40"></div>
                                            <Loader2 className="h-5 w-5 animate-spin text-primary relative" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Creating your template... This may take a few moments
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Template editor - 8 columns on large screens */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                                <Card className="border shadow-sm">
                                    <CardHeader className="pb-3 border-b bg-muted/20">
                                        <div className="flex flex-col space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileType className="h-4 w-4" />
                                                    <span>New Template</span>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={quizTypeDetails?.color || "bg-gray-500/10 text-gray-500 border-gray-200"}
                                                >
                                                    {quizTypeDetails?.name || watchedQuizType}
                                                </Badge>
                                            </div>

                                            <TabsList className="grid grid-cols-3 h-9">
                                                <TabsTrigger value="details" className="text-xs">
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Details
                                                </TabsTrigger>
                                                <TabsTrigger value="code" className="text-xs">
                                                    <FileCode className="w-4 h-4 mr-2" />
                                                    Code
                                                </TabsTrigger>
                                                <TabsTrigger value="variables" className="text-xs">
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Variables
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6">
                                        <TabsContent value="details" className="m-0 p-0 space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Template Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Enter template name" {...field} />
                                                            </FormControl>
                                                            <FormDescription>
                                                                A descriptive name for your template
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="quizType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Quiz Type</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select a quiz type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {QUIZ_TYPES.map(type => (
                                                                        <SelectItem key={type.id} value={type.id}>
                                                                            {type.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription>
                                                                The type of quiz this template is for
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Describe your template"
                                                                className="min-h-[120px]"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Explain the purpose and features of your template
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="isPublic"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between border rounded-md p-4 bg-muted/20">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-medium">Make Public</h4>
                                                                {field.value && (
                                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                                                                        Public
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Allow other users to use this template
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {field.value ? (
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                                                                    <Globe className="h-3 w-3 mr-1" />
                                                                    Public
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-200">
                                                                    <Lock className="h-3 w-3 mr-1" />
                                                                    Private
                                                                </Badge>
                                                            )}
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />

                                            {watchedIsPublic && (
                                                <div className="space-y-2">
                                                    <FormLabel htmlFor="planId" className="text-base font-medium">Required Subscription Plan</FormLabel>
                                                    <Select
                                                        value={form.getValues("planId") || 'FREE'}
                                                        onValueChange={(value) => form.setValue("planId", value)}
                                                    >
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Select required plan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SUBSCRIPTION_PLANS.map(plan => (
                                                                <SelectItem key={plan.id} value={plan.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        {plan.id !== 'FREE' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                                                                        {plan.name}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-sm text-muted-foreground">
                                                        Users need this subscription level or higher to access this template
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-between pt-4">
                                                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/templates')}>
                                                    Cancel
                                                </Button>
                                                <Button type="button" onClick={() => setActiveTab('code')}>
                                                    Continue to Code
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="code" className="m-0 p-0 space-y-6">
                                            <div className="bg-primary/5 border border-primary/20 text-foreground rounded-md p-4 flex gap-3 mb-4">
                                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                                <div className="text-sm">
                                                    <p className="font-medium mb-1">Using Placeholders</p>
                                                    <p>Use <code className="bg-background/80 border border-primary/10 px-1 rounded">{'{{variableName}}'}</code> as a placeholder for template variables.</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-medium text-base flex items-center gap-2 mb-2">
                                                    <FileCode className="h-5 w-5 text-primary" />
                                                    HTML Template
                                                </h3>
                                                <FormField
                                                    control={form.control}
                                                    name="html"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Enter HTML template code"
                                                                    className="font-mono min-h-[250px]"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        updatePreview();
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <h3 className="font-medium text-base flex items-center gap-2 mb-2">
                                                    <Palette className="h-5 w-5 text-primary" />
                                                    CSS Styles
                                                </h3>
                                                <FormField
                                                    control={form.control}
                                                    name="css"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Enter CSS styles"
                                                                    className="font-mono min-h-[250px]"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        updatePreview();
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Style your template with CSS. These styles will be applied to the HTML template.
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="flex justify-between pt-4 border-t mt-6">
                                                <Button type="button" variant="outline" onClick={() => setActiveTab('details')}>
                                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                                    Back to Details
                                                </Button>
                                                <Button type="button" onClick={() => setActiveTab('variables')}>
                                                    Continue to Variables
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="variables" className="m-0 p-0 space-y-6">
                                            <div className="bg-primary/5 border border-primary/20 text-foreground rounded-md p-4 flex gap-3 mb-4">
                                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                                                <div className="text-sm">
                                                    <p className="font-medium mb-1">Template Variables</p>
                                                    <p>Define variables that will replace <code className="bg-background/80 border border-primary/10 px-1 rounded">{'{{variableName}}'}</code> placeholders in your HTML.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(form.getValues().variables || {}).map(([key]) => (
                                                    <div key={key} className="col-span-2 md:col-span-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`variables.${key}`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="capitalize">{key}</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field}
                                                                            onChange={(e) => {
                                                                                field.onChange(e);
                                                                                updatePreview();
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        Sample value for <code>{`{{${key}}}`}</code>
                                                                    </FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <p>Define variables for your template</p>
                                                <p>{Object.keys(form.getValues("variables") || {}).length} variables defined</p>
                                            </div>

                                            <div className="flex flex-col space-y-2 mt-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-medium">Add New Variable</h4>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newVarName = prompt('Enter new variable name:');
                                                                        if (newVarName && newVarName.trim()) {
                                                                            const currentVars = form.getValues().variables || {};
                                                                            form.setValue('variables', {
                                                                                ...currentVars,
                                                                                [newVarName]: ''
                                                                            });
                                                                            updatePreview();
                                                                        }
                                                                    }}
                                                                >
                                                                    Add Variable
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Add a new template variable</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>

                                            <div className="flex justify-between pt-4 border-t mt-6">
                                                <Button type="button" variant="outline" onClick={() => setActiveTab('code')}>
                                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                                    Back to Code
                                                </Button>
                                                <Button type="submit" disabled={isSubmitting}>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    {isSubmitting ? "Saving..." : "Save Template"}
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    </CardContent>
                                </Card>
                            </Tabs>
                        </form>
                    </Form>
                </div>

                {/* Preview panel - 4 columns on large screens */}
                <div className="col-span-12 lg:col-span-4">
                    <Card className="sticky top-20 border shadow-sm">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                    Live Preview
                                </CardTitle>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
                                    Preview
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div ref={previewWrapperRef} className="w-full max-w-xl aspect-square bg-white rounded-lg border shadow-sm overflow-hidden relative">
                                <iframe
                                    ref={previewIframeRef}
                                    srcDoc={previewHtml}
                                    title="Template Preview"
                                    style={{
                                        width: '1080px',
                                        height: '1080px',
                                        border: 'none',
                                        transform: `scale(${previewScale})`,
                                        transformOrigin: '0 0',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0
                                    }}
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            </div>

                            {/* Template info */}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <Badge
                                        variant="outline"
                                        className={quizTypeDetails?.color || "bg-gray-500/10 text-gray-500 border-gray-200"}
                                    >
                                        {quizTypeDetails?.name}
                                    </Badge>

                                    {watchedIsPublic ? (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                                            <Globe className="h-3 w-3 mr-1" />
                                            Public
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-200">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Private
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="font-medium">
                                    {watchedName || "New Template"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {watchedDescription || "No description provided."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}