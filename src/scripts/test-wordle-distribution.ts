import { GenerationContext } from '@/services/generation/pipeline/GenerationPipeline';
import { WordleStrategy } from '@/services/strategies/WordleStrategy';
import { QuizType } from '@prisma/client';

// Test words with various lengths and patterns
const TEST_WORDS = [
    'APPLE',    // 5 letters, 1 duplicate (P)
    'CHAIR',    // 5 letters, no duplicates
    'PUZZLE',   // 6 letters, 1 duplicate (Z)
    'BALLOON',  // 7 letters, 2 duplicates (L, O)
    'CONNECT',  // 7 letters, 2 duplicates (C, N)
    'TOOTH',    // 5 letters, 2 duplicates (O, T)
    'BANANA',   // 6 letters, 3 duplicates (A, N)
    'SUCCESS',  // 7 letters, multiple duplicates (S, C)
    'HAPPY',    // 5 letters, 1 duplicate (P)
    'MISSISSIPPI' // 11 letters, many duplicates
];

async function runTests() {
    console.log('🧪 Starting WordleStrategy distribution tests...');

    const strategy = new WordleStrategy();
    const results: any[] = [];

    for (const word of TEST_WORDS) {
        console.log(`\n📝 Testing word: ${word}`);
        console.log('==================================================');

        // Create context with the test word
        const context: GenerationContext = {
            language: 'en',
            content: word,
            quizType: 'WORDLE' as QuizType,
            options: {}
        };

        // Generate content
        const result = await strategy.generateContent(context);

        if (result.error) {
            console.error(`❌ Error generating content for ${word}: ${result.error}`);
            continue;
        }

        // Check if content is available
        if (!result.content) {
            console.error(`❌ No content generated for ${word}`);
            continue;
        }

        // Analyze letter distribution
        const letterDistribution = analyzeLetterDistribution(word, result.content);
        results.push({
            word,
            wordLength: word.length,
            uniqueLetters: new Set(word.split('')).size,
            distribution: letterDistribution
        });

        // Print distribution for this word
        console.log(`\n✅ Letter distribution for "${word}":`);
        console.log(`   Total letters in word: ${word.length}`);
        console.log(`   Unique letters: ${new Set(word.split('')).size}`);
        console.log(`   Attempt 1: Correct: ${letterDistribution.attempt1.correct}, Misplaced: ${letterDistribution.attempt1.misplaced}, Wrong: ${letterDistribution.attempt1.wrong}`);
        console.log(`   Attempt 2: Correct: ${letterDistribution.attempt2.correct}, Misplaced: ${letterDistribution.attempt2.misplaced}, Wrong: ${letterDistribution.attempt2.wrong}`);
        console.log(`   Attempt 3: Correct: ${letterDistribution.attempt3.correct}, Misplaced: ${letterDistribution.attempt3.misplaced}, Wrong: ${letterDistribution.attempt3.wrong}`);

        // Calculate what percentage of word letters are shown in each attempt
        const wordLettersInAttempt1 = letterDistribution.attempt1.correct + letterDistribution.attempt1.misplaced;
        const wordLettersInAttempt2 = letterDistribution.attempt2.correct + letterDistribution.attempt2.misplaced;
        const wordLettersInAttempt3 = letterDistribution.attempt3.correct + letterDistribution.attempt3.misplaced;

        const uniqueLetterCount = new Set(word.split('')).size;
        console.log(`   Letter coverage: ${uniqueLetterCount} unique letters`);
        console.log(`   Attempt 1: ${((wordLettersInAttempt1 / uniqueLetterCount) * 100).toFixed(1)}% of unique letters`);
        console.log(`   Attempt 2: ${((wordLettersInAttempt2 / uniqueLetterCount) * 100).toFixed(1)}% of unique letters`);
        console.log(`   Attempt 3: ${((wordLettersInAttempt3 / uniqueLetterCount) * 100).toFixed(1)}% of unique letters`);

        // Show which letters are missing
        const lettersShown = new Set([
            ...letterDistribution.attempt1.letters,
            ...letterDistribution.attempt2.letters,
            ...letterDistribution.attempt3.letters
        ]);

        const wordLetters = new Set(word.split(''));
        const missingLetters = [...wordLetters].filter(l => !lettersShown.has(l));

        if (missingLetters.length > 0) {
            console.log(`   ⚠️ Missing letters: ${missingLetters.join(', ')}`);
        } else {
            console.log(`   ✅ All letters shown across attempts`);
        }

        console.log('\n');
    }

    // Overall analysis
    console.log('📊 OVERALL ANALYSIS');
    console.log('==================================================');

    const totalWords = results.length;
    const avgCorrect1 = results.reduce((sum, r) => sum + r.distribution.attempt1.correct, 0) / totalWords;
    const avgMisplaced1 = results.reduce((sum, r) => sum + r.distribution.attempt1.misplaced, 0) / totalWords;
    const avgCorrect2 = results.reduce((sum, r) => sum + r.distribution.attempt2.correct, 0) / totalWords;
    const avgMisplaced2 = results.reduce((sum, r) => sum + r.distribution.attempt2.misplaced, 0) / totalWords;
    const avgCorrect3 = results.reduce((sum, r) => sum + r.distribution.attempt3.correct, 0) / totalWords;
    const avgMisplaced3 = results.reduce((sum, r) => sum + r.distribution.attempt3.misplaced, 0) / totalWords;

    console.log(`Average correct letters in attempt 1: ${avgCorrect1.toFixed(1)}`);
    console.log(`Average misplaced letters in attempt 1: ${avgMisplaced1.toFixed(1)}`);
    console.log(`Average correct letters in attempt 2: ${avgCorrect2.toFixed(1)}`);
    console.log(`Average misplaced letters in attempt 2: ${avgMisplaced2.toFixed(1)}`);
    console.log(`Average correct letters in attempt 3: ${avgCorrect3.toFixed(1)}`);
    console.log(`Average misplaced letters in attempt 3: ${avgMisplaced3.toFixed(1)}`);

    const wordsWithAllLettersShown = results.filter(r => r.distribution.allLettersShown).length;
    console.log(`\n${wordsWithAllLettersShown} out of ${totalWords} words (${(wordsWithAllLettersShown / totalWords * 100).toFixed(1)}%) had all letters shown across all attempts`);

    // Check if letters are well distributed across attempts
    const goodDistribution = avgMisplaced1 > 0 && avgCorrect2 > 0 && (avgCorrect3 + avgMisplaced3 < (avgCorrect1 + avgMisplaced1 + avgCorrect2 + avgMisplaced2));

    if (goodDistribution) {
        console.log('\n✅ Letter distribution looks good across attempts!');
        console.log('- First attempt focuses on misplaced letters');
        console.log('- Second attempt reveals some correct positions');
        console.log('- Third attempt has fewer correct letters (more challenge)');
    } else {
        console.log('\n⚠️ Letter distribution could be improved:');
        console.log('- Ideally first attempt should have more misplaced letters');
        console.log('- Second attempt should reveal some correct positions');
        console.log('- Third attempt should have fewer correct/misplaced letters to increase challenge');
    }
}

function analyzeLetterDistribution(word: string, gridHtml: string) {
    // Parse the HTML to extract letter boxes
    const attempt1Match = gridHtml.match(/<div class="word-attempt">[\s\S]*?<\/div>[\s\S]*?<\/div>/);
    const attempt2Match = attempt1Match ? gridHtml.slice(attempt1Match.index! + attempt1Match[0].length).match(/<div class="word-attempt">[\s\S]*?<\/div>[\s\S]*?<\/div>/) : null;
    const attempt3Match = attempt2Match && attempt2Match.index ? gridHtml.slice(attempt2Match.index + attempt2Match[0].length).match(/<div class="word-attempt">[\s\S]*?<\/div>[\s\S]*?<\/div>/) : null;

    const attempt1 = attempt1Match ? attempt1Match[0] : '';
    const attempt2 = attempt2Match ? attempt2Match[0] : '';
    const attempt3 = attempt3Match ? attempt3Match[0] : '';

    // Count correct, misplaced, and wrong letters in each attempt
    const result = {
        attempt1: countLetterTypes(attempt1, word),
        attempt2: countLetterTypes(attempt2, word),
        attempt3: countLetterTypes(attempt3, word),
        allLettersShown: false
    };

    // Check if all letters from the word are shown across all attempts
    const lettersShown = new Set([
        ...result.attempt1.letters,
        ...result.attempt2.letters,
        ...result.attempt3.letters
    ]);

    const uniqueWordLetters = new Set(word.split(''));
    result.allLettersShown = [...uniqueWordLetters].every(letter => lettersShown.has(letter));

    return result;
}

function countLetterTypes(attemptHtml: string, word: string) {
    let correct = 0;
    let misplaced = 0;
    let wrong = 0;
    const letters = new Set<string>();

    // Extract letter boxes
    const correctBoxes = attemptHtml.match(/<div class="letter-box correct">[A-Z]<\/div>/g) || [];
    const misplacedBoxes = attemptHtml.match(/<div class="letter-box misplaced">[A-Z]<\/div>/g) || [];
    const wrongBoxes = attemptHtml.match(/<div class="letter-box wrong">[A-Z]<\/div>/g) || [];

    // Count each type
    correct = correctBoxes.length;
    misplaced = misplacedBoxes.length;
    wrong = wrongBoxes.length;

    // Extract letters
    correctBoxes.forEach(box => {
        const letter = box.match(/>([A-Z])</)?.[1];
        if (letter && word.includes(letter)) letters.add(letter);
    });

    misplacedBoxes.forEach(box => {
        const letter = box.match(/>([A-Z])</)?.[1];
        if (letter && word.includes(letter)) letters.add(letter);
    });

    return { correct, misplaced, wrong, letters };
}

// Run the tests
runTests().catch(console.error);