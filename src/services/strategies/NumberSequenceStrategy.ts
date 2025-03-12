import { Language } from '@/lib/types';
import { GenerationContext, GenerationResult } from '../generation/pipeline/GenerationPipeline';
import { BaseQuizStrategy } from './BaseQuizStrategy';

export class NumberSequenceStrategy extends BaseQuizStrategy {
  private readonly SEQUENCE_TYPES = {
    ARITHMETIC: 'arithmetic',
    GEOMETRIC: 'geometric',
    FIBONACCI: 'fibonacci',
    QUADRATIC: 'quadratic',
    ALTERNATING: 'alternating',
    POWERS: 'powers',
    SQUARE_NUMBERS: 'square_numbers',
    PRIME_NUMBERS: 'prime_numbers',
    CUSTOM: 'custom'
  };

  protected getQuizTypeDescription(): string {
    return 'number sequence pattern';
  }

  protected getQuizType(): string {
    return 'NUMBER_SEQUENCE';
  }

  async generateContent(context: GenerationContext): Promise<GenerationResult> {
    try {
      // Check if we have content to parse
      if (context.content && context.content.trim()) {
        return this.processExistingSequence(context.content);
      } else {
        // Generate a new sequence if none exists
        return this.generateNewSequence();
      }
    } catch (err) {
      console.error('Error generating number sequence:', err);
      return {
        content: '',
        error: err instanceof Error ? err.message : 'Failed to generate number sequence'
      };
    }
  }

  async generateSolution(context: GenerationContext & { answer: string }): Promise<GenerationResult> {
    try {
      console.log('🧮 NumberSequenceStrategy.generateSolution called with:', {
        answer: context.answer,
        content: context.content?.substring(0, 50) + '...',
        hasOptions: !!context.options,
      });

      // Parse the sequence from the context if available
      let sequence: number[] = [];
      let sequenceType = '';
      let formula = '';
      let explanation = '';

      // Get sequence from metadata (stored when generating the quiz)
      if (context.options?.metadata && typeof context.options.metadata === 'object') {
        sequenceType = (context.options.metadata as Record<string, string>).sequenceType || '';
        console.log('📊 Found sequenceType in metadata:', sequenceType);
      }

      // Try to extract sequence from variables if available
      if (context.options?.variables && typeof context.options.variables === 'object') {
        // This would be populated from a previous generation
        const sequenceHtml = (context.options.variables as Record<string, string>).sequence || '';
        console.log('🔢 Found sequence HTML:', sequenceHtml?.substring(0, 100) + '...');

        // Extract numbers from the HTML (basic extraction)
        const matches = sequenceHtml.match(/number-box">\s*(\d+)\s*</g);
        if (matches) {
          sequence = matches.map(match => {
            const num = match.replace(/number-box">\s*(\d+)\s*</, '$1');
            return parseInt(num, 10);
          });
          console.log('📈 Extracted sequence:', sequence);
        }
      }

      // If we don't have a sequence yet but have content, try to parse it
      if (sequence.length === 0 && context.content) {
        try {
          sequence = this.parseSequence(context.content);
          console.log('📋 Parsed sequence from content:', sequence);
        } catch (err) {
          console.error('Could not parse sequence from content:', err);
        }
      }

      // If we still don't have a sequence, create a sample one
      if (sequence.length === 0) {
        // Create a sample sequence based on the answer
        let answer = 0;
        try {
          answer = parseInt(context.answer, 10);
        } catch (err) {
          console.error('Invalid answer format:', context.answer);
          answer = 40; // Default fallback
        }

        // Generate a sequence that leads to this answer
        if (answer % 2 === 0) {
          // Even answer - arithmetic sequence
          sequence = [answer - 10, answer - 8, answer - 6, answer - 4, answer - 2];
          sequenceType = this.SEQUENCE_TYPES.ARITHMETIC;
        } else {
          // Odd answer - fibonacci-like
          sequence = [
            Math.floor(answer / 8),
            Math.floor(answer / 4),
            Math.floor(answer / 2),
            Math.floor(answer * 0.75),
            Math.floor(answer * 0.9)
          ];
          sequenceType = this.SEQUENCE_TYPES.FIBONACCI;
        }
        console.log('🔄 Created sample sequence:', sequence, 'for answer:', answer);
      }

      // If we don't have a type yet, identify it
      if (!sequenceType && sequence.length >= 3) {
        sequenceType = this.identifySequenceType(sequence);
        console.log('🧩 Identified sequence type:', sequenceType);
      }

      // Generate solution explanation based on sequence type
      switch (sequenceType) {
        case this.SEQUENCE_TYPES.ARITHMETIC: {
          const difference = sequence[1] - sequence[0];
          formula = `a_n = a_1 + (n-1)d where d = ${difference}`;

          if (difference > 0) {
            explanation = `This is an arithmetic sequence where each number increases by ${difference}. To find the next number, add ${difference} to the last number (${sequence[sequence.length - 1]} + ${difference} = ${parseInt(context.answer, 10)}).`;
          } else {
            explanation = `This is an arithmetic sequence where each number decreases by ${Math.abs(difference)}. To find the next number, subtract ${Math.abs(difference)} from the last number (${sequence[sequence.length - 1]} ${difference} = ${parseInt(context.answer, 10)}).`;
          }
          break;
        }
        case this.SEQUENCE_TYPES.GEOMETRIC: {
          const ratio = sequence[1] / sequence[0];
          const ratioFormatted = Number.isInteger(ratio) ? ratio : ratio.toFixed(2);
          formula = `a_n = a_1 × r^(n-1) where r = ${ratioFormatted}`;

          explanation = `This is a geometric sequence where each number is multiplied by ${ratioFormatted} to get the next number. To find the next number, multiply the last number by ${ratioFormatted} (${sequence[sequence.length - 1]} × ${ratioFormatted} = ${parseInt(context.answer, 10)}).`;
          break;
        }
        case this.SEQUENCE_TYPES.FIBONACCI: {
          formula = `a_n = a_(n-1) + a_(n-2) for n ≥ 3`;

          explanation = `This is a Fibonacci-like sequence where each number is the sum of the two previous numbers. To find the next number, add the last two numbers (${sequence[sequence.length - 2]} + ${sequence[sequence.length - 1]} = ${parseInt(context.answer, 10)}).`;
          break;
        }
        case this.SEQUENCE_TYPES.QUADRATIC: {
          formula = `This sequence follows a quadratic pattern: a_n = an² + bn + c`;

          explanation = `This sequence follows a quadratic pattern where each term is related to the square of its position. Looking at the differences between consecutive terms, you'll notice they increase by a constant value, revealing the quadratic nature. The next number in the sequence is ${parseInt(context.answer, 10)}.`;
          break;
        }
        case this.SEQUENCE_TYPES.ALTERNATING: {
          // Extract pattern for alternating operations
          let pattern = '';
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
            }
          }

          if (!pattern) {
            pattern = "alternating operations";
            formula = "a_n follows an alternating pattern of operations";
          }

          explanation = `This sequence follows an alternating pattern, ${pattern}. By identifying this pattern and applying it to the last numbers, we can determine that the next number is ${parseInt(context.answer, 10)}.`;
          break;
        }
        case this.SEQUENCE_TYPES.POWERS: {
          let base = 0;
          let powerDesc = '';

          // Try to identify the base
          for (let i = 2; i <= 5; i++) {
            if (Math.pow(i, 1) === sequence[0] &&
              Math.pow(i, 2) === sequence[1] &&
              Math.pow(i, 3) === sequence[2]) {
              base = i;
              powerDesc = `powers of ${i}`;
              break;
            }
          }

          if (!base) {
            // Try to identify if it's consecutive powers of different numbers
            if (sequence[0] === Math.pow(2, 1) &&
              sequence[1] === Math.pow(3, 1) &&
              sequence[2] === Math.pow(4, 1)) {
              powerDesc = "consecutive numbers raised to the power of 1";
            } else if (sequence[0] === Math.pow(1, 2) &&
              sequence[1] === Math.pow(2, 2) &&
              sequence[2] === Math.pow(3, 2)) {
              powerDesc = "consecutive numbers squared";
            } else {
              powerDesc = "exponential relationship";
            }
          }

          formula = base ? `a_n = ${base}^n` : "a_n follows a pattern of powers or exponents";
          explanation = `This sequence follows a pattern involving ${powerDesc}. By continuing this pattern, the next number in the sequence is ${parseInt(context.answer, 10)}.`;
          break;
        }
        case this.SEQUENCE_TYPES.SQUARE_NUMBERS: {
          formula = `a_n = n²`;
          explanation = `This sequence consists of square numbers (1², 2², 3², 4², 5², etc.). The next number would be 6² = 36, so the next term is ${parseInt(context.answer, 10)}.`;
          break;
        }
        case this.SEQUENCE_TYPES.PRIME_NUMBERS: {
          formula = `a_n = nth prime number`;
          explanation = `This sequence consists of prime numbers (numbers divisible only by 1 and themselves). By continuing this pattern, the next prime number is ${parseInt(context.answer, 10)}.`;
          break;
        }
        default: {
          // If we can't determine the type, use the base strategy's solution generation
          console.log('⚠️ Unknown sequence type, falling back to base implementation');
          return super.generateSolution(context);
        }
      }

      // Combine formula and explanation
      const solution = `
## Mathematical Pattern

${formula}

## Explanation

${explanation}

## Verification

Sequence: ${sequence.join(', ')}, ?

Next number: ${context.answer}
`;

      console.log('✅ Generated custom mathematical solution');
      return { content: solution };
    } catch (err) {
      console.error('❌ Error generating solution:', err);
      // Fall back to the base implementation if our custom solution fails
      return super.generateSolution(context);
    }
  }

  private async processExistingSequence(contentStr: string): Promise<GenerationResult> {
    try {
      const sequence = this.parseSequence(contentStr);
      const type = this.identifySequenceType(sequence);
      const nextNumber = this.generateNextNumber(sequence, type);

      // Generate the sequence HTML with number boxes
      const sequenceHtml = this.generateSequenceHtml(sequence, nextNumber);

      return {
        content: '',
        variables: {
          sequence: sequenceHtml
        },
        answer: String(nextNumber),
        metadata: {
          sequenceType: type,
          length: String(sequence.length),
          range: `${Math.min(...sequence)}-${Math.max(...sequence)}`
        }
      };
    } catch (err) {
      console.error('Error processing sequence:', err);
      return {
        content: '',
        error: err instanceof Error ? err.message : 'Failed to process number sequence'
      };
    }
  }

  private generateNewSequence(): GenerationResult {
    // Choose a sequence type with weighted probability
    // More complex patterns have higher probability to make quizzes more challenging
    const sequenceTypesWithWeights = [
      { type: this.SEQUENCE_TYPES.ARITHMETIC, weight: 10 },
      { type: this.SEQUENCE_TYPES.GEOMETRIC, weight: 15 },
      { type: this.SEQUENCE_TYPES.FIBONACCI, weight: 15 },
      { type: this.SEQUENCE_TYPES.QUADRATIC, weight: 20 },
      { type: this.SEQUENCE_TYPES.ALTERNATING, weight: 15 },
      { type: this.SEQUENCE_TYPES.POWERS, weight: 10 },
      { type: this.SEQUENCE_TYPES.SQUARE_NUMBERS, weight: 10 },
      { type: this.SEQUENCE_TYPES.PRIME_NUMBERS, weight: 5 }
    ];

    // Calculate total weight
    const totalWeight = sequenceTypesWithWeights.reduce((sum, item) => sum + item.weight, 0);

    // Select a random type based on weight
    let randomWeight = Math.floor(Math.random() * totalWeight);
    let selectedType = sequenceTypesWithWeights[0].type;

    for (const item of sequenceTypesWithWeights) {
      if (randomWeight < item.weight) {
        selectedType = item.type;
        break;
      }
      randomWeight -= item.weight;
    }

    let sequence: number[] = [];
    let nextNumber: number;

    // Generate a sequence based on the selected type
    switch (selectedType) {
      case this.SEQUENCE_TYPES.ARITHMETIC: {
        // Generate an arithmetic sequence with a random common difference
        const start = Math.floor(Math.random() * 10) + 1; // Start between 1-10
        const difference = Math.floor(Math.random() * 5) + 1; // Difference between 1-5
        sequence = [start];
        for (let i = 1; i < 5; i++) {
          sequence.push(start + (difference * i));
        }
        nextNumber = sequence[sequence.length - 1] + difference;
        break;
      }
      case this.SEQUENCE_TYPES.GEOMETRIC: {
        // Generate a geometric sequence with a small ratio
        const start = Math.floor(Math.random() * 5) + 1; // Start between 1-5
        const ratio = Math.floor(Math.random() * 3) + 2; // Ratio between 2-4
        sequence = [start];
        for (let i = 1; i < 5; i++) {
          sequence.push(start * Math.pow(ratio, i));
        }
        nextNumber = sequence[sequence.length - 1] * ratio;
        break;
      }
      case this.SEQUENCE_TYPES.FIBONACCI: {
        // Generate a Fibonacci-like sequence with random starting values
        const first = Math.floor(Math.random() * 5) + 1; // First number between 1-5
        const second = Math.floor(Math.random() * 5) + first; // Second number > first
        sequence = [first, second];
        for (let i = 2; i < 5; i++) {
          sequence.push(sequence[i - 1] + sequence[i - 2]);
        }
        nextNumber = sequence[sequence.length - 1] + sequence[sequence.length - 2];
        break;
      }
      case this.SEQUENCE_TYPES.QUADRATIC: {
        // Generate a quadratic sequence (n²+b)
        const a = Math.floor(Math.random() * 3) + 1; // Coefficient 1-3
        const b = Math.floor(Math.random() * 5); // Offset 0-4

        sequence = [];
        for (let i = 1; i <= 5; i++) {
          sequence.push(a * (i * i) + b);
        }
        nextNumber = a * (6 * 6) + b; // Next term is n=6
        break;
      }
      case this.SEQUENCE_TYPES.ALTERNATING: {
        // Generate a sequence with alternating operations
        const choice = Math.floor(Math.random() * 2);

        if (choice === 0) {
          // Alternating addition
          const start = Math.floor(Math.random() * 10) + 1;
          const diff1 = Math.floor(Math.random() * 5) + 1;
          const diff2 = Math.floor(Math.random() * 5) + 6; // Different increase

          sequence = [start];
          for (let i = 1; i < 5; i++) {
            if (i % 2 === 1) {
              sequence.push(sequence[i - 1] + diff1);
            } else {
              sequence.push(sequence[i - 1] + diff2);
            }
          }

          // Determine next number based on pattern
          nextNumber = sequence[sequence.length - 1] + (sequence.length % 2 === 0 ? diff1 : diff2);
        } else {
          // Alternating multiplication/addition
          const start = Math.floor(Math.random() * 5) + 2;
          const mult = Math.floor(Math.random() * 2) + 2; // Multiply by 2 or 3
          const add = Math.floor(Math.random() * 3) + 2; // Add 2-4

          sequence = [start];
          for (let i = 1; i < 5; i++) {
            if (i % 2 === 1) {
              sequence.push(sequence[i - 1] * mult);
            } else {
              sequence.push(sequence[i - 1] + add);
            }
          }

          // Determine next number based on pattern
          nextNumber = sequence[sequence.length - 1] * (sequence.length % 2 === 0 ? 1 : mult) +
            (sequence.length % 2 === 1 ? 0 : add);
        }
        break;
      }
      case this.SEQUENCE_TYPES.POWERS: {
        // Choose between consecutive powers or powers of a single base
        const choice = Math.floor(Math.random() * 2);

        if (choice === 0) {
          // Powers of a single number
          const base = Math.floor(Math.random() * 3) + 2; // Use 2, 3, or 4 as base
          sequence = [];
          for (let i = 1; i <= 5; i++) {
            sequence.push(Math.pow(base, i));
          }
          nextNumber = Math.pow(base, 6);
        } else {
          // Consecutive numbers raised to the same power
          const power = Math.floor(Math.random() * 2) + 2; // Square or cube
          sequence = [];
          for (let i = 1; i <= 5; i++) {
            sequence.push(Math.pow(i, power));
          }
          nextNumber = Math.pow(6, power);
        }
        break;
      }
      case this.SEQUENCE_TYPES.SQUARE_NUMBERS: {
        // Simple square numbers
        sequence = [];
        for (let i = 1; i <= 5; i++) {
          sequence.push(i * i);
        }
        nextNumber = 6 * 6; // 36
        break;
      }
      case this.SEQUENCE_TYPES.PRIME_NUMBERS: {
        // Prime numbers
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

        // Choose a starting point in the prime sequence
        const startIdx = Math.floor(Math.random() * 8); // Leave room for 5 consecutive primes + next
        sequence = primes.slice(startIdx, startIdx + 5);
        nextNumber = primes[startIdx + 5];
        break;
      }
      default:
        // Fallback to a simple arithmetic sequence
        sequence = [2, 4, 6, 8, 10];
        nextNumber = 12;
    }

    // Generate the sequence HTML with number boxes
    const sequenceHtml = this.generateSequenceHtml(sequence, nextNumber);

    console.log(`Generated new ${selectedType} sequence:`, sequence, 'Next:', nextNumber);
    console.log('Sequence HTML:', sequenceHtml);

    return {
      content: '',
      variables: {
        sequence: sequenceHtml
      },
      answer: String(nextNumber),
      metadata: {
        sequenceType: selectedType,
        length: String(sequence.length),
        range: `${Math.min(...sequence)}-${Math.max(...sequence)}`
      }
    };
  }

  private generateSequenceHtml(sequence: number[], nextNumber: number): string {
    let html = '';

    // Generate HTML for each number in the sequence
    sequence.forEach(num => {
      html += `<div class="number-box">${num}</div>`;
    });

    // Add the missing number box at the end
    html += `<div class="number-box missing">?</div>`;

    return html;
  }

  private parseSequence(content: string): number[] {
    try {
      return content.split(',')
        .map(num => num.trim())
        .filter(num => num !== '')
        .map(num => {
          const parsed = parseFloat(num);
          if (isNaN(parsed)) {
            throw new Error(`Invalid number: ${num}`);
          }
          return parsed;
        });
    } catch (err) {
      console.error('Error parsing sequence:', err);
      throw new Error('Failed to parse sequence');
    }
  }

  private identifySequenceType(sequence: number[]): string {
    if (sequence.length < 3) {
      return this.SEQUENCE_TYPES.CUSTOM;
    }

    // Check for square numbers
    const isSquareNumbers = sequence.every((num, idx) => {
      return Math.abs(num - Math.pow(idx + 1, 2)) < 0.001;
    });
    if (isSquareNumbers) {
      return this.SEQUENCE_TYPES.SQUARE_NUMBERS;
    }

    // Check for prime numbers
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    if (sequence.every(num => primes.includes(num))) {
      // Check if it's a continuous segment of the prime sequence
      const startIdx = primes.indexOf(sequence[0]);
      if (startIdx !== -1 && sequence.every((num, idx) => num === primes[startIdx + idx])) {
        return this.SEQUENCE_TYPES.PRIME_NUMBERS;
      }
    }

    // Check for powers
    for (let base = 2; base <= 5; base++) {
      if (sequence.every((num, idx) => Math.abs(num - Math.pow(base, idx + 1)) < 0.001)) {
        return this.SEQUENCE_TYPES.POWERS;
      }
    }

    // Check if sequence follows n^2, n^3 pattern
    for (let power = 2; power <= 3; power++) {
      if (sequence.every((num, idx) => Math.abs(num - Math.pow(idx + 1, power)) < 0.001)) {
        return this.SEQUENCE_TYPES.POWERS;
      }
    }

    // Check for arithmetic sequence
    const differences = sequence.slice(1).map((num, i) => num - sequence[i]);
    if (differences.every(diff => Math.abs(diff - differences[0]) < 0.0001)) {
      return this.SEQUENCE_TYPES.ARITHMETIC;
    }

    // Check for geometric sequence
    const ratios = sequence.slice(1).map((num, i) => num / sequence[i]);
    if (ratios.every(ratio => Math.abs(ratio - ratios[0]) < 0.0001)) {
      return this.SEQUENCE_TYPES.GEOMETRIC;
    }

    // Check for Fibonacci sequence
    const isFibonacci = sequence.slice(2).every((num, i) =>
      Math.abs(num - (sequence[i] + sequence[i + 1])) < 0.0001
    );
    if (isFibonacci) {
      return this.SEQUENCE_TYPES.FIBONACCI;
    }

    // Check for quadratic sequence by looking at the differences of differences
    if (sequence.length >= 4) {
      const firstDiffs = differences;
      const secondDiffs = firstDiffs.slice(1).map((num, i) => num - firstDiffs[i]);
      if (secondDiffs.every(diff => Math.abs(diff - secondDiffs[0]) < 0.0001)) {
        return this.SEQUENCE_TYPES.QUADRATIC;
      }
    }

    // Check for alternating patterns
    if (sequence.length >= 5) {
      // Check for alternating differences
      const evenIdxDiffs = differences.filter((_, idx) => idx % 2 === 0);
      const oddIdxDiffs = differences.filter((_, idx) => idx % 2 === 1);

      if (evenIdxDiffs.every(diff => Math.abs(diff - evenIdxDiffs[0]) < 0.0001) &&
        oddIdxDiffs.every(diff => Math.abs(diff - oddIdxDiffs[0]) < 0.0001) &&
        Math.abs(evenIdxDiffs[0] - oddIdxDiffs[0]) > 0.0001) {
        return this.SEQUENCE_TYPES.ALTERNATING;
      }

      // Check for alternating operations (multiplication followed by addition)
      const evenOps = sequence.slice(2).filter((_, idx) => idx % 2 === 0)
        .map((num, idx) => num / sequence[idx * 2]);
      const oddOps = sequence.slice(2).filter((_, idx) => idx % 2 === 1)
        .map((num, idx) => num - sequence[idx * 2 + 1]);

      if (evenOps.every(op => Math.abs(op - evenOps[0]) < 0.0001) &&
        oddOps.every(op => Math.abs(op - oddOps[0]) < 0.0001)) {
        return this.SEQUENCE_TYPES.ALTERNATING;
      }
    }

    return this.SEQUENCE_TYPES.CUSTOM;
  }

  private generateNextNumber(sequence: number[], type: string): number {
    switch (type) {
      case this.SEQUENCE_TYPES.ARITHMETIC: {
        const difference = sequence[1] - sequence[0];
        return sequence[sequence.length - 1] + difference;
      }
      case this.SEQUENCE_TYPES.GEOMETRIC: {
        const ratio = sequence[1] / sequence[0];
        return sequence[sequence.length - 1] * ratio;
      }
      case this.SEQUENCE_TYPES.FIBONACCI: {
        return sequence[sequence.length - 1] + sequence[sequence.length - 2];
      }
      case this.SEQUENCE_TYPES.QUADRATIC: {
        // For quadratic sequences, we can use the method of differences
        const differences = sequence.slice(1).map((num, i) => num - sequence[i]);
        const secondDiff = differences[1] - differences[0];
        return sequence[sequence.length - 1] + differences[differences.length - 1] + secondDiff;
      }
      case this.SEQUENCE_TYPES.ALTERNATING: {
        // Try to detect the alternating pattern
        if (sequence.length >= 5) {
          const lastDiff = sequence[sequence.length - 1] - sequence[sequence.length - 2];
          const secondLastDiff = sequence[sequence.length - 2] - sequence[sequence.length - 3];
          const thirdLastDiff = sequence[sequence.length - 3] - sequence[sequence.length - 4];

          // If the pattern is alternating, use the matching previous difference
          if (Math.abs(lastDiff - thirdLastDiff) < 0.0001) {
            return sequence[sequence.length - 1] + secondLastDiff;
          } else {
            return sequence[sequence.length - 1] + thirdLastDiff;
          }
        } else {
          // Fallback if not enough terms
          return sequence[sequence.length - 1] + (sequence[1] - sequence[0]);
        }
      }
      case this.SEQUENCE_TYPES.POWERS: {
        // Try to identify the pattern
        // Is it a^n pattern?
        for (let base = 2; base <= 5; base++) {
          let found = true;
          for (let i = 0; i < sequence.length; i++) {
            if (Math.abs(sequence[i] - Math.pow(base, i + 1)) > 0.001) {
              found = false;
              break;
            }
          }
          if (found) {
            return Math.pow(base, sequence.length + 1);
          }
        }

        // Is it n^a pattern?
        for (let power = 2; power <= 3; power++) {
          let found = true;
          for (let i = 0; i < sequence.length; i++) {
            if (Math.abs(sequence[i] - Math.pow(i + 1, power)) > 0.001) {
              found = false;
              break;
            }
          }
          if (found) {
            return Math.pow(sequence.length + 1, power);
          }
        }

        // Fallback
        return sequence[sequence.length - 1] * 2;
      }
      case this.SEQUENCE_TYPES.SQUARE_NUMBERS: {
        // Next square number
        return Math.pow(Math.sqrt(sequence[sequence.length - 1]) + 1, 2);
      }
      case this.SEQUENCE_TYPES.PRIME_NUMBERS: {
        // Find the next prime after the last one
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
        const lastPrime = sequence[sequence.length - 1];
        const index = primes.indexOf(lastPrime);
        if (index !== -1 && index < primes.length - 1) {
          return primes[index + 1];
        } else {
          // Fallback for large primes not in our list
          return lastPrime + 2; // This is just a guess
        }
      }
      default:
        throw new Error('Cannot generate next number for custom sequence');
    }
  }

  async validateContent(content: string, language: Language): Promise<boolean> {
    try {
      const sequence = this.parseSequence(content);
      if (sequence.length < 3) {
        return false;
      }
      const type = this.identifySequenceType(sequence);
      return type !== this.SEQUENCE_TYPES.CUSTOM;
    } catch (err) {
      console.error('Error validating sequence:', err);
      return false;
    }
  }
} 