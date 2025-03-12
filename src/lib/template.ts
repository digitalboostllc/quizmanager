import { fetchApi } from "./api";
import { API_ENDPOINTS } from "./config";
import type { Template, CreateTemplateInput, UpdateTemplateInput } from "./types";

export async function getTemplates(): Promise<Template[]> {
  return fetchApi<Template[]>(API_ENDPOINTS.TEMPLATES);
}

export async function getTemplate(id: string): Promise<Template> {
  return fetchApi<Template>(`${API_ENDPOINTS.TEMPLATES}/${id}`);
}

export async function createTemplate(data: CreateTemplateInput): Promise<Template> {
  return fetchApi<Template>(API_ENDPOINTS.TEMPLATES, {
    method: "POST",
    body: data,
  });
}

export async function updateTemplate(id: string, data: UpdateTemplateInput): Promise<Template> {
  return fetchApi<Template>(`${API_ENDPOINTS.TEMPLATES}/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await fetchApi(`${API_ENDPOINTS.TEMPLATES}/${id}`, {
    method: "DELETE",
  });
}

export async function previewTemplate(id: string, variables: Record<string, string | undefined>): Promise<string> {
  const response = await fetchApi<{ html: string }>(`${API_ENDPOINTS.TEMPLATES}/${id}/preview`, {
    method: "POST",
    body: { variables },
  });
  return response.html;
}

export function validateTemplateVariables(
  template: Template,
  variables: Record<string, string | number | boolean | null>
): { isValid: true } | { isValid: false; errors: string[] } {
  const errors: string[] = [];
  const requiredVariables = Object.keys(template.variables);

  // Check for missing variables
  for (const key of requiredVariables) {
    if (!(key in variables)) {
      errors.push(`Missing required variable: ${key}`);
    }
  }

  // Check for type mismatches
  for (const [key, value] of Object.entries(variables)) {
    const expectedType = template.variables[key]?.type;
    if (expectedType && typeof value !== expectedType) {
      errors.push(
        `Type mismatch for variable ${key}: expected ${expectedType}, got ${typeof value}`
      );
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true };
}

export function getDefaultTemplateVariables(template: Template): Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> {
  const defaults: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> = {};

  for (const [key, value] of Object.entries(template.variables)) {
    if ('default' in value) {
      defaults[key] = value.default;
    } else {
      // Provide sensible defaults based on type
      switch (value.type) {
        case 'string':
          defaults[key] = '';
          break;
        case 'number':
          defaults[key] = 0;
          break;
        case 'boolean':
          defaults[key] = false;
          break;
        case 'array':
          defaults[key] = [];
          break;
        case 'object':
          defaults[key] = {};
          break;
        default:
          defaults[key] = null;
      }
    }
  }

  return defaults;
} 