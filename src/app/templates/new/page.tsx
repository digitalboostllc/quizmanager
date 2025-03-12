"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { QuizType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle2, FileType, Lightbulb, Loader2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  'WORDLE': 'Wordle',
  'NUMBER_SEQUENCE': 'Number Sequence',
  'RHYME_TIME': 'Rhyme Time',
  'CONCEPT_CONNECTION': 'Concept Connection'
} as const;

const QUIZ_TYPE_DESCRIPTIONS: Record<QuizType, string> = {
  'WORDLE': 'A 5-letter word guessing game where players get feedback on each guess.',
  'NUMBER_SEQUENCE': 'Players identify the pattern in a sequence of numbers.',
  'RHYME_TIME': 'Words that rhyme with each other, creating fun word associations.',
  'CONCEPT_CONNECTION': 'Find the connection between seemingly unrelated concepts.'
};

// Predefined prompts for each quiz type
const PREDEFINED_PROMPTS: Record<QuizType, string> = {
  'WORDLE': `Generate a 5-letter word Wordle puzzle with the following specifications:
  
- Choose a word related to {{topic}}
- The word should be common enough that most people would know it
- Provide 3 hints of increasing specificity that guide the player
- Include an explanation of why this word relates to the topic
- Format the word grid to show correct letters in green, misplaced letters in yellow

Response format:
Word: [the 5-letter word]
Hint 1: [general hint]
Hint 2: [more specific hint]
Hint 3: [most specific hint]
Explanation: [why this word relates to the topic]`,

  'NUMBER_SEQUENCE': `Create a number sequence puzzle with these requirements:

- The sequence should relate to {{topic}} if possible
- Include at least 5 numbers following a clear pattern
- Difficulty level: medium (challenging but solvable)
- Provide a hint that guides the player toward the pattern
- Explain the mathematical or logical rule behind the sequence

Response format:
Sequence: [list of numbers with question mark for the missing number]
Hint: [a clue about the pattern]
Answer: [the next number in the sequence]
Explanation: [detailed explanation of the pattern]`,

  'RHYME_TIME': `Generate a rhyme time word puzzle with these specifications:

- Create pairs of rhyming words related to {{topic}}
- Each pair should form a meaningful phrase (e.g., "fat cat")
- Include 3-5 rhyming pairs of increasing difficulty
- Provide a clue for each pair that describes the meaning
- Make the rhymes interesting and creative

Response format:
Pair 1: [first rhyming pair]
Clue 1: [description of what the pair means]
Pair 2: [second rhyming pair]
Clue 2: [description of what the pair means]
... and so on`,

  'CONCEPT_CONNECTION': `Create a concept connection puzzle following these guidelines:

- Select 4 concepts/words related to {{topic}} by a common theme
- The connection should be non-obvious but discoverable
- Each concept should be distinct but connected by the theme
- Provide a hint that subtly points toward the connection
- Include an explanation of how each concept relates to the theme

Response format:
Concepts: [list the 4 concepts]
Hint: [subtle clue about the connection]
Connection: [the theme that connects them]
Explanation: [how each concept relates to the theme]`
};

// Examples for each quiz type
const TEMPLATE_EXAMPLES: Record<QuizType, Record<string, string>> = {
  'WORDLE': {
    'topic': 'astronomy',
    'example': 'STARS - A celestial body that generates light through nuclear fusion'
  },
  'NUMBER_SEQUENCE': {
    'topic': 'fibonacci',
    'example': '1, 1, 2, 3, 5, 8, 13, ?'
  },
  'RHYME_TIME': {
    'topic': 'food',
    'example': 'SWEET TREAT, SOUR FLOUR'
  },
  'CONCEPT_CONNECTION': {
    'topic': 'elements',
    'example': 'FIRE, WATER, EARTH, AIR - The classical elements'
  }
};

// Keywords to validate prompt relevance
const QUIZ_TYPE_KEYWORDS: Record<QuizType, string[]> = {
  'WORDLE': ['word', 'letter', 'guess', 'position', 'wordle', 'grid'],
  'NUMBER_SEQUENCE': ['number', 'sequence', 'pattern', 'mathematical', 'next', 'formula'],
  'RHYME_TIME': ['rhyme', 'pair', 'words', 'phrase', 'sound'],
  'CONCEPT_CONNECTION': ['concept', 'connection', 'theme', 'relate', 'common', 'link']
};

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  type: z.enum([
    'WORDLE',
    'NUMBER_SEQUENCE',
    'RHYME_TIME',
    'CONCEPT_CONNECTION'
  ]),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl']),
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(2000, "Prompt must be less than 2000 characters"),
  parameters: z.record(z.string(), z.any()).optional()
});

type CreateTemplateForm = z.infer<typeof formSchema>;

export default function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promptValidation, setPromptValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const form = useForm<CreateTemplateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "WORDLE",
      language: "en",
      prompt: "",
      parameters: {}
    }
  });

  const selectedQuizType = form.watch("type") as QuizType;
  const currentPrompt = form.watch("prompt");

  // Update prompt when quiz type changes
  useEffect(() => {
    if (!currentPrompt || currentPrompt === PREDEFINED_PROMPTS[selectedQuizType === 'WORDLE' ? 'NUMBER_SEQUENCE' : 'WORDLE']) {
      form.setValue("prompt", PREDEFINED_PROMPTS[selectedQuizType]);
    }
  }, [selectedQuizType, form, currentPrompt]);

  // Validate that the prompt is relevant to the quiz type
  useEffect(() => {
    if (!currentPrompt) {
      setPromptValidation(null);
      return;
    }

    const quizTypeKeywords = QUIZ_TYPE_KEYWORDS[selectedQuizType];
    const promptLower = currentPrompt.toLowerCase();

    const matchedKeywords = quizTypeKeywords.filter(keyword =>
      promptLower.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length >= 2) {
      setPromptValidation({
        valid: true,
        message: `Prompt appears to be relevant to ${QUIZ_TYPE_LABELS[selectedQuizType]}`
      });
    } else {
      setPromptValidation({
        valid: false,
        message: `Prompt may not be relevant to ${QUIZ_TYPE_LABELS[selectedQuizType]}. Please include more specific ${QUIZ_TYPE_LABELS[selectedQuizType]} terminology.`
      });
    }
  }, [currentPrompt, selectedQuizType]);

  const onSubmit = async (data: CreateTemplateForm) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      toast.success('Template created successfully');
      router.push('/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsePredefinedPrompt = () => {
    form.setValue("prompt", PREDEFINED_PROMPTS[selectedQuizType]);
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Page header with consistent styling */}
      <div className="space-y-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <FileType className="h-4 w-4 mr-2" />
          Template Creation
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
            <p className="text-muted-foreground text-lg">
              Design a custom template for generating quizzes
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" /> Back to Templates
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Template Details
              </CardTitle>
              <CardDescription>
                Enter the basic information for your new quiz template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., 'Animal Wordle Challenge'" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for your template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a quiz type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(QUIZ_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of quiz this template will generate
                          </FormDescription>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="fr">French</SelectItem>
                              <SelectItem value="de">German</SelectItem>
                              <SelectItem value="it">Italian</SelectItem>
                              <SelectItem value="pt">Portuguese</SelectItem>
                              <SelectItem value="nl">Dutch</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The language this quiz will be generated in
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
                            placeholder="Describe what this template does and what kind of quizzes it creates..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A detailed description helps you and others understand the template's purpose
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    {promptValidation && (
                      <Alert variant={promptValidation.valid ? "default" : "destructive"}>
                        {promptValidation.valid ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {promptValidation.valid ? "Valid Prompt" : "Warning"}
                        </AlertTitle>
                        <AlertDescription>
                          {promptValidation.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-between items-center">
                      <FormLabel>Generation Prompt</FormLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleUsePredefinedPrompt}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Use Predefined Prompt
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Enter the prompt template that will be used to generate the quiz..."
                              className="min-h-[300px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The AI prompt that will be used to generate quiz content. Use <code>{'{{topic}}'}</code> as a placeholder for user-specified topics.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/templates')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || (promptValidation && !promptValidation.valid)}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Template
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border border-border/50 shadow-sm sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Template Guide
              </CardTitle>
              <CardDescription>
                Information about the selected quiz type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{QUIZ_TYPE_LABELS[selectedQuizType]}</h3>
                <p className="text-muted-foreground">{QUIZ_TYPE_DESCRIPTIONS[selectedQuizType]}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Prompt Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Use <code className="bg-muted px-1 rounded">{'{{topic}}'}</code> variables in your prompt</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Be specific about difficulty level desired</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Include instructions for formatting the output</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Use a clear output format (e.g., "Word: [answer]")</span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Example</h3>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium mb-1">Topic: {TEMPLATE_EXAMPLES[selectedQuizType].topic}</p>
                  <p className="text-muted-foreground">{TEMPLATE_EXAMPLES[selectedQuizType].example}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 