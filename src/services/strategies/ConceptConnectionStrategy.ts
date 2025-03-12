import { LANGUAGE_CONFIG, QUIZ_CONFIG } from '@/lib/config';
import { Language } from '@/lib/types';
import { GenerationContext, GenerationResult } from '../generation/pipeline/GenerationPipeline';
import { BaseQuizStrategy } from './BaseQuizStrategy';

export class ConceptConnectionStrategy extends BaseQuizStrategy {
  protected getQuizTypeDescription(): string {
    return 'concept connection puzzle';
  }

  protected getQuizType(): string {
    return 'CONCEPT_CONNECTION';
  }

  async generateContent(context: GenerationContext): Promise<GenerationResult> {
    try {
      console.log('🧩 Generating concept connection...');

      // Generate concepts
      const conceptsResponse = await this.generateOpenAIResponse(
        `Generate exactly ${QUIZ_CONFIG.CONCEPT_CONNECTION.CONCEPTS_COUNT} related words or concepts in ${LANGUAGE_CONFIG[context.language].name} that:
        - Belong to the same category or theme
        - Are clearly related but not too obvious
        - Are of similar difficulty level
        - Each word should be a single word in CAPITAL LETTERS
        - No proper nouns or abbreviations
        - Must be common words that native speakers know
        - Must be appropriate for the language and culture
        
        Return ONLY the HTML structure below:
        <div class="concept-card"><span class="concept-text">WORD1</span></div>
        <div class="concept-card"><span class="concept-text">WORD2</span></div>
        <div class="concept-card"><span class="concept-text">WORD3</span></div>
        <div class="concept-card"><span class="concept-text">WORD4</span></div>`,
        context.content || 'Generate related concepts',
        {
          maxTokens: 200,
          temperature: 0.8
        }
      );

      console.log('✅ Generated concepts HTML:', conceptsResponse);

      // Extract concepts for validation
      const conceptMatches = conceptsResponse.match(/<span class="concept-text">(.*?)<\/span>/g);
      if (!conceptMatches || conceptMatches.length !== QUIZ_CONFIG.CONCEPT_CONNECTION.CONCEPTS_COUNT) {
        console.error('❌ Invalid number of concepts generated');
        return {
          content: '',
          error: 'Invalid number of concepts generated'
        };
      }

      // Extract and normalize concepts
      const concepts = conceptMatches.map(match => {
        return match.replace(/<span class="concept-text">|<\/span>/g, '').trim();
      });

      console.log('📊 Extracted concepts:', concepts);

      // Validate unique concepts
      const uniqueConcepts = new Set(concepts);
      if (uniqueConcepts.size !== QUIZ_CONFIG.CONCEPT_CONNECTION.CONCEPTS_COUNT) {
        console.error('❌ Duplicate concepts detected');
        return {
          content: '',
          error: 'Duplicate concepts detected'
        };
      }

      // Validate each concept
      for (const concept of concepts) {
        const isValid = await this.validateContent(concept, context.language);
        if (!isValid) {
          console.error(`❌ Invalid concept for language ${context.language}:`, concept);
          return {
            content: '',
            error: `Invalid concept for language ${context.language}: ${concept}`
          };
        }
      }

      // Generate theme/connection
      const theme = await this.generateOpenAIResponse(
        `You are an expert at identifying connections and themes between concepts.
        Current language: ${LANGUAGE_CONFIG[context.language].name}
        Task: Identify the strongest thematic connection between these concepts: ${concepts.join(', ')}
        
        Rules:
        - Return ONLY the theme/connection word or short phrase
        - Must be in ${LANGUAGE_CONFIG[context.language].name}
        - Be specific but concise
        - No explanations or additional text`,
        'What is the common theme?',
        {
          maxTokens: 50,
          temperature: 0.5
        }
      );

      console.log('✅ Generated theme:', theme);

      return {
        content: '',
        variables: {
          conceptsGrid: conceptsResponse
        },
        answer: theme,
        metadata: { theme }
      };
    } catch (err) {
      console.error('❌ Error generating concept connection:', err);
      return {
        content: '',
        error: err instanceof Error ? err.message : 'Failed to generate concept connection'
      };
    }
  }

  async validateContent(content: string, language: Language): Promise<boolean> {
    // Check if content is a single word
    const words = content.trim().split(/\s+/);
    if (words.length !== 1) {
      return false;
    }

    // Check if content matches language character set
    const langConfig = LANGUAGE_CONFIG[language];
    return langConfig.characterSet.test(content);
  }

  // Override solution generation for concept connection format
  async generateSolution(context: GenerationContext & { answer: string }): Promise<GenerationResult> {
    try {
      const solution = await this.generateOpenAIResponse(
        `Generate a clear explanation in ${LANGUAGE_CONFIG[context.language].name} of how these concepts are connected.
        The connecting theme is "${context.answer}".
        
        Format your response in these sections:
        1. Connection: Briefly state the connection
        2. Explanation: Explain how each concept relates to the theme
        3. Examples: Give 1-2 other examples that would fit this theme`,
        `Explain how concepts are connected by "${context.answer}"`,
        {
          maxTokens: 300,
          temperature: 0.7
        }
      );

      // Clean up the solution if needed
      const cleanedSolution = solution
        .replace(/^(Hi|Hello|Greetings|Sure|Let me|I'll|Here's|Here is).*?,\s*/i, '')
        .replace(/^(I will|I can|I would|I am|I'm) (going to |happy to |here to |able to )?(help|explain|show|assist|guide)/i, '')
        .replace(/\b(hope this helps|let me know|feel free|don't hesitate|is there anything else)\b.*?$/i, '')
        .trim();

      return { content: cleanedSolution };
    } catch (err) {
      console.error('Error generating solution:', err);
      // Fall back to the base implementation if our custom solution fails
      return super.generateSolution(context);
    }
  }
} 