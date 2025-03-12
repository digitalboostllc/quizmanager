import { GenerationContext, GenerationResult, ContentProcessor } from '../pipeline/GenerationPipeline';
import { QUIZ_CONFIG } from '@/lib/config';
import { ValidationError } from '@/services/api/errors/ApiError';
import { NumberFormatter } from '@/services/i18n/formatters/NumberFormatter';

interface PatternResult {
  nextNumber: number;
  pattern: string;
  description: string;
}

export class SequenceProcessor implements ContentProcessor {
  private numberFormatter: NumberFormatter;

  constructor() {
    this.numberFormatter = NumberFormatter.getInstance();
  }

  public async process(context: GenerationContext): Promise<GenerationResult> {
    // Parse and validate numbers
    const numbers = context.content
      .split(/[,;]/)
      .map(n => n.trim())
      .map(n => this.numberFormatter.parseNumber(n, context.language))
      .filter((n): n is number => n !== null);

    // Validate sequence length
    if (numbers.length !== QUIZ_CONFIG.NUMBER_SEQUENCE.SEQUENCE_LENGTH) {
      throw new ValidationError(
        `Sequence must have exactly ${QUIZ_CONFIG.NUMBER_SEQUENCE.SEQUENCE_LENGTH} numbers`
      );
    }

    // Detect pattern and calculate next number
    const pattern = this.detectSequencePattern(numbers);

    // Format numbers according to language
    const formattedNumbers = numbers.map(n => 
      this.numberFormatter.formatNumber(n, context.language)
    );

    // Create HTML structure
    const sequenceHtml = `
      <div class="sequence-container">
        <div class="sequence-numbers">
          ${formattedNumbers.join(' → ')}
        </div>
        <div class="sequence-hint">
          ${pattern.description}
        </div>
      </div>
    `;

    return {
      content: sequenceHtml,
      answer: this.numberFormatter.formatNumber(pattern.nextNumber, context.language),
      metadata: {
        pattern: pattern.pattern,
        description: pattern.description
      }
    };
  }

  private detectSequencePattern(numbers: number[]): PatternResult {
    if (numbers.length < 3) {
      throw new ValidationError('Sequence must have at least 3 numbers');
    }

    // Check arithmetic sequence (constant difference)
    const differences = numbers.slice(1).map((n, i) => n - numbers[i]);
    const isArithmetic = differences.every(d => Math.abs(d - differences[0]) < 0.0001);
    if (isArithmetic) {
      return {
        nextNumber: numbers[numbers.length - 1] + differences[0],
        pattern: 'arithmetic',
        description: `Add ${differences[0]} to each number`
      };
    }

    // Check geometric sequence (constant ratio)
    const ratios = numbers.slice(1).map((n, i) => n / numbers[i]);
    const isGeometric = ratios.every(r => Math.abs(r - ratios[0]) < 0.0001);
    if (isGeometric) {
      return {
        nextNumber: Math.round(numbers[numbers.length - 1] * ratios[0]),
        pattern: 'geometric',
        description: `Multiply each number by ${ratios[0]}`
      };
    }

    // Check Fibonacci-like sequence
    const isFibonacci = numbers.slice(2).every((n, i) => 
      Math.abs(n - (numbers[i] + numbers[i + 1])) < 0.0001
    );
    if (isFibonacci) {
      return {
        nextNumber: numbers[numbers.length - 1] + numbers[numbers.length - 2],
        pattern: 'fibonacci',
        description: 'Add the previous two numbers'
      };
    }

    // Check alternating pattern
    const oddNumbers = numbers.filter((_, i) => i % 2 === 0);
    const evenNumbers = numbers.filter((_, i) => i % 2 === 1);
    
    const oddDifferences = oddNumbers.slice(1).map((n, i) => n - oddNumbers[i]);
    const evenDifferences = evenNumbers.slice(1).map((n, i) => n - evenNumbers[i]);
    
    const isAlternating = 
      oddDifferences.length > 0 && 
      evenDifferences.length > 0 &&
      oddDifferences.every(d => Math.abs(d - oddDifferences[0]) < 0.0001) && 
      evenDifferences.every(d => Math.abs(d - evenDifferences[0]) < 0.0001);
    
    if (isAlternating) {
      const isOddNext = numbers.length % 2 === 0;
      const nextNumber = isOddNext 
        ? oddNumbers[oddNumbers.length - 1] + oddDifferences[0]
        : evenNumbers[evenNumbers.length - 1] + evenDifferences[0];
      
      return {
        nextNumber,
        pattern: 'alternating',
        description: `Odd positions: +${oddDifferences[0]}, Even positions: +${evenDifferences[0]}`
      };
    }

    throw new ValidationError('No valid pattern detected in sequence');
  }
} 