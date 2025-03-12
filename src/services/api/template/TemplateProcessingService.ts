/**
 * Service for processing templates and replacing variables
 * This provides consistent template variable replacement across the application
 */
export class TemplateProcessingService {
    private static instance: TemplateProcessingService;

    private constructor() { }

    public static getInstance(): TemplateProcessingService {
        if (!TemplateProcessingService.instance) {
            TemplateProcessingService.instance = new TemplateProcessingService();
        }
        return TemplateProcessingService.instance;
    }

    /**
     * Process a template by replacing variables with their values
     * @param template The template HTML or text containing {{variable}} placeholders
     * @param variables Object containing variable names and values
     * @returns Processed template with variables replaced
     */
    public processTemplate(
        template: string,
        variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>
    ): string {
        let processedTemplate = template;

        // Replace template variables
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, "g");
            let replacement = "";

            if (Array.isArray(value)) {
                replacement = value.join('\n');
            } else if (typeof value === 'object' && value !== null) {
                replacement = JSON.stringify(value);
            } else {
                replacement = String(value || '');
            }

            processedTemplate = processedTemplate.replace(regex, replacement);
        });

        return processedTemplate;
    }

    /**
     * Combine variables from multiple sources with later sources taking precedence
     * @param sources Variable objects to combine
     * @returns Combined variables object
     */
    public combineVariables(
        ...sources: Array<Record<string, string | number | boolean | string[] | Record<string, unknown>> | null | undefined>
    ): Record<string, string | number | boolean | string[] | Record<string, unknown>> {
        const result: Record<string, string | number | boolean | string[] | Record<string, unknown>> = {};

        // Iterate through sources and merge them into the result
        for (const source of sources) {
            if (source) {
                Object.assign(result, source);
            }
        }

        return result;
    }
} 