import { API_CONFIG, LANGUAGE_CONFIG } from '@/lib/config';
import openai from '@/lib/openai';
import type { Language } from '@/lib/types';
import { QuizGeneratorFactory } from '@/services/QuizGeneratorFactory';
import { QuizType } from '@prisma/client';
import { BaseApiService } from '../base/BaseApiService';
import { QuizGenerationError } from '../errors/ApiError';
import type { ApiResponse } from '../types';

export interface GenerationContext {
  templateId: string;
  language: Language;
  content: string;
  quizType: QuizType;
  options: {
    field?: string;
    wordOnly?: boolean;
    generateGrid?: boolean;
    answer?: string;
  };
}

export interface GenerationStrategyResult {
  content?: string;
  answer?: string;
  error?: string;
  metadata?: Record<string, string>;
  variables?: Record<string, string | number | boolean | string[] | Record<string, unknown>>;
}

export interface QuizVariables {
  wordGrid?: string;
  theme?: string;
  correctHint?: string;
  misplacedHint?: string;
  wrongHint?: string;
  [key: string]: string | number | boolean | string[] | Record<string, unknown> | undefined;
}

export interface QuizGenerationOptions {
  field: string;
  context: string;
  templateType: string;
  language: Language;
  wordOnly?: boolean;
}

export interface CompleteQuizGenerationOptions {
  templateId: string;
  quizType: QuizType;
  language: Language;
  content?: string;
  options?: {
    checkOnly?: boolean;
    includeImage?: boolean;
  };
}

export interface QuizGenerationResult {
  content?: string;
  answer?: string;
  theme?: string;
}

export interface CompleteQuizGenerationResult {
  title: string;
  subtitle: string;
  brandingText: string;
  hint: string;
  answer: string;
  solution: string;
  variables: QuizVariables;
}

export class QuizGenerationService extends BaseApiService {
  private static instance: QuizGenerationService;
  private factory: QuizGeneratorFactory;

  private constructor() {
    super();
    this.factory = QuizGeneratorFactory.getInstance();
  }

  protected validateEnvironment(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new QuizGenerationError('OpenAI API key is not configured');
    }
  }

  public static getInstance(): QuizGenerationService {
    if (!QuizGenerationService.instance) {
      QuizGenerationService.instance = new QuizGenerationService();
    }
    return QuizGenerationService.instance;
  }

  public async generateCompleteQuiz(options: CompleteQuizGenerationOptions): Promise<ApiResponse<CompleteQuizGenerationResult>> {
    return this.handleRequest(
      async () => {
        const { templateId, quizType, language, content } = options;

        try {
          const strategy = this.factory.getStrategy(quizType);
          console.log('📝 Using strategy for quiz type:', quizType);

          // Generate title
          console.log('🏷️ Generating title...');
          const titleResult = await strategy.generateTitle({
            templateId,
            language,
            content: `Generate a title for ${quizType.toLowerCase()} quiz`,
            quizType,
            options: {}
          } as GenerationContext);
          console.log('✅ Title generated:', titleResult.content);

          // Generate subtitle
          console.log('📋 Generating subtitle...');
          const subtitleResult = await strategy.generateSubtitle({
            templateId,
            language,
            content: `Generate a subtitle for ${quizType.toLowerCase()} quiz`,
            quizType,
            options: {}
          } as GenerationContext);
          console.log('✅ Subtitle generated:', subtitleResult.content);

          // Generate branding text
          console.log('🎨 Generating branding text...');
          const brandingResult = await strategy.generateBrandingText({
            templateId,
            language,
            content: `Generate branding text for ${quizType.toLowerCase()} quiz`,
            quizType,
            options: {}
          } as GenerationContext);
          console.log('✅ Branding text generated:', brandingResult.content);

          // Generate quiz content
          console.log('🎲 Generating quiz content...');
          const contentResult = await strategy.generateContent({
            templateId,
            language,
            quizType,
            content: content || '',
            options: {
              generateGrid: true
            }
          } as GenerationContext);

          if (!contentResult.answer) {
            throw new Error('Failed to generate quiz content');
          }
          console.log('✅ Quiz content generated:', {
            hasContent: !!contentResult.content,
            answer: contentResult.answer,
            contentLength: contentResult.content?.length || 0,
            hasVariables: !!contentResult.variables
          });

          // Generate hint
          console.log('💡 Generating hint...');
          const hintResult = await strategy.generateHint({
            templateId,
            language,
            content: contentResult.answer,
            quizType,
            options: {
              field: 'hint'
            }
          } as GenerationContext);
          console.log('✅ Hint generated:', hintResult.content);

          // Generate solution
          console.log('🔍 Generating solution...');

          // For NUMBER_SEQUENCE, we need to use a more specific solution format
          // that includes mathematical formulas and explanations
          let solutionContent = '';

          if (quizType === 'NUMBER_SEQUENCE') {
            console.log('📊 Using special mathematical solution format for NUMBER_SEQUENCE');

            // Extract sequence data if available
            let sequence: number[] = [];
            let sequenceType = '';

            // Get sequence type from metadata
            if (contentResult.metadata && contentResult.metadata.sequenceType) {
              sequenceType = contentResult.metadata.sequenceType;
            }

            // Try to generate a mathematical explanation based on the sequence pattern
            try {
              // For NUMBER_SEQUENCE quizzes
              switch (sequenceType) {
                case 'arithmetic': {
                  // Parse the sequence from contentResult if available
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    const difference = sequence[1] - sequence[0];
                    const formula = `a_n = a_1 + (n-1)d where d = ${difference}`;

                    let explanation = '';
                    if (difference > 0) {
                      explanation = `This is an arithmetic sequence where each number increases by ${difference}. To find the next number, add ${difference} to the last number (${sequence[sequence.length - 1]} + ${difference} = ${contentResult.answer}).`;
                    } else {
                      explanation = `This is an arithmetic sequence where each number decreases by ${Math.abs(difference)}. To find the next number, subtract ${Math.abs(difference)} from the last number (${sequence[sequence.length - 1]} ${difference} = ${contentResult.answer}).`;
                    }

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'geometric': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    const ratio = sequence[1] / sequence[0];
                    const ratioFormatted = Number.isInteger(ratio) ? ratio : ratio.toFixed(2);
                    const formula = `a_n = a_1 × r^(n-1) where r = ${ratioFormatted}`;

                    const explanation = `This is a geometric sequence where each number is multiplied by ${ratioFormatted} to get the next number. To find the next number, multiply the last number by ${ratioFormatted} (${sequence[sequence.length - 1]} × ${ratioFormatted} = ${contentResult.answer}).`;

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'fibonacci': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    const formula = `a_n = a_(n-1) + a_(n-2) for n ≥ 3`;

                    const explanation = `This is a Fibonacci-like sequence where each number is the sum of the two previous numbers. To find the next number, add the last two numbers (${sequence[sequence.length - 2]} + ${sequence[sequence.length - 1]} = ${contentResult.answer}).`;

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'quadratic': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    // Calculate first and second differences to explain pattern
                    const firstDiffs = sequence.slice(1).map((num, i) => num - sequence[i]);
                    const secondDiffs = firstDiffs.slice(1).map((num, i) => num - firstDiffs[i]);
                    const commonSecondDiff = secondDiffs[0];

                    const formula = `a_n follows a quadratic pattern: a_n = an² + bn + c`;

                    const explanation = `This sequence follows a quadratic pattern where each term is related to the square of its position. The first differences between consecutive terms (${firstDiffs.join(', ')}) increase by a constant value of ${commonSecondDiff}, revealing the quadratic nature. The next number in the sequence is ${contentResult.answer}.`;

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'alternating': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    // Identify the alternating pattern
                    let pattern = '';
                    let formula = '';
                    if (sequence.length >= 4) {
                      const diff1 = sequence[1] - sequence[0];
                      const diff2 = sequence[2] - sequence[1];
                      const diff3 = sequence[3] - sequence[2];

                      if (diff1 === diff3) {
                        pattern = `alternating between +${diff1} and +${diff2}`;
                        formula = `a_n = a_(n-2) + d_i where d_i alternates between ${diff1} and ${diff2}`;
                      } else if (sequence[1] / sequence[0] === sequence[3] / sequence[2]) {
                        const ratio1 = sequence[1] / sequence[0];
                        const ratio2 = sequence[2] / sequence[1];
                        pattern = `alternating between *${ratio1.toFixed(2)} and *${ratio2.toFixed(2)}`;
                        formula = `a_n = a_(n-2) × r_i where r_i alternates between ${ratio1.toFixed(2)} and ${ratio2.toFixed(2)}`;
                      } else {
                        // General alternating
                        pattern = `alternating operations`;
                        formula = `a_n follows an alternating pattern`;
                      }
                    }

                    const explanation = `This sequence follows an alternating pattern, ${pattern}. By identifying this pattern and applying it to the last numbers, we can determine that the next number is ${contentResult.answer}.`;

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'powers': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    // Try to identify the power pattern
                    let formula = '';
                    let explanation = '';
                    let patternIdentified = false;

                    // Check if it's powers of a constant
                    for (let base = 2; base <= 5; base++) {
                      let isPowersOfBase = true;
                      for (let i = 0; i < Math.min(3, sequence.length); i++) {
                        if (Math.abs(sequence[i] - Math.pow(base, i + 1)) > 0.001) {
                          isPowersOfBase = false;
                          break;
                        }
                      }

                      if (isPowersOfBase) {
                        formula = `a_n = ${base}^n`;
                        explanation = `This sequence consists of powers of ${base} (${base}¹, ${base}², ${base}³, etc.). The next number would be ${base}^${sequence.length + 1} = ${Math.pow(base, sequence.length + 1)}, which is ${contentResult.answer}.`;
                        patternIdentified = true;
                        break;
                      }
                    }

                    // Check if it's nth powers
                    if (!patternIdentified) {
                      for (let power = 2; power <= 3; power++) {
                        let isNthPowers = true;
                        for (let i = 0; i < Math.min(3, sequence.length); i++) {
                          if (Math.abs(sequence[i] - Math.pow(i + 1, power)) > 0.001) {
                            isNthPowers = false;
                            break;
                          }
                        }

                        if (isNthPowers) {
                          formula = `a_n = n^${power}`;
                          explanation = `This sequence consists of consecutive numbers raised to the power of ${power} (1^${power}, 2^${power}, 3^${power}, etc.). The next number would be ${sequence.length + 1}^${power} = ${Math.pow(sequence.length + 1, power)}, which is ${contentResult.answer}.`;
                          patternIdentified = true;
                          break;
                        }
                      }
                    }

                    // Fallback
                    if (!patternIdentified) {
                      formula = `a_n follows a pattern involving exponents`;
                      explanation = `This sequence follows a pattern involving powers or exponents. By continuing this pattern, the next number in the sequence is ${contentResult.answer}.`;
                    }

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'square_numbers': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    const formula = `a_n = n²`;

                    // Calculate which square number comes next
                    const nextPosition = Math.round(Math.sqrt(sequence[sequence.length - 1])) + 1;
                    const explanation = `This sequence consists of square numbers (1², 2², 3², 4², 5², etc.). The next number would be ${nextPosition}² = ${nextPosition * nextPosition}, which is ${contentResult.answer}.`;

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
                case 'prime_numbers': {
                  // Extract sequence as above
                  if (contentResult.variables && contentResult.variables.sequence) {
                    const sequenceHtml = contentResult.variables.sequence as string;
                    const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
                    if (matches) {
                      sequence = matches.map(match => {
                        const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
                        return parseInt(num, 10);
                      });
                    }
                  }

                  if (sequence.length > 0) {
                    const formula = `a_n = nth prime number`;

                    const explanation = `This sequence consists of prime numbers (numbers divisible only by 1 and themselves). By continuing this pattern, the next prime number after ${sequence[sequence.length - 1]} is ${contentResult.answer}.`;

                    solutionContent = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${contentResult.answer}
`;
                  }
                  break;
                }
              }
            } catch (err) {
              console.error('Error generating mathematical solution:', err);
            }
          }

          // Special handling for RHYME_TIME quizzes
          if (quizType === 'RHYME_TIME' && contentResult.answer) {
            console.log('🎵 Using special rhyming solution format for RHYME_TIME');

            try {
              // Parse the answer to get both rhyming words
              const [firstWord, secondWord] = contentResult.answer.split('-');

              if (firstWord && secondWord) {
                // Generate additional rhyming words
                let additionalRhymes = '';
                try {
                  const completion = await openai.chat.completions.create({
                    model: API_CONFIG.OPENAI.DEFAULT_MODEL,
                    messages: [
                      {
                        role: "system",
                        content: `Generate 3-5 common words in ${LANGUAGE_CONFIG[language].name} that rhyme with "${firstWord}".
                        
                        Rules:
                        - Return the words as a simple comma-separated list
                        - No explanations or additional text
                        - Only include words, no punctuation other than commas
                        - Must be appropriate for all audiences`
                      },
                      {
                        role: "user",
                        content: `Generate words that rhyme with ${firstWord}`
                      }
                    ],
                    max_tokens: 50,
                    temperature: 0.7,
                  });

                  additionalRhymes = completion.choices[0]?.message?.content || '';
                } catch (err) {
                  console.error('Error generating additional rhymes:', err);
                  additionalRhymes = 'Unable to generate additional rhyming examples.';
                }

                solutionContent = `
## Rhyming Pair

The correct rhyming pair is: **${firstWord}** and **${secondWord}**

## Explanation

These words share the same ending sound pattern, creating a perfect rhyme. The challenge is to recognize this phonetic similarity and identify the missing word in the pair.

## Examples of Similar Rhymes

Other words that rhyme with this pair include:
${additionalRhymes}
`;
              }
            } catch (err) {
              console.error('Error generating rhyming solution:', err);
            }
          }

          // Special handling for CONCEPT_CONNECTION quizzes
          if (quizType === 'CONCEPT_CONNECTION' && contentResult.answer) {
            console.log('🧩 Using special concept solution format for CONCEPT_CONNECTION');

            try {
              // Get the concepts from the generated content
              let concepts: string[] = [];

              if (contentResult.variables && contentResult.variables.conceptsGrid) {
                const conceptsGrid = contentResult.variables.conceptsGrid as string;
                const conceptMatches = conceptsGrid.match(/<span class="concept-text">(.*?)<\/span>/g);

                if (conceptMatches) {
                  concepts = conceptMatches.map(match => {
                    return match.replace(/<span class="concept-text">|<\/span>/g, '').trim();
                  });
                  console.log('📊 Extracted concepts for solution:', concepts);
                }
              }

              if (concepts.length > 0) {
                // Generate a detailed solution explanation
                try {
                  const completion = await openai.chat.completions.create({
                    model: API_CONFIG.OPENAI.DEFAULT_MODEL,
                    messages: [
                      {
                        role: "system",
                        content: `Generate a clear explanation in ${LANGUAGE_CONFIG[language].name} of how these concepts are connected.
                        The concepts are: ${concepts.join(', ')}
                        The connecting theme is "${contentResult.answer}".
                        
                        Format your response in these sections:
                        1. Connection: Briefly state the connection
                        2. Explanation: Explain how each concept relates to the theme
                        3. Examples: Give 1-2 other examples that would fit this theme`
                      },
                      {
                        role: "user",
                        content: `Explain how concepts are connected by "${contentResult.answer}"`
                      }
                    ],
                    max_tokens: 400,
                    temperature: 0.7,
                  });

                  const solution = completion.choices[0]?.message?.content || '';

                  // Clean up the solution
                  solutionContent = solution
                    .replace(/^(Hi|Hello|Greetings|Sure|Let me|I'll|Here's|Here is).*?,\s*/i, '')
                    .replace(/^(I will|I can|I would|I am|I'm) (going to |happy to |here to |able to )?(help|explain|show|assist|guide)/i, '')
                    .replace(/\b(hope this helps|let me know|feel free|don't hesitate|is there anything else)\b.*?$/i, '')
                    .trim();
                } catch (err) {
                  console.error('Error generating concept solution:', err);
                  // Fallback solution if generation fails
                  solutionContent = `
## Connection

The connecting theme between these concepts is: **${contentResult.answer}**

## Explanation

Each of these concepts (${concepts.join(', ')}) is related to ${contentResult.answer} in different ways. They represent different aspects or examples of this theme.

## Examples

Other concepts that would fit this theme include variants or related terms in the same domain.
`;
                }
              }
            } catch (err) {
              console.error('Error handling concept connection solution:', err);
            }
          }

          // If we couldn't generate a mathematical solution, fall back to the standard method
          if (!solutionContent) {
            const solutionResult = await strategy.generateSolution({
              templateId,
              language,
              content: contentResult.answer,
              quizType,
              answer: contentResult.answer,
              options: {
                field: 'solution',
                metadata: contentResult.metadata,
                variables: contentResult.variables
              }
            } as GenerationContext & { answer: string });
            solutionContent = solutionResult.content || '';
          }

          console.log('✅ Solution generated', solutionContent ? 'successfully' : 'with fallback method');

          // Logging to check for color hint translations
          if (contentResult.variables) {
            console.log('📝 Language-specific variables:', {
              hasCorrectHint: !!contentResult.variables.correctHint,
              hasMisplacedHint: !!contentResult.variables.misplacedHint,
              hasWrongHint: !!contentResult.variables.wrongHint,
              language
            });
          }

          return {
            title: titleResult.content || '',
            subtitle: subtitleResult.content || '',
            brandingText: brandingResult.content || '',
            hint: hintResult.content || '',
            answer: contentResult.answer,
            solution: solutionContent,
            variables: {
              wordGrid: contentResult.content,
              ...contentResult.metadata,
              ...contentResult.variables
            } as QuizVariables
          };
        } catch (error) {
          console.error('❌ Error in quiz generation:', error);
          throw error;
        }
      },
      'Failed to generate complete quiz'
    );
  }

  public async generateQuizContent(
    options: QuizGenerationOptions
  ): Promise<ApiResponse<QuizGenerationResult>> {
    return this.handleRequest(
      async () => {
        const { field, context, templateType, language, wordOnly } = options;

        // Normalize template type for consistent comparison
        const normalizedTemplateType = templateType.toUpperCase() as QuizType;

        // Get the appropriate strategy
        const strategy = this.factory.getStrategy(normalizedTemplateType);

        // Create generation context
        const generationContext: GenerationContext = {
          templateId: templateType,
          language,
          content: context,
          quizType: normalizedTemplateType,
          options: {
            field,
            wordOnly
          }
        };

        let result: GenerationStrategyResult;

        // Handle different field types
        switch (field) {
          case 'title':
            result = await strategy.generateTitle(generationContext);
            break;
          case 'subtitle':
            result = await strategy.generateSubtitle(generationContext);
            break;
          case 'brandingText':
            result = await strategy.generateBrandingText(generationContext);
            break;
          case 'hint':
            result = await strategy.generateHint(generationContext);
            break;
          case 'solution': {
            if (!context.includes('answer:')) {
              throw new QuizGenerationError('Answer is required for solution generation');
            }
            const answerMatch = context.match(/answer:\s*"([^"]+)"/i);
            if (!answerMatch || !answerMatch[1]) {
              throw new QuizGenerationError('Could not extract answer from context');
            }
            const solutionContext: GenerationContext = {
              ...generationContext,
              content: `Explain the solution for "${answerMatch[1]}"`,
              options: {
                ...generationContext.options,
                answer: answerMatch[1]
              }
            };
            result = await strategy.generateSolution(solutionContext);
            break;
          }
          default:
            // For quiz-specific content (wordGrid, sequence, etc.)
            if (normalizedTemplateType === QuizType.WORDLE && field === 'wordGrid' && wordOnly) {
              // Special handling for word-only Wordle requests
              result = await strategy.generateContent(generationContext);
              if (result.error) {
                throw new QuizGenerationError(result.error);
              }
              return { answer: result.answer };
            } else {
              result = await strategy.generateContent(generationContext);
            }
        }

        if (result.error) {
          throw new QuizGenerationError(result.error);
        }

        const theme = result.metadata?.theme;
        return {
          content: result.content,
          answer: result.answer,
          ...(theme ? { theme } : {})
        };
      },
      'Failed to generate quiz content'
    );
  }
} 