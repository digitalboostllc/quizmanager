import { Template } from '@/lib/types';
import { QuizType, Prisma } from '@prisma/client';
import { ValidationError } from '@/services/api/errors/ApiError';
import { TemplateValidator, type ValidateTemplateData } from './validators/TemplateValidator';
import { QuizRenderer } from './renderers/QuizRenderer';
import { prisma } from '@/lib/prisma';

export interface TemplateOptions {
  name: string;
  html: string;
  css?: string | null;
  quizType: QuizType;
  variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
  imageUrl?: string | null;
  description?: string | null;
}

export interface UpdateTemplateOptions extends TemplateOptions {
  id: string;
}

export class TemplateManager {
  private static instance: TemplateManager;
  private validator: TemplateValidator;
  private renderer: QuizRenderer;

  private constructor() {
    this.validator = TemplateValidator.getInstance();
    this.renderer = QuizRenderer.getInstance();
  }

  public static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  public async validateTemplate(options: TemplateOptions): Promise<boolean> {
    const validationData: ValidateTemplateData = {
      ...options,
      css: options.css ?? null,
      imageUrl: options.imageUrl ?? null,
      description: options.description ?? null
    };
    const result = await this.validator.validate(validationData);
    return result.isValid;
  }

  public async renderTemplate(template: Template, variables: Record<string, string | number | boolean | string[] | Record<string, unknown>>): Promise<string> {
    return this.renderer.render({ template, variables }).html;
  }

  public async createTemplate(data: TemplateOptions) {
    // Validate template
    const validationData: ValidateTemplateData = {
      ...data,
      css: data.css ?? null,
      imageUrl: data.imageUrl ?? null,
      description: data.description ?? null
    };
    const validationResult = await this.validator.validate(validationData);

    if (!validationResult.isValid) {
      throw new ValidationError(
        'Template validation failed',
        validationResult.errors
      );
    }

    try {
      const template = await prisma.template.create({
        data: {
          name: data.name,
          html: data.html,
          css: data.css ?? null,
          variables: data.variables as Prisma.InputJsonValue,
          quizType: data.quizType,
          imageUrl: data.imageUrl ?? null,
          description: data.description ?? null
        }
      });

      return template;
    } catch (error) {
      throw new ValidationError('Failed to create template', error);
    }
  }

  public async updateTemplate(data: UpdateTemplateOptions) {
    // Validate updated template
    const validationData: ValidateTemplateData = {
      ...data,
      css: data.css ?? null,
      imageUrl: data.imageUrl ?? null,
      description: data.description ?? null
    };
    const validationResult = await this.validator.validate(validationData);

    if (!validationResult.isValid) {
      throw new ValidationError(
        'Template validation failed',
        validationResult.errors
      );
    }

    try {
      const template = await prisma.template.update({
        where: { id: data.id },
        data: {
          name: data.name,
          html: data.html,
          css: data.css ?? null,
          variables: data.variables as Prisma.InputJsonValue,
          quizType: data.quizType,
          imageUrl: data.imageUrl ?? null,
          description: data.description ?? null
        }
      });

      return template;
    } catch (error) {
      throw new ValidationError('Failed to update template', error);
    }
  }

  public async deleteTemplate(id: string) {
    try {
      await prisma.template.delete({
        where: { id }
      });
    } catch (error) {
      throw new ValidationError('Failed to delete template', error);
    }
  }

  public async getTemplate(id: string): Promise<Template> {
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      throw new ValidationError(`Template not found: ${id}`);
    }

    return {
      ...template,
      variables: template.variables as Record<string, string | number | boolean | string[] | Record<string, unknown>>
    };
  }

  public async getTemplates(): Promise<Template[]> {
    const templates = await prisma.template.findMany();
    return templates.map(template => ({
      ...template,
      variables: template.variables as Record<string, string | number | boolean | string[] | Record<string, unknown>>
    }));
  }

  public async getTemplatesByType(quizType: QuizType): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      where: { quizType }
    });
    return templates.map(template => ({
      ...template,
      variables: template.variables as Record<string, string | number | boolean | string[] | Record<string, unknown>>
    }));
  }
} 