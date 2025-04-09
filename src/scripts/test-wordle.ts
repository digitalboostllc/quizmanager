import { Language } from '@/lib/types';
import { QuizType } from '@prisma/client';
import { GenerationContext } from '../services/generation/pipeline/GenerationPipeline';
import { WordleStrategy } from '../services/strategies/WordleStrategy';

const testWords = [
    'PUDDLE',    // Double D
    'BANANA',    // Triple A, Double N
    'BOOK',      // Double O
    'MISSISSIPPI', // Multiple S and P
    'COMMITTEE',   // Double M, Double T, Double E
    'SUCCESS'      // Double S, Double C
];

async function runTests() {
    const strategy = new WordleStrategy();

    for (const word of testWords) {
        console.log(`\n🔍 Testing word: ${word}`);
        console.log('='.repeat(50));

        const context: GenerationContext = {
            content: word,
            language: 'en' as Language,
            quizType: QuizType.WORDLE,
            options: {
                difficulty: 'medium'
            }
        };

        const result = await strategy.generateContent(context);

        if (result.error) {
            console.error(`Error generating content: ${result.error}`);
            continue;
        }

        if (!result.content) {
            console.error('No content generated');
            continue;
        }

        console.log('Generated content:');
        console.log(result.content);

        console.log('\nLetter positions in word:');
        const letterPositions = new Map<string, number[]>();
        word.split('').forEach((letter, index) => {
            if (!letterPositions.has(letter)) {
                letterPositions.set(letter, []);
            }
            letterPositions.get(letter)!.push(index);
        });

        letterPositions.forEach((positions, letter) => {
            console.log(`${letter}: appears at positions ${positions.join(', ')}`);
        });

        // Extract attempts from the HTML content
        const attemptRegex = /<div class="word-attempt">\s*<div class="word-grid-row">(.*?)<\/div>\s*<\/div>/g;
        const attempts: string[] = [];
        let match;

        const content = result.content;
        while ((match = attemptRegex.exec(content)) !== null) {
            const attemptHtml = match[1];
            const letterBoxes = attemptHtml.match(/<div class="letter-box (?:correct|misplaced|wrong)">(.)<\/div>/g);
            if (letterBoxes) {
                const letters = letterBoxes.map(div => {
                    const letterMatch = div.match(/>(.)</);
                    return letterMatch ? letterMatch[1] : '';
                });
                attempts.push(letters.join(''));
            }
        }

        console.log('\nAnalysis:');
        attempts.forEach((attempt, index) => {
            console.log(`\nAttempt ${index + 1}: ${attempt}`);
            console.log('Letter by letter analysis:');
            word.split('').forEach((correctLetter, position) => {
                const attemptLetter = attempt[position];
                const status = attemptLetter === correctLetter ? 'CORRECT' :
                    word.includes(attemptLetter) ? 'MISPLACED' : 'WRONG';
                const letterCount = word.split(attemptLetter).length - 1;
                console.log(`  Position ${position}: ${attemptLetter} (${status})${letterCount > 1 ? ` - appears ${letterCount} times in word` : ''}`);
            });
        });

        // Validate duplicate letter handling
        const duplicateLetters = Array.from(letterPositions.entries())
            .filter(([_, positions]) => positions.length > 1);

        if (duplicateLetters.length > 0) {
            console.log('\nDuplicate letter validation:');
            duplicateLetters.forEach(([letter, positions]) => {
                console.log(`Letter ${letter} appears ${positions.length} times at positions: ${positions.join(', ')}`);
                attempts.forEach((attempt, index) => {
                    const appearancesInAttempt = attempt.split(letter).length - 1;
                    console.log(`  Attempt ${index + 1}: appears ${appearancesInAttempt} times`);
                });
            });
        }
    }
}

runTests().catch(console.error); 