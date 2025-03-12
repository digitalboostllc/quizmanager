import { z } from "zod";

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function validateForm<T extends z.ZodType<unknown, z.ZodTypeDef>>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: FormErrors<z.infer<T>> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: FormErrors<z.infer<T>> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const key = err.path[0] as keyof z.infer<T>;
          errors[key] = err.message;
        }
      });
      return { success: false, errors };
    }
    throw error;
  }
}

export function getFormData(form: HTMLFormElement): Record<string, string> {
  const formData = new FormData(form);
  const data: Record<string, string> = {};
  
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      data[key] = value;
    }
  });
  
  return data;
} 