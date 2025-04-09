"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { generateImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import type { Template } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Calendar,
    ChevronRight,
    Clock,
    Crown,
    FileCode,
    FileType,
    Globe,
    Home,
    ImageIcon,
    ImagePlus,
    Info,
    Layers3,
    Loader2,
    Lock,
    Palette,
    RefreshCw,
    Save,
    Settings,
    Sparkles,
    Trash,
    Variable
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const editTemplateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    html: z.string().min(1, "HTML template is required"),
    css: z.string().optional(),
    variables: z.record(z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.record(z.unknown())
    ])),
    quizType: z.string().optional(),
    description: z.string().optional(),
    isPublic: z.boolean().default(false),
    subscriptionPlan: z.string().optional(),
});

type EditTemplateForm = z.infer<typeof editTemplateSchema>;

// Client component that receives the ID directly
function TemplateDetailClient({ templateId }: { templateId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const { updateTemplate } = useStore();
    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("details");

    const form = useForm<EditTemplateForm>({
        resolver: zodResolver(editTemplateSchema),
        defaultValues: {
            name: '',
            html: '',
            css: '',
            variables: {},
            quizType: '',
            description: '',
            isPublic: false,
            subscriptionPlan: 'FREE',
        },
    });

    const watchedName = form.watch("name");
    const watchedDescription = form.watch("description");
    const watchedQuizType = form.watch("quizType");
    const watchedIsPublic = form.watch("isPublic");
    const watchedSubscriptionPlan = form.watch("subscriptionPlan");

    // Get the details of the selected quiz type
    const quizTypeDetails = QUIZ_TYPES.find(type => type.id === watchedQuizType) || QUIZ_TYPES[0];

    useEffect(() => {
        async function loadTemplate() {
            if (!templateId) return;

            try {
                setIsLoading(true);
                // Use direct fetch instead of fetchApi utility since we confirmed it works better
                const response = await fetch(`/api/templates/${templateId}`);

                if (!response.ok) {
                    throw new Error(`Failed to load template: ${response.status}`);
                }

                const data = await response.json();
                setTemplate(data);
                updateTemplate(data);
                form.reset({
                    name: data.name,
                    html: data.html || '',
                    css: data.css || '',
                    variables: data.variables || {},
                    quizType: data.quizType || '',
                    description: data.description || '',
                    isPublic: data.isPublic || false,
                    subscriptionPlan: data.subscriptionPlan || 'FREE',
                });

                // Immediately update the preview after form reset
                setTimeout(() => {
                    updatePreview();
                }, 0);
            } catch (err) {
                toast({
                    variant: 'destructive',
                    description: err instanceof Error ? err.message : 'Failed to load template',
                });
                router.push('/dashboard/templates');
            } finally {
                setIsLoading(false);
            }
        }

        loadTemplate();
    }, [templateId, toast, router, form, updateTemplate]);

    const updatePreview = useCallback(async () => {
        // Get values from form with fallbacks to template data
        const values = form.getValues();
        const html = values.html || template?.html || '';
        const css = values.css || template?.css || '';
        const variables = values.variables && Object.keys(values.variables).length > 0
            ? values.variables
            : template?.variables || {};

        if (!html) return;

        try {
            // Replace variables in template
            let processedHtml = html;
            Object.entries(variables).forEach(([key, value]) => {
                processedHtml = processedHtml.replace(
                    new RegExp(`{{${key}}}`, "g"),
                    String(value)
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
        </html>
      `;

            setPreviewHtml(fullHtml);
        } catch {
            toast({
                title: "Error",
                description: "Failed to render template preview",
                variant: "destructive",
            });
        }
    }, [form, toast, template]);

    useEffect(() => {
        if (!isLoading && template) {
            updatePreview();
        }
    }, [updatePreview, isLoading, template]);

    const handleGenerateImage = async () => {
        if (!template) return;

        try {
            setIsGenerating(true);

            // Process HTML to replace variable placeholders with values
            let processedHtml = template.html || '';
            if (template.variables) {
                Object.entries(template.variables).forEach(([key, value]) => {
                    processedHtml = processedHtml.replace(
                        new RegExp(`{{${key}}}`, "g"),
                        String(value)
                    );
                });
            }

            // Create a complete HTML document with proper structure and styles
            const completeHtml: string = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          /* Reset styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* Base styles */
          body {
            width: 1080px;
            height: 1080px;
            margin: 0;
            padding: 0;
            background: white;
          }

          /* Template styles */
          ${template.css || ''}
        </style>
      </head>
      <body>
        ${processedHtml}
      </body>
    </html>
  `;

            // Generate a structured filename with template ID and type
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const quizType = template.quizType || 'template';
            const filename = `templates/template-${template.id}-${quizType}-${timestamp}.png`;

            // Generate image with specific filename
            const imageUrl = await generateImage(completeHtml, { filename });

            // TypeScript safety check - ensure imageUrl is a string
            if (typeof imageUrl === 'string') {
                // Save the image URL to the template exactly as returned from the API
                const response = await fetch(`/api/templates/${template.id}`, {
                    method: "PATCH",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        previewImageUrl: imageUrl
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to update template with preview image: ${response.status}`);
                }

                // Get updated template data
                const updatedTemplate = await response.json();

                // Update local state and store
                setTemplate(updatedTemplate);
                updateTemplate(updatedTemplate);

                toast({
                    title: "Success",
                    description: "Preview image generated and saved successfully",
                });
            } else {
                throw new Error("Image generation failed - no URL returned");
            }
        } catch (err) {
            console.error('Failed to generate preview image:', err);
            let errorMessage = "Failed to generate preview image";

            if (err instanceof Error) {
                errorMessage += `: ${err.message}`;
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemovePreviewImage = async () => {
        if (!template || !template.previewImageUrl) return;

        try {
            setIsGenerating(true);

            // Remove the image URL from the template
            const response = await fetch(`/api/templates/${template.id}`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    previewImageUrl: null
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to remove preview image: ${response.status}`);
            }

            // Get updated template data
            const updatedTemplate = await response.json();

            // Update local state and store
            setTemplate(updatedTemplate);
            updateTemplate(updatedTemplate);

            toast({
                title: "Success",
                description: "Preview image removed successfully",
            });
        } catch (err) {
            console.error('Failed to remove preview image:', err);
            toast({
                title: "Error",
                description: "Failed to remove preview image",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = useCallback(async (formData: EditTemplateForm) => {
        if (!template) return;

        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/templates/${template.id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const updatedTemplate = await response.json();
            setTemplate(updatedTemplate);
            updateTemplate(updatedTemplate);
            toast({
                title: "Success",
                description: "Template updated successfully",
            });
        } catch (err) {
            console.error('Failed to update template:', err);
            toast({
                title: "Error",
                description: "Failed to update template. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [template, updateTemplate, toast]);

    const handlePublish = async () => {
        if (!templateId) return;

        try {
            const response = await fetch(`/api/templates/${templateId}/publish`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Publish failed: ${response.status}`);
            }

            // Get the updated template data
            const updatedTemplate = await response.json();

            // Update template state
            setTemplate(updatedTemplate);
            updateTemplate(updatedTemplate);

            // Update form value to reflect published state
            form.setValue("isPublic", true);

            toast({
                title: 'Success',
                description: 'Template published successfully',
            });
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to publish template',
                variant: 'destructive',
            });
        }
    };

    // Replace the useTemplateScale hook with a fully automatic version
    const useTemplateScale = () => {
        const iframeRef = useRef<HTMLIFrameElement>(null);
        const wrapperRef = useRef<HTMLDivElement>(null);

        // Auto-scale based on container dimensions
        const updateScale = useCallback(() => {
            if (!iframeRef.current || !wrapperRef.current) return;

            // Get the current container width
            const containerWidth = wrapperRef.current.clientWidth;

            // Calculate the scale needed to fit the 1080px content in the container width
            const scaleFactor = containerWidth / 1080;

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

    const { iframeRef, wrapperRef, updateScale } = useTemplateScale();

    if (isLoading) {
        return (
            <div className="container pt-6 pb-12">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-8 w-64 bg-secondary rounded mb-4"></div>
                        <div className="h-6 w-48 bg-secondary/70 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="container pt-6 pb-12">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Template Not Found</h2>
                    <p className="text-muted-foreground">
                        The template you're looking for doesn't exist or you don't have permission to view it.
                    </p>
                    <Button onClick={() => router.push('/dashboard/templates')}>
                        Back to Templates
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
                    <Link href="/dashboard/templates" className="hover:text-foreground transition-colors">
                        Templates
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground">{watchedName || 'Template Details'}</span>
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
                                            {watchedName ? watchedName : 'Template Details'}
                                        </h1>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {watchedDescription || 'Customize and manage your quiz template'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateImage}
                                        disabled={isGenerating}
                                        className="h-9"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <ImagePlus className="h-4 w-4 mr-2" />
                                                Generate Preview
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={handlePublish}
                                        className="h-9"
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
                                                    <span>Template ID: <span className="font-mono">{templateId.substring(0, 8)}...</span></span>
                                                </div>
                                                {watchedQuizType && (
                                                    <Badge
                                                        variant="outline"
                                                        className={quizTypeDetails?.color || "bg-gray-500/10 text-gray-500 border-gray-200"}
                                                    >
                                                        {quizTypeDetails?.name || watchedQuizType}
                                                    </Badge>
                                                )}
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
                                                                    {QUIZ_TYPES.map((type) => (
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
                                                                placeholder="Enter template description"
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

                                            <Separator className="my-2" />

                                            <div className="space-y-3">
                                                <FormLabel className="text-base font-medium">Template Visibility</FormLabel>
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
                                                                <div className="text-sm text-muted-foreground">
                                                                    Allow other users to use this template
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="rounded-full bg-muted p-1.5">
                                                                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="max-w-xs text-xs">
                                                                                Public templates can be discovered and used by other users
                                                                                based on their subscription plan.
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
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
                                                        <FormLabel htmlFor="subscriptionPlan" className="text-base font-medium">Required Subscription Plan</FormLabel>
                                                        <Select
                                                            value={watchedSubscriptionPlan || 'FREE'}
                                                            onValueChange={(value) => form.setValue("subscriptionPlan", value)}
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
                                                        <div className="text-sm text-muted-foreground">
                                                            Users need this subscription level or higher to access this template
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

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
                                                                    placeholder="Enter HTML template"
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

                                            <Separator />

                                            <div>
                                                <h3 className="font-medium text-base flex items-center gap-2 mb-2">
                                                    <FileType className="h-5 w-5 text-primary" />
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
                                                    <p className="font-medium mb-1">JSON Format</p>
                                                    <p>Define your variables as a JSON object. These will replace the <code className="bg-background/80 border border-primary/10 px-1 rounded">{'{{variableName}}'}</code> placeholders in your HTML.</p>
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="variables"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter template variables as JSON"
                                                                className="font-mono min-h-[400px]"
                                                                value={JSON.stringify(field.value, null, 2)}
                                                                onChange={(e) => {
                                                                    try {
                                                                        const parsed = JSON.parse(e.target.value);
                                                                        field.onChange(parsed);
                                                                        updatePreview();
                                                                    } catch {
                                                                        // Invalid JSON, ignore
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Define variables used in your template as JSON. These will be used to replace placeholders in your HTML.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <p>Use valid JSON format</p>
                                                <p>{Object.keys(form.getValues("variables") || {}).length} variables defined</p>
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
                            <div className="w-full flex justify-center">
                                <div
                                    ref={wrapperRef}
                                    className="w-full max-w-xl aspect-square bg-white rounded-lg border shadow-sm overflow-hidden relative"
                                >
                                    <iframe
                                        ref={iframeRef}
                                        srcDoc={previewHtml}
                                        title="Template Preview"
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

                            {/* Template info */}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {watchedQuizType && (
                                        <Badge
                                            variant="outline"
                                            className={quizTypeDetails?.color || "bg-gray-500/10 text-gray-500 border-gray-200"}
                                        >
                                            {quizTypeDetails?.name || watchedQuizType}
                                        </Badge>
                                    )}

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

                                    {watchedIsPublic && watchedSubscriptionPlan && watchedSubscriptionPlan !== 'FREE' && (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-200">
                                            <Crown className="h-3 w-3 mr-1" />
                                            {SUBSCRIPTION_PLANS.find(p => p.id === watchedSubscriptionPlan)?.name || 'Premium'}
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="font-medium">
                                    {watchedName || template.name}
                                </h3>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {watchedDescription || "No description provided."}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6 border shadow-sm">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileType className="h-5 w-5 text-primary" />
                                    Template Information
                                </CardTitle>
                                <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-200">
                                    Details
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="py-4 px-5">
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <div className="flex items-center gap-2 min-w-32">
                                        <div className="p-1.5 rounded-md bg-primary/10">
                                            <FileCode className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <span className="font-medium">Template ID</span>
                                    </div>
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                                        {template.id}
                                    </code>
                                </div>

                                <div className="flex items-center text-sm">
                                    <div className="flex items-center gap-2 min-w-32">
                                        <div className="p-1.5 rounded-md bg-green-500/10">
                                            <Calendar className="h-3.5 w-3.5 text-green-500" />
                                        </div>
                                        <span className="font-medium">Created</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {new Date(template.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center text-sm">
                                    <div className="flex items-center gap-2 min-w-32">
                                        <div className="p-1.5 rounded-md bg-blue-500/10">
                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                        </div>
                                        <span className="font-medium">Updated</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {new Date(template.updatedAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-purple-500/10">
                                        <Variable className="h-3.5 w-3.5 text-purple-500" />
                                    </div>
                                    <span className="font-medium text-sm">Required Variables</span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {Object.keys(template.variables || {}).length > 0 ? (
                                        Object.keys(template.variables || {}).map((key) => (
                                            <span key={key} className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50/50 px-2 py-1 text-xs font-medium text-purple-700">
                                                {key}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No variables defined</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6 border shadow-sm">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    Preview Image
                                </CardTitle>
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-200">
                                    Visual
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="py-4 px-5">
                            <div className="space-y-4">
                                {template.previewImageUrl ? (
                                    <div className="space-y-3">
                                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                                            <img
                                                src={template.previewImageUrl}
                                                alt={`Preview of ${template.name}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleGenerateImage}
                                                disabled={isGenerating}
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleRemovePreviewImage}
                                                disabled={isGenerating}
                                            >
                                                <Trash className="h-3.5 w-3.5 mr-1.5" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed bg-muted/50">
                                            <div className="flex flex-col items-center justify-center space-y-2 text-center p-6">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">No preview image</p>
                                                    <div className="text-xs text-muted-foreground">
                                                        Generate a preview image to display in template cards
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={handleGenerateImage}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <ImagePlus className="h-4 w-4 mr-2" />
                                                    Generate Preview Image
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium mb-1">Preview Image Usage</p>
                                            <div className="text-sm text-muted-foreground">
                                                This image will be used to represent your template in the templates gallery and in template cards across the platform. For best results, the preview should clearly showcase the template's design.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Page component extracts the ID and passes it to the client component
export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap the params Promise using React.use()
    const resolvedParams = React.use(params);
    // Extract the ID once here and pass it to the client component
    return <TemplateDetailClient templateId={resolvedParams.id} />;
} 