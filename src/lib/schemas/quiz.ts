import { z } from "zod";

export const createQuizSchema = z.object({
  templateId: z.string().min(1, "Template is required"),
  variables: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.record(z.unknown())
  ])).default({}),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'] as const).default('en'),
  answer: z.string().optional(),
  solution: z.string().optional(),
});

export type CreateQuizForm = z.infer<typeof createQuizSchema>;

export interface QuizGenerationResponse {
  success: boolean;
  data?: {
    title: string;
    subtitle: string;
    brandingText: string;
    hint: string;
    variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
    answer: string;
    solution: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface GenerateResponse {
  content: string;
  answer?: string;
  theme?: string;
  error?: string;
} 