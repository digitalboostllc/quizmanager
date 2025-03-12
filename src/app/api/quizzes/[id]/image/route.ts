import { ApiResponseService } from "@/services/api/base/ApiResponseService";
import { ImageGenerationService } from "@/services/api/quiz/ImageGenerationService";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const apiResponse = ApiResponseService.getInstance();

    try {
        console.log('Image generation API called for quiz:', params.id);

        // Use our centralized image generation service
        const imageService = ImageGenerationService.getInstance();
        const result = await imageService.generateQuizImage(params.id);

        return apiResponse.success(result);
    } catch (error) {
        return apiResponse.errorFromException(error, `quiz/${params.id}/image`);
    }
} 