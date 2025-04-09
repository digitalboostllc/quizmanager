import { useToast } from '@/components/ui/use-toast';
import { useStore } from '@/lib/store';
import type { Quiz, Template } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useBatchGeneration } from './useBatchGeneration';

interface UseQuizFormOptions {
  onSuccess?: (quiz: Quiz) => void;
  onError?: (error: Error) => void;
  initialValues?: Partial<FormState>;
  onSubmit?: (values: FormState) => Promise<void>;
}

interface TemplateVariables {
  html?: string;
  wordGrid?: string | { html: string };
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

const formSchema = z.object({
  templateId: z.string().min(1, 'Please select a template'),
  language: z.string().default('en'),
  difficulty: z.string().default('medium'),
  theme: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional(),
  title: z.string().optional(),
  answer: z.string().optional(),
  solution: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  visibility: z.string().optional(),
});

type FormState = z.infer<typeof formSchema>;

export function useQuizForm(options: UseQuizFormOptions = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [completedFields, setCompletedFields] = useState<string[]>([]);
  const [currentField, setCurrentField] = useState<string | null>('');
  const [fetchingTemplate, setFetchingTemplate] = useState(false);
  const { templates = [], setTemplates } = useStore();
  const fetchedTemplateIds = useRef<Set<string>>(new Set());

  const {
    state: batchState,
    startBatchGeneration,
    closeBatchGeneration,
    retryFailedQuiz
  } = useBatchGeneration();

  const form = useForm<FormState>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'en',
      difficulty: 'medium',
      ...options.initialValues,
    },
  });

  const templateId = form.watch("templateId");
  const currentTemplate = Array.isArray(templates)
    ? templates.find((t) => t.id === templateId)
    : undefined;

  const ensureTemplateVariables = useCallback((html: string, variables: Record<string, any>) => {
    console.log("Ensuring all template variables exist");

    // Extract all variable names from the HTML template
    const templateVarMatches = html.match(/{{([^}]+)}}/g) || [];
    const templateVars = templateVarMatches.map(match => match.slice(2, -2));

    // Make a copy of the variables object that we can modify
    const updatedVariables = { ...variables };
    let hasChanges = false;

    // Check each template variable
    templateVars.forEach(varName => {
      // Skip variables that aren't meant to be in the variables object
      if (['language', 'difficulty', 'template'].includes(varName)) {
        return;
      }

      // If the variable doesn't exist, add it
      if (!(varName in updatedVariables) || updatedVariables[varName] === null || updatedVariables[varName] === undefined) {
        console.log(`Adding missing template variable: ${varName}`);
        updatedVariables[varName] = '';
        hasChanges = true;
      }
    });

    return { updatedVariables, hasChanges };
  }, [form, templates]);

  const updatePreview = useCallback(async () => {
    if (!currentTemplate) return;

    console.log("Updating preview with current form values");
    const formData = form.getValues();
    console.log("Form data for preview:", formData);

    // Ensure all template variables exist and have values
    if (formData.variables && currentTemplate.html) {
      const { updatedVariables, hasChanges } = ensureTemplateVariables(
        currentTemplate.html,
        formData.variables
      );

      // If variables were added or changed, update the form
      if (hasChanges) {
        console.log("Updating form variables with defaults:", updatedVariables);
        form.setValue('variables', updatedVariables);
        // Update the formData object for this function
        formData.variables = updatedVariables;
      }
    }

    let processedHtml = currentTemplate.html || '';

    // Add debug logging to help identify what's being processed
    console.log("Raw template HTML length:", processedHtml.length);

    // Find all template variables before replacement for debugging
    const allTemplateVars = processedHtml.match(/{{[^}]+}}/g) || [];
    console.log("All template variables found:", allTemplateVars);

    // First, replace top-level form variables if they exist in template
    Object.entries(formData).forEach(([key, value]) => {
      if (value === null || value === undefined || key === 'variables') return;

      const regex = new RegExp(`{{${key}}}`, "g");
      const replacement = typeof value === 'string' ? value : String(value);
      console.log(`Looking for {{${key}}} to replace with:`, replacement.substring(0, 30));

      // Count matches to help with debugging
      const matches = (processedHtml.match(regex) || []).length;
      if (matches > 0) {
        console.log(`Found ${matches} matches for {{${key}}}`);
      }

      processedHtml = processedHtml.replace(regex, replacement);
    });

    // Process variables object separately with special handling
    if (formData.variables && typeof formData.variables === 'object') {
      console.log("Processing variables object for template:", Object.keys(formData.variables));

      // Iterate through each variable and apply it to the template
      Object.entries(formData.variables).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

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

        console.log(`Looking for variable {{${key}}} to replace with:`,
          replacement.substring(0, 30) + (replacement.length > 30 ? '...' : ''));

        // Count matches to help with debugging
        const matches = (processedHtml.match(regex) || []).length;
        if (matches > 0) {
          console.log(`Found ${matches} matches for {{${key}}}`);
        }

        processedHtml = processedHtml.replace(regex, replacement);
      });
    }

    // Find any remaining template variables that weren't replaced
    const remainingVars = processedHtml.match(/{{[^}]+}}/g);
    if (remainingVars && remainingVars.length > 0) {
      console.warn("Unreplaced template variables:", remainingVars);
      console.log("Form data available:", Object.keys(formData));
      console.log("Variables available:", formData.variables ? Object.keys(formData.variables) : "none");

      // Loop through all unreplaced variables and replace them with empty strings
      remainingVars.forEach(variable => {
        // Extract the variable name without the {{ }}
        const variableName = variable.slice(2, -2);
        console.log(`Applying fallback empty replacement for ${variable}`);

        // Replace all instances of this variable with an empty string
        const variableRegex = new RegExp(`{{${variableName}}}`, "g");
        processedHtml = processedHtml.replace(variableRegex, "");
      });

      console.log("Applied fallbacks for all unreplaced variables");
    } else {
      console.log("All template variables were successfully replaced");
    }

    // Force update of HTML - this is important as it tells React to re-render
    setPreviewHtml('');
    setTimeout(() => {
      console.log("Setting new preview HTML, length:", processedHtml.length);

      // Double check for any remaining template variables
      const finalCheck = processedHtml.match(/{{[^}]+}}/g);
      if (finalCheck && finalCheck.length > 0) {
        console.warn("Still found unreplaced variables after processing:", finalCheck);
        // Last-chance replacement - replace with visible markers for debugging
        finalCheck.forEach(variable => {
          const variableName = variable.slice(2, -2);
          processedHtml = processedHtml.replace(
            new RegExp(`{{${variableName}}}`, "g"),
            `<span style="background:yellow;color:red">${variableName}</span>`
          );
        });
      }

      setPreviewHtml(processedHtml);
    }, 10);

    return processedHtml;
  }, [currentTemplate, form, ensureTemplateVariables]);

  // Add logging for template fetching
  useEffect(() => {
    console.log('Fetching templates...');
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        console.log('Fetched templates:', data);
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  // Add logging for template selection
  useEffect(() => {
    if (currentTemplate) {
      console.log('Selected template:', currentTemplate);
      console.log('Template quiz type:', currentTemplate.quizType);
      console.log('Template variables:', currentTemplate.variables);
    }
  }, [currentTemplate]);

  // Fetch full template details when a template is selected
  useEffect(() => {
    async function fetchTemplateDetails(id: string) {
      if (!id || fetchedTemplateIds.current.has(id)) return;

      try {
        setFetchingTemplate(true);
        const response = await fetch(`/api/templates/${id}`);
        if (!response.ok) throw new Error(`Failed to fetch template details: ${response.status}`);

        const templateDetails = await response.json() as Template;
        if (!templateDetails) throw new Error(`Failed to fetch template details for ID ${id}`);

        // Update templates in store
        const updatedTemplates = Array.isArray(templates)
          ? templates.map(t => t.id === id ? { ...t, ...templateDetails } : t)
          : [templateDetails];

        setTemplates(updatedTemplates);
        fetchedTemplateIds.current.add(id);

        // Generate preview HTML immediately after getting template details
        const html = await updatePreview();
        if (html) {
          console.log('Generated preview HTML after template fetch:', html.substring(0, 100) + '...');
          setPreviewHtml(html);
        }
      } catch (error) {
        console.error("Error fetching template details:", error);
        toast({
          title: "Error",
          description: "Failed to load template details",
        });
      } finally {
        setFetchingTemplate(false);
      }
    }

    if (templateId && (!currentTemplate?.variables || !currentTemplate?.html)) {
      fetchTemplateDetails(templateId);
    }
  }, [templateId, currentTemplate, templates, setTemplates, updatePreview]);

  // Update form when template changes
  useEffect(() => {
    if (currentTemplate && currentTemplate.variables) {
      const currentLanguage = form.getValues("language");
      const currentTitle = form.getValues("title"); // Get current title to preserve it

      form.reset({
        templateId: currentTemplate.id,
        variables: {},
        language: currentLanguage || 'en',
        answer: "",
        solution: "",
        title: currentTitle || "", // Preserve any existing title
      });

      // Copy template variables and ensure it's not undefined
      const templateVariables = currentTemplate.variables ? { ...currentTemplate.variables } : {};

      // Process variables to ensure all values are non-null (prevents uncontrolled to controlled errors)
      Object.keys(templateVariables).forEach(key => {
        if (templateVariables[key] === null || templateVariables[key] === undefined) {
          templateVariables[key] = '';
        }
      });

      // Ensure title is synced properly
      if (currentTitle && !templateVariables.title) {
        templateVariables.title = currentTitle;
      } else if (templateVariables.title && !currentTitle) {
        // Convert templateVariables.title to string before setting it
        const titleValue = String(templateVariables.title || "");
        form.setValue('title', titleValue);
      }

      console.log(`Setting form variables for template ${currentTemplate.id}:`, templateVariables);
      form.setValue('variables', templateVariables);

      // Explicitly update preview HTML after setting form values
      updatePreview().then(html => {
        if (html) {
          setPreviewHtml(html);
        }
      });
    }
  }, [currentTemplate, form, updatePreview]);

  // Watch for form changes
  useEffect(() => {
    console.log("Setting up form watcher for preview updates");

    // Track all changes to form fields and update preview
    const subscription = form.watch(async (value, { name, type }) => {
      console.log(`Form value changed: ${name}`, type);

      // Don't update for blur events
      if (type === 'blur') return;

      // Update the preview HTML
      const html = await updatePreview();
      if (html) {
        console.log(`Preview HTML updated after change to ${name}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, updatePreview]);

  // Add an additional effect to handle direct variable changes
  useEffect(() => {
    if (currentTemplate) {
      console.log("Current template changed, updating preview");
      updatePreview().then(html => {
        if (html) {
          setPreviewHtml(html);
        }
      });
    }
  }, [currentTemplate, updatePreview]);

  const handleGenerateContent = async () => {
    const templateId = form.getValues('templateId');
    if (!templateId) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCompletedFields([]);
    setCurrentField(null);

    try {
      const response = await fetch('/api/quiz-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          language: form.getValues('language'),
          difficulty: form.getValues('difficulty'),
          theme: form.getValues('theme'),
          variables: form.getValues('variables'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);
            if (data.type === 'progress') {
              setGenerationProgress(data.progress);
              setCurrentField(data.currentField);
            } else if (data.type === 'field_complete') {
              setCompletedFields(prev => [...prev, data.field]);
              if (data.field === 'title') {
                form.setValue('title', data.value);
              } else if (data.field === 'answer') {
                form.setValue('answer', data.value);
              } else if (data.field === 'solution') {
                form.setValue('solution', data.value);
              }
            }
          } catch (error) {
            console.error('Error parsing chunk:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (values: FormState) => {
    if (!currentTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          variables: values.variables || {},
          language: values.language,
          answer: values.answer || '',
          solution: values.solution || '',
          title: values.title || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const quiz = await response.json();
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });

      if (options.onSubmit) {
        await options.onSubmit(values);
      } else {
        router.push('/dashboard/quizzes');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    form.setValue('templateId', template.id);
    form.setValue('variables', template.variables || {});
  };

  const handleAIFill = async () => {
    if (!currentTemplate) {
      toast({
        title: "Error",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    const language = form.getValues('language') || 'en';
    const difficulty = form.getValues('difficulty') || 'medium';

    // Set generating state
    setIsGenerating(true);

    try {
      // Generate content for the quiz using the API
      const response = await fetch('/api/quiz-generation/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          language: language,
          templateType: currentTemplate.quizType,
          difficulty: difficulty
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      // Fill the form with the generated content
      if (data.title) form.setValue('title', data.title);
      if (data.subtitle) {
        form.setValue('description', data.subtitle);
        form.setValue('variables.subtitle', data.subtitle);
      }
      if (data.brandingText) form.setValue('variables.brandingText', data.brandingText);
      if (data.variables) {
        // Merge with existing variables to preserve template structure
        const currentVariables = form.getValues('variables') || {};
        const mergedVariables = { ...currentVariables, ...data.variables };
        form.setValue('variables', mergedVariables);
      }

      // Update other relevant fields if available in the response
      if (data.hint) form.setValue('variables.hint', data.hint);
      if (data.answer) form.setValue('answer', data.answer);
      if (data.solution) form.setValue('solution', data.solution);

      // Force validation
      form.trigger();

      // Update the preview
      await regeneratePreviewHtml();

      toast({
        title: "Success",
        description: "Form filled with AI-generated content",
      });
    } catch (error) {
      console.error('Error filling form with AI:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fill form with AI content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add this explicit function to update the preview HTML
  const regeneratePreviewHtml = async () => {
    console.log("Regenerating preview HTML");
    try {
      const html = await updatePreview();
      console.log("Preview HTML regenerated");
      return html; // Return the HTML so the function returns a string, not void
    } catch (error) {
      console.error("Error regenerating preview HTML:", error);
      return ""; // Return empty string on error
    }
  };

  // Add a ref to track synchronization to prevent recursion
  const syncInProgressRef = useRef(false);

  // Add a function to ensure title synchronization
  const ensureTitleSync = useCallback(() => {
    if (syncInProgressRef.current) return; // Prevent recursion

    try {
      syncInProgressRef.current = true; // Set flag to prevent recursion
      const formData = form.getValues();

      // If we have a title but no variables.title, copy the title to variables.title
      if (formData.title && (!formData.variables || !formData.variables.title)) {
        console.log("Copying main title to variables.title:", formData.title);
        form.setValue('variables.title', formData.title, {
          shouldDirty: true,
          shouldValidate: false
        });
      }
      // If we have variables.title but no main title, copy variables.title to title
      else if (formData.variables && formData.variables.title && !formData.title) {
        console.log("Copying variables.title to main title:", formData.variables.title);
        form.setValue('title', String(formData.variables.title), {
          shouldDirty: true,
          shouldValidate: false
        });
      }
    } finally {
      syncInProgressRef.current = false; // Always clear the flag
    }
  }, [form]);

  // Call ensureTitleSync after a short delay when the form is initialized
  useEffect(() => {
    setTimeout(() => {
      ensureTitleSync();
    }, 100);
  }, [ensureTitleSync]);

  // Also call ensureTitleSync whenever currentTemplate changes
  useEffect(() => {
    if (currentTemplate) {
      setTimeout(() => {
        ensureTitleSync();
      }, 300);
    }
  }, [currentTemplate, ensureTitleSync]);

  return {
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
    handleTemplateSelect,
    updatePreview,
    batchState,
    handleAIFill,
    closeBatchGeneration,
    retryFailedQuiz,
    regeneratePreviewHtml
  };
} 