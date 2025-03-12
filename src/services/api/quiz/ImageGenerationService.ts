import { prisma } from '@/lib/prisma';
import { Quiz } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import { TemplateProcessingService } from '../template/TemplateProcessingService';

/**
 * Centralized service for generating quiz images
 * This service can be used by both the single quiz creation and Smart Generator
 */
export class ImageGenerationService {
    private static instance: ImageGenerationService;
    private templateProcessor: TemplateProcessingService;

    private constructor() {
        this.templateProcessor = TemplateProcessingService.getInstance();
    }

    public static getInstance(): ImageGenerationService {
        if (!ImageGenerationService.instance) {
            ImageGenerationService.instance = new ImageGenerationService();
        }
        return ImageGenerationService.instance;
    }

    /**
     * Generate an image for a quiz
     * @param quizId ID of the quiz to generate an image for
     * @returns Object containing the generated image URL
     */
    public async generateQuizImage(quizId: string): Promise<{ imageUrl: string }> {
        try {
            console.log('🖼️ ImageGenerationService: Starting image generation for quiz:', quizId);

            // Get the quiz with its template
            const quiz = await prisma.quiz.findUnique({
                where: { id: quizId },
                include: { template: true },
            });

            if (!quiz) {
                console.error('❌ ImageGenerationService: Quiz not found:', quizId);
                throw new Error(`Quiz not found: ${quizId}`);
            }

            console.log('✅ ImageGenerationService: Found quiz:', {
                id: quiz.id,
                title: quiz.title,
                templateId: quiz.templateId,
                hasTemplate: !!quiz.template,
            });

            // Generate the image
            const imageUrl = await this.generateImage(quiz);

            // Update the quiz with the new image URL
            await prisma.quiz.update({
                where: { id: quiz.id },
                data: { imageUrl },
            });

            console.log('✅ ImageGenerationService: Successfully generated image:', imageUrl);

            return { imageUrl };
        } catch (error) {
            console.error('❌ ImageGenerationService: Error generating image:', error);
            throw error;
        }
    }

    /**
     * Generate an image for a quiz
     * @param quiz Quiz object with template
     * @returns URL of the generated image
     */
    private async generateImage(quiz: Quiz & { template: any }): Promise<string> {
        // Combine template and quiz variables
        const templateVars = quiz.template.variables as Record<string, string | number | boolean | string[] | Record<string, unknown>> | null;
        const quizVars = quiz.variables as Record<string, string | number | boolean | string[] | Record<string, unknown>> | null;

        const variables = this.templateProcessor.combineVariables(
            templateVars,
            quizVars,
            {
                title: quiz.title,
                answer: quiz.answer
            }
        );

        // Process template variables
        const processedHtml = this.templateProcessor.processTemplate(quiz.template.html, variables);

        // Generate filename
        const timestamp = Date.now();
        const filename = `${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.png`;
        const publicPath = path.join(process.cwd(), 'public', 'images', filename);
        const imageUrl = `/images/${filename}`;

        // Ensure the public/images directory exists
        const publicImagesDir = path.join(process.cwd(), 'public', 'images');
        await fs.mkdir(publicImagesDir, { recursive: true });

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
                        ${quiz.template.css || ''}

                        /* Quiz template styles */
                        .quiz-template {
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            padding: 3rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="quiz-template">
                        ${processedHtml}
                    </div>
                </body>
            </html>
        `;

        try {
            // Launch browser for screenshot
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            // Create page and take screenshot
            const page = await browser.newPage();
            await page.setViewport({ width: 1080, height: 1080 });
            await page.setContent(completeHtml, { waitUntil: 'networkidle0' });
            await page.screenshot({
                path: publicPath,
                type: 'png',
                clip: { x: 0, y: 0, width: 1080, height: 1080 }
            });

            // Close browser
            await browser.close();

            return imageUrl;
        } catch (error) {
            console.error('❌ ImageGenerationService: Error taking screenshot:', error);
            throw error;
        }
    }
} 