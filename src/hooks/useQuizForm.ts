import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/api';
import { createQuizSchema, type CreateQuizForm, type QuizGenerationResponse } from '@/lib/schemas/quiz';
import { useStore } from '@/lib/store';
import type { Quiz } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface UseQuizFormOptions {
  onSuccess?: (quiz: Quiz) => void;
  onError?: (error: Error) => void;
}

interface TemplateVariables {
  html?: string;
  wordGrid?: string | { html: string };
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

interface Template {
  id: string;
  name: string;
  html: string;
  css: string | null;
  variables: TemplateVariables;
  quizType: string;
}

export function useQuizForm(options: UseQuizFormOptions = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [previewHtml, setPreviewHtml] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [completedFields, setCompletedFields] = useState<string[]>([]);
  const [currentField, setCurrentField] = useState<string | null>('');
  const { templates, setTemplates } = useStore();

  const form = useForm<CreateQuizForm>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      templateId: "",
      variables: {},
      language: "en",
      answer: "",
      solution: "",
    },
  });

  const templateId = form.watch("templateId");
  const selectedTemplate = templates.find((t) => t.id === templateId);

  const updatePreview = useCallback(async () => {
    if (!selectedTemplate) return;

    const formData = form.getValues();
    let processedHtml = selectedTemplate.html;

    // Replace template variables with form values
    const variables = {
      ...selectedTemplate.variables,
      ...formData.variables,
    } as TemplateVariables;

    // Process each variable
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      let replacement = "";

      if (key === 'wordGrid' && typeof value === 'object' && value !== null && 'html' in value) {
        replacement = value.html as string;
      } else if (Array.isArray(value)) {
        replacement = value.join('\n');
      } else if (typeof value === 'object' && value !== null) {
        replacement = JSON.stringify(value);
      } else {
        replacement = String(value || '');
      }

      processedHtml = processedHtml.replace(regex, replacement);
    });

    const fullHtml = `
      <style>${selectedTemplate.css}</style>
      ${processedHtml}
    `;

    setPreviewHtml(fullHtml);
  }, [selectedTemplate, form]);

  // Load templates when the hook is initialized
  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await fetchApi<any[]>("/templates");
        setTemplates(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      }
    }

    loadTemplates();
  }, [setTemplates, toast]);

  // Update form when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const currentLanguage = form.getValues("language");

      form.reset({
        templateId: selectedTemplate.id,
        variables: {},
        language: currentLanguage || 'en',
        answer: "",
        solution: "",
      });

      // Copy template variables without hint/hints
      const { ...templateVariables } = selectedTemplate.variables;
      form.setValue('variables', templateVariables);

      updatePreview();
    }
  }, [selectedTemplate, form, updatePreview]);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => updatePreview());
    return () => subscription.unsubscribe();
  }, [form, updatePreview]);

  const handleGenerateContent = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "No template selected",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Starting content generation');
      setIsGenerating(prev => ({ ...prev, all: true }));
      setGenerationProgress(0);
      setCompletedFields([]);
      setCurrentField('');

      const language = form.getValues('language');
      const content = form.getValues('variables.content') || '';

      // Define total steps for progress calculation
      const totalSteps = 6; // title, subtitle, branding, content, hint, solution
      let completedSteps = 0;

      const updateProgress = (field: string) => {
        setCurrentField(field);
        completedSteps++;
        setGenerationProgress((completedSteps / totalSteps) * 100);
        setCompletedFields(prev => [...prev, field]);
      };

      console.log('📤 Sending generation request:', {
        templateId: selectedTemplate.id,
        templateType: selectedTemplate.quizType,
        language,
      });

      const response = await fetchApi<QuizGenerationResponse>('/quizzes/generate', {
        method: 'POST',
        body: {
          templateId: selectedTemplate.id,
          templateType: selectedTemplate.quizType,
          language,
          content,
        },
      });

      console.log('📥 Received API response:', response);

      if (!response.success) {
        throw new Error(response.error?.message || 'Quiz generation failed');
      }

      if (!response.data) {
        throw new Error('No data received from quiz generation');
      }

      // Extract all content from the response
      const { title, subtitle, brandingText, hint, variables, answer, solution } = response.data;

      // Update progress for each field as we process it
      if (title) updateProgress('title');
      if (subtitle) updateProgress('subtitle');
      if (brandingText) updateProgress('brandingText');
      if (variables) updateProgress('content');
      if (hint) updateProgress('hint');
      if (solution) updateProgress('solution');

      // Get the current word grid and ensure it's not empty
      const currentWordGrid = form.getValues('variables.wordGrid');
      const hasValidWordGrid =
        currentWordGrid &&
        typeof currentWordGrid === 'string' &&
        currentWordGrid.includes('word-grid-container');

      // Create updated variables object with proper type annotation
      const updatedVariables: Record<string, string | number | boolean | string[] | Record<string, unknown>> = {
        ...selectedTemplate.variables, // Start with template defaults
        ...variables, // Override with API response variables
        title: title || (variables?.title as string | undefined) || '', // Ensure title is set
        subtitle: subtitle || (variables?.subtitle as string | undefined) || '', // Ensure subtitle is set
        brandingText: brandingText || (variables?.brandingText as string | undefined) || '', // Ensure branding text is set
        hint: hint || (variables?.hint as string | undefined) || '', // Ensure hint is set
        // Keep the current word grid if it's valid and the new one is empty
        wordGrid: (variables?.wordGrid && typeof variables.wordGrid === 'string' && variables.wordGrid.includes('word-grid-container'))
          ? variables.wordGrid
          : (hasValidWordGrid ? currentWordGrid : (variables?.wordGrid as string | undefined) || '{{wordGrid}}')
      };

      // Clean up variables before setting
      Object.keys(updatedVariables).forEach(key => {
        if (updatedVariables[key] === null || updatedVariables[key] === undefined) {
          delete updatedVariables[key];
        }
      });

      console.log('📝 Updating form with variables:', updatedVariables);

      // Update form values
      form.setValue('variables', updatedVariables);
      if (answer) form.setValue('answer', answer);
      if (solution) form.setValue('solution', solution);

      // Update preview
      await updatePreview();

      setGenerationProgress(100);
      setIsGenerating(prev => ({ ...prev, all: false }));
      setCurrentField(null);

      toast({
        title: "Content generated successfully",
        description: "All quiz content has been updated.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(prev => ({ ...prev, all: false }));
      setCurrentField(null);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate quiz content",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = useCallback(async (data: CreateQuizForm) => {
    try {
      setIsSubmitting(true);

      // Create quiz
      const quiz = await fetchApi<Quiz>('/quizzes', {
        method: 'POST',
        body: {
          title: data.variables.title || 'Untitled Quiz',
          description: data.variables.subtitle || '',
          quizType: selectedTemplate?.quizType || '',
          templateId: data.templateId,
          variables: data.variables,
          answer: data.answer,
          solution: data.solution,
          language: data.language
        }
      });

      // Generate preview image using server-side endpoint
      setIsGenerating(prev => ({ ...prev, image: true }));

      try {
        // Use the server-side regenerate-image endpoint instead of client-side generation
        const imageResponse = await fetchApi<{ imageUrl: string }>(`quizzes/${quiz.id}/regenerate-image`, {
          method: 'POST'
        });

        if (imageResponse?.imageUrl) {
          // Update quiz with image URL
          await fetchApi(`/quizzes/${quiz.id}`, {
            method: 'PUT',
            body: {
              imageUrl: imageResponse.imageUrl,
            },
          });
        }
      } catch (imageError) {
        console.error('Failed to generate image:', imageError);
        // Continue with quiz creation even if image generation fails
      }

      toast({
        title: 'Success',
        description: 'Quiz created successfully',
      });

      if (options.onSuccess) {
        options.onSuccess(quiz);
      }

      router.push('/quizzes');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create quiz',
        variant: 'destructive',
      });

      if (options.onError && error instanceof Error) {
        options.onError(error);
      }
    } finally {
      setIsSubmitting(false);
      setIsGenerating(prev => ({ ...prev, image: false }));
    }
  }, [router, toast, options, selectedTemplate]);

  return {
    form,
    isSubmitting,
    isGenerating,
    previewHtml,
    generationProgress,
    completedFields,
    currentField,
    selectedTemplate,
    templates,
    handleGenerateContent,
    handleSubmit,
  };
} 