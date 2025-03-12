import { IMAGE_SETTINGS } from "./config";

interface GenerateImageOptions {
  width?: number;
  height?: number;
  filename?: string;
}

export async function generateImage(
  input: HTMLElement | string,
  options: Partial<GenerateImageOptions> = {}
): Promise<string> {
  const {
    width = IMAGE_SETTINGS.DEFAULT_WIDTH,
    height = IMAGE_SETTINGS.DEFAULT_HEIGHT,
  } = options;

  try {
    // Determine the HTML content based on input type
    let htmlContent: string;
    if (input instanceof HTMLElement) {
      // Clone the element to avoid modifying the original DOM
      const clonedElement = input.cloneNode(true) as HTMLElement;

      // Remove any potentially conflicting attributes
      clonedElement.removeAttribute('style');
      clonedElement.classList.add('quiz-capture-container');

      // If input is an HTMLElement, first check if it has quiz content
      const previewContainer = clonedElement.querySelector('.preview-container');

      if (previewContainer) {
        // Wrap the content in a proper container for styling
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'quiz-template';
        contentWrapper.innerHTML = previewContainer.innerHTML;
        htmlContent = contentWrapper.outerHTML;
      } else {
        // Just use the element as is
        htmlContent = clonedElement.outerHTML;
      }
    } else {
      // If input is a string, use it directly
      htmlContent = input;
    }

    // Log the HTML content for debugging
    console.log('Sending HTML content for image generation:', {
      contentLength: htmlContent.length,
      previewStart: htmlContent.substring(0, 100) + '...',
      previewEnd: '...' + htmlContent.substring(htmlContent.length - 100),
      usingQuizTemplate: htmlContent.includes('quiz-template')
    });

    // Generate a filename based on timestamp if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.filename || `quiz-${timestamp}.png`;

    // Call the server-side API
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        htmlContent,
        filename,
        width,
        height,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate image');
    }

    // Get the image URL from the response
    const { imageUrl } = await response.json();
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

export async function downloadGeneratedImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
} 