import { prisma } from "@/lib/prisma";
import { ApiResponseService } from "@/services/api/base/ApiResponseService";
import { TemplateProcessingService } from "@/services/api/template/TemplateProcessingService";
import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const apiResponse = ApiResponseService.getInstance();

    // Properly await and unwrap the params in Next.js 15
    const params = await context.params;
    const id = params.id;

    try {
        console.log('Generate image API called for template:', id);

        // Get the template
        const template = await prisma.template.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                html: true,
                css: true,
                variables: true,
                quizType: true
            }
        });

        if (!template) {
            console.error('Template not found:', id);
            return apiResponse.notFound('Template not found');
        }

        // Process HTML to replace variable placeholders with values
        const templateProcessor = TemplateProcessingService.getInstance();
        let processedHtml = template.html;
        if (template.variables) {
            processedHtml = templateProcessor.processTemplate(
                template.html,
                template.variables as Record<string, string | number | boolean | string[] | Record<string, unknown>>
            );
        }

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

            /* Template container */
            .template-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              padding: 3rem;
            }
          </style>
        </head>
        <body>
          <div class="template-container">
            ${processedHtml}
          </div>
        </body>
      </html>
    `;

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const quizType = template.quizType || 'template';
        const filename = `templates/template-${template.id}-${quizType}-${timestamp}.png`;

        // Save the HTML to debug folder
        const debugDir = path.join(process.cwd(), 'debug', 'templates');
        await fs.mkdir(debugDir, { recursive: true });
        const htmlFilename = `template-${template.id}-${timestamp}.html`;
        const htmlPath = path.join(debugDir, htmlFilename);
        await fs.writeFile(htmlPath, completeHtml);

        // Generate the image using Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set viewport with higher device scale factor for better quality
        await page.setViewport({
            width: 1080,
            height: 1080,
            deviceScaleFactor: 2
        });

        // Set content with proper wait conditions
        await page.setContent(completeHtml, {
            waitUntil: ['domcontentloaded', 'networkidle0']
        });

        // Wait for fonts to load
        await page.evaluate(async () => {
            await document.fonts.ready;
        });

        // Take the screenshot
        const imageBuffer = await page.screenshot({
            type: 'png',
            fullPage: false,
            encoding: 'binary',
            clip: {
                x: 0,
                y: 0,
                width: 1080,
                height: 1080
            }
        });

        await browser.close();

        // Ensure the public/images/templates directory exists
        const publicImagesDir = path.join(process.cwd(), 'public', 'images', 'templates');
        await fs.mkdir(publicImagesDir, { recursive: true });

        // Extract just the filename from the path
        const filenameParts = filename.split('/');
        const filenameOnly = filenameParts[filenameParts.length - 1];

        // Save the image
        const publicImagePath = path.join(publicImagesDir, filenameOnly);
        await fs.writeFile(publicImagePath, imageBuffer);

        // Construct the image URL
        const imageUrl = `/images/templates/${filenameOnly}`;

        // Update the template with the new image URL
        const updatedTemplate = await prisma.template.update({
            where: { id: template.id },
            data: {
                previewImageUrl: imageUrl
            },
            select: {
                id: true,
                name: true,
                previewImageUrl: true,
                imageUrl: true
            }
        });

        console.log('Template image generated successfully:', imageUrl);

        return apiResponse.success(updatedTemplate);
    } catch (error) {
        console.error('Error generating template image:', error);
        return apiResponse.errorFromException(error, `template/${id}/generate-image`);
    }
}