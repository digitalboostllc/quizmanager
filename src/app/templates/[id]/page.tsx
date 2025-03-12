"use client";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchApi } from "@/lib/api";
import { downloadGeneratedImage, generateImage } from "@/lib/image";
import { QUIZ_TYPE_DISPLAY } from "@/lib/quiz-types";
import { useStore } from "@/lib/store";
import type { Template } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
});

type EditTemplateForm = z.infer<typeof editTemplateSchema>;

export default function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const { updateTemplate } = useStore();
  const [template, setTemplate] = useState<Template | null>(null);
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const form = useForm<EditTemplateForm>({
    resolver: zodResolver(editTemplateSchema),
    defaultValues: {
      name: '',
      html: '',
      css: '',
      variables: {},
      quizType: '',
    },
  });

  useEffect(() => {
    async function loadTemplate() {
      if (!id) return;

      try {
        const data = await fetchApi<Template>(`/templates/${id}`);
        setTemplate(data);
        updateTemplate(data);
        form.reset({
          name: data.name,
          html: data.html,
          css: data.css || '',
          variables: data.variables,
          quizType: data.quizType,
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err instanceof Error ? err.message : 'Failed to load template',
        });
        router.push('/templates');
      }
    }

    loadTemplate();
  }, [id, toast, router, form, updateTemplate]);

  const updatePreview = useCallback(async () => {
    const { html, css, variables } = form.getValues();
    if (!html || !variables) return;

    try {
      // Replace variables in template
      let processedHtml = html;
      Object.entries(variables).forEach(([key, value]) => {
        processedHtml = processedHtml.replace(
          new RegExp(`{{${key}}}`, "g"),
          String(value)
        );
      });

      // Add CSS to HTML
      const fullHtml = `
        <style>${css}</style>
        ${processedHtml}
      `;

      setPreviewHtml(fullHtml);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
    }
  }, [form, toast]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleGenerateImage = async () => {
    if (!template) return;

    try {
      setIsGenerating(true);

      // Create a complete HTML document with proper structure and styles
      const completeHtml = `
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
            <div class="quiz-template">
              ${previewHtml}
            </div>
          </body>
        </html>
      `;

      const imageUrl = await generateImage(completeHtml);
      if (imageUrl) {
        await downloadGeneratedImage(imageUrl, `${template.name}-preview.png`);
        toast({
          title: "Success",
          description: "Preview image downloaded successfully",
        });
      }
    } catch (err) {
      console.error('Failed to generate preview image:', err);
      toast({
        title: "Error",
        description: "Failed to generate preview image",
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
      const updatedTemplate = await fetchApi<Template>(`/templates/${template.id}`, {
        method: "PUT",
        body: formData,
      });
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
    if (!id) return;

    try {
      await fetchApi(`/templates/${id}/publish`, {
        method: 'POST',
      });
      toast({
        title: 'Success',
        description: 'Template published successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to publish template',
        variant: 'destructive',
      });
    }
  };

  if (!template) {
    return (
      <div>
        <p>Loading...</p>
        <div className="text-sm text-muted-foreground">
          Can&apos;t find what you&apos;re looking for?
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground mt-2">Template Editor</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Download Preview"}
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={handlePublish}>Publish Template</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
              <CardDescription>
                Edit your template&apos;s HTML, CSS, and variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter template name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="html"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Template</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter HTML template"
                            className="font-mono min-h-[200px]"
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

                  <FormField
                    control={form.control}
                    name="css"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CSS Styles</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter CSS styles"
                            className="font-mono min-h-[200px]"
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

                  <FormField
                    control={form.control}
                    name="variables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Variables (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter template variables as JSON"
                            className="font-mono"
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                Preview how your template will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                id="template-preview"
                className="w-full aspect-square bg-white rounded-lg overflow-hidden shadow-lg"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Information about the template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2 text-muted-foreground">
                  {QUIZ_TYPE_DISPLAY[template.quizType]?.label ||
                    template.quizType.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="font-medium">Required Fields:</span>
                <div className="mt-1 text-sm text-muted-foreground">
                  {Object.keys(template.variables).map((key) => (
                    <span key={key} className="inline-block bg-secondary rounded-md px-2 py-1 mr-2 mb-2">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 