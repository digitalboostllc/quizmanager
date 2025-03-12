/**
 * Test script to generate an image for a quiz
 * Usage: npx ts-node scripts/generate-image.ts <quizId>
 */

import { ImageGenerationService } from "../src/services/api/quiz/ImageGenerationService";

async function main() {
    // Get quiz ID from command line arguments
    const quizId = process.argv[2];

    if (!quizId) {
        console.error('Error: Quiz ID is required');
        console.log('Usage: npx ts-node scripts/generate-image.ts <quizId>');
        process.exit(1);
    }

    try {
        console.log(`Generating image for quiz ${quizId}...`);

        // Use the image generation service
        const imageService = ImageGenerationService.getInstance();
        const result = await imageService.generateQuizImage(quizId);

        console.log('Image generated successfully:');
        console.log(result);
    } catch (error) {
        console.error('Error generating image:', error);
        process.exit(1);
    }
}

main().catch(console.error); 