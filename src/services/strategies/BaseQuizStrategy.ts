import { API_CONFIG, LANGUAGE_CONFIG } from '@/lib/config';
import openai from '@/lib/openai';
import { Language } from '@/lib/types';
import { GenerationContext, GenerationResult } from '../generation/pipeline/GenerationPipeline';
import { QuizGenerationStrategy } from './QuizGenerationStrategy';

export abstract class BaseQuizStrategy implements QuizGenerationStrategy {
  protected async generateOpenAIResponse(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    options = {
      temperature: API_CONFIG.OPENAI.DEFAULT_TEMPERATURE,
      model: API_CONFIG.OPENAI.DEFAULT_MODEL,
      maxTokens: options.maxTokens || API_CONFIG.OPENAI.MAX_TOKENS
    };

    try {
      console.log('📝 System prompt:', systemPrompt);
      console.log('👤 User prompt:', userPrompt);

      try {
        const completion = await openai.chat.completions.create({
          model: options.model || API_CONFIG.OPENAI.DEFAULT_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          max_tokens: options.maxTokens || API_CONFIG.OPENAI.MAX_TOKENS,
          temperature: options.temperature || API_CONFIG.OPENAI.DEFAULT_TEMPERATURE,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("OpenAI returned empty content");
        }

        return content.trim();
      } catch (error: any) {
        // Check for geographical restriction or OpenAI unavailability
        if (error?.code === 'unsupported_country_region_territory' ||
          error?.message?.includes('Country, region, or territory not supported')) {
          console.warn('⚠️ OpenAI not available in your region. Using fallback content generation.');
          return this.generateFallbackContent(systemPrompt, userPrompt);
        }

        // Re-throw other errors
        console.error('❌ Error generating OpenAI response:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error generating OpenAI response:', error);
      throw error;
    }
  }

  /**
   * Generate fallback content when OpenAI is unavailable
   */
  protected generateFallbackContent(systemPrompt: string, userPrompt: string): string {
    // Extract the purpose of the prompt to generate appropriate fallback content
    const lowerSystemPrompt = systemPrompt.toLowerCase();
    const lowerUserPrompt = userPrompt.toLowerCase();

    // For titles
    if (lowerSystemPrompt.includes('title') || lowerUserPrompt.includes('title')) {
      return this.getFallbackTitle();
    }

    // For hints
    if (lowerSystemPrompt.includes('hint') || lowerUserPrompt.includes('hint')) {
      return "Look carefully at the pattern to solve this puzzle.";
    }

    // For subtitle
    if (lowerSystemPrompt.includes('subtitle') || lowerUserPrompt.includes('subtitle')) {
      return "Test your skills with this challenge!";
    }

    // For branding text
    if (lowerSystemPrompt.includes('branding') || lowerUserPrompt.includes('branding')) {
      return "Powered by FB Quiz";
    }

    // For solution
    if (lowerSystemPrompt.includes('solution') || lowerUserPrompt.includes('solution')) {
      return "The solution requires careful analysis of the pattern.";
    }

    // Default fallback
    return "Generated content";
  }

  /**
   * Get a fallback title based on quiz type
   */
  protected getFallbackTitle(): string {
    const quizDescriptions = {
      'WORDLE': [
        "Word Puzzle Quiz",
        "Word Challenge",
        "Mystery Word Quiz",
        "Word Discovery",
        "Hidden Word Quiz"
      ],
      'NUMBER_SEQUENCE': [
        "Number Pattern Quiz",
        "Sequence Challenge",
        "Number Sequence",
        "Pattern Discovery",
        "Number Logic Quiz"
      ],
      'RHYME_TIME': [
        "Rhyming Words Quiz",
        "Rhyme Challenge",
        "Word Pairs Quiz",
        "Rhyme Match",
        "Word Rhymes Quiz"
      ],
      'CONCEPT_CONNECTION': [
        "Concept Links Quiz",
        "Connection Challenge",
        "Common Thread Quiz",
        "Concept Relationships",
        "Theme Discovery Quiz"
      ]
    };

    // Get titles for this quiz type, or use default if type not found
    const titles = quizDescriptions[this.getQuizType() as keyof typeof quizDescriptions] ||
      ["Quiz Challenge", "Skills Test", "Brain Teaser", "Mind Challenge", "Problem Solving Quiz"];

    // Pick a random title and remove any quotes
    return titles[Math.floor(Math.random() * titles.length)].replace(/["']/g, '');
  }

  protected cleanSolutionContent(content: string): string {
    return content
      .replace(/^(Hi|Hello|Greetings|Sure|Let me|I'll|Here's|Here is).*?,\s*/i, '')
      .replace(/^(I will|I can|I would|I am|I'm) (going to |happy to |here to |able to )?(help|explain|show|assist|guide)/i, '')
      .replace(/\b(hope this helps|let me know|feel free|don't hesitate|is there anything else)\b.*?$/i, '')
      .trim();
  }

  async generateTitle(context: GenerationContext): Promise<GenerationResult> {
    const content = await this.generateOpenAIResponse(
      `Create a catchy title in ${LANGUAGE_CONFIG[context.language].name} that:
      - Should be a simple statement, not a question
      - Should be about ${this.getQuizTypeDescription()}
      - Must be engaging and concise
      - Should be 2-5 words long
      - Should NOT contain any quotation marks
      - Should NOT include the words "Can you" or "What is"
      - Should end with "Quiz" or "Challenge"`,
      context.content || 'Generate an engaging quiz title'
    );

    // Remove any quotation marks and ensure no question format
    const cleanedContent = content
      .replace(/["']/g, '')
      .replace(/\?$/, '')
      .trim();

    return { content: cleanedContent };
  }

  async generateSubtitle(context: GenerationContext): Promise<GenerationResult> {
    const content = await this.generateOpenAIResponse(
      `Create a short subtitle in ${LANGUAGE_CONFIG[context.language].name} that:
      - Explains the ${this.getQuizTypeDescription()} challenge
      - Is clear and concise
      - Is a single sentence
      - Does NOT contain any quotation marks
      - Should NOT be a question`,
      context.content || 'Generate a subtitle'
    );

    // Remove any quotation marks
    const cleanedContent = content
      .replace(/["']/g, '')
      .replace(/\?$/, '')
      .trim();

    return { content: cleanedContent };
  }

  async generateBrandingText(context: GenerationContext): Promise<GenerationResult> {
    const content = await this.generateOpenAIResponse(
      `Create a short branding text in ${LANGUAGE_CONFIG[context.language].name} that:
      - Emphasizes ${this.getQuizTypeDescription()}
      - Is catchy and memorable
      - Is 2-4 words long`,
      context.content || 'Generate branding text'
    );

    return { content };
  }

  async generateHint(context: GenerationContext): Promise<GenerationResult> {
    const content = await this.generateOpenAIResponse(
      `Create a sophisticated hint in ${LANGUAGE_CONFIG[context.language].name} that:
      - Must be subtle and require analytical thinking
      - Should provide indirect clues that reward careful analysis
      - Must avoid obvious giveaways
      - Is a single elegant sentence
      - Uses appropriate punctuation`,
      context.content || 'Generate a hint'
    );

    return { content };
  }

  async generateSolution(context: GenerationContext & { answer: string }): Promise<GenerationResult> {
    const content = this.cleanSolutionContent(
      await this.generateOpenAIResponse(
        `Generate a clear explanation in ${LANGUAGE_CONFIG[context.language].name} of how to solve this ${this.getQuizTypeDescription()} quiz. The answer is "${context.answer}".`,
        context.content || `Explain the solution for "${context.answer}"`
      )
    );

    return { content };
  }

  // Abstract methods that must be implemented by specific strategies
  abstract generateContent(context: GenerationContext): Promise<GenerationResult>;
  abstract validateContent(content: string, language: Language): Promise<boolean>;
  protected abstract getQuizTypeDescription(): string;

  /**
   * Get the quiz type for this strategy
   */
  protected getQuizType(): string {
    // Default implementation returns 'GENERIC'
    // Child classes should override this to return their specific type
    return 'GENERIC';
  }
} 