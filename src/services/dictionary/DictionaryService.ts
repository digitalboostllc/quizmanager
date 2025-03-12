import { Language } from '@/lib/types';
import { DictionaryStats, LanguageDictionary, WordDifficulty } from '@/lib/types/dictionary';

interface WordOptions {
  noAccents?: boolean;
  wordLength?: number;
  difficulty?: WordDifficulty;
}

export class DictionaryService {
  private static instance: DictionaryService;
  private dictionaries: Map<Language, LanguageDictionary>;
  private initialized: boolean = false;

  private constructor() {
    this.dictionaries = new Map();
  }

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load the French dictionary
      // First check if we're in a browser or server context
      const isServer = typeof window === 'undefined';

      if (isServer) {
        console.log('Server-side dictionary initialization - using fallback words');
        // In server context, use a minimal dictionary with common words
        // This avoids file system dependencies and URL issues
        this.dictionaries.set('fr', {
          metadata: {
            language: 'fr',
            wordCount: 15,
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
          },
          words: {
            easy: [
              { word: "CHAT", type: "NOUN" },
              { word: "PORTE", type: "NOUN" },
              { word: "BIEN", type: "COMMON" },
              { word: "LIVRE", type: "NOUN" },
              { word: "JOUR", type: "NOUN" }
            ],
            medium: [
              { word: "MAISON", type: "NOUN" },
              { word: "JARDIN", type: "NOUN" },
              { word: "SOLEIL", type: "NOUN" },
              { word: "FENÊTRE", type: "NOUN" },
              { word: "MUSIQUE", type: "NOUN" }
            ],
            hard: [
              { word: "PROBLÈME", type: "NOUN" },
              { word: "SOLUTION", type: "NOUN" },
              { word: "QUESTION", type: "NOUN" },
              { word: "ATTENTION", type: "NOUN" },
              { word: "HISTOIRE", type: "NOUN" }
            ]
          }
        });

        // Also add English
        this.dictionaries.set('en', {
          metadata: {
            language: 'en',
            wordCount: 15,
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
          },
          words: {
            easy: [
              { word: "QUIZ", type: "NOUN" },
              { word: "WORD", type: "NOUN" },
              { word: "GAME", type: "NOUN" },
              { word: "TIME", type: "NOUN" },
              { word: "PLAY", type: "VERB" }
            ],
            medium: [
              { word: "HOUSE", type: "NOUN" },
              { word: "WATER", type: "NOUN" },
              { word: "MUSIC", type: "NOUN" },
              { word: "STAND", type: "VERB" },
              { word: "LIGHT", type: "NOUN" }
            ],
            hard: [
              { word: "PUZZLE", type: "NOUN" },
              { word: "ANSWER", type: "NOUN" },
              { word: "NUMBER", type: "NOUN" },
              { word: "LETTER", type: "NOUN" },
              { word: "SQUARE", type: "NOUN" }
            ]
          }
        });
      } else {
        // Client-side: use fetch to get the dictionary from public folder
        try {
          const response = await fetch('/data/dictionaries/fr.json');
          if (!response.ok) {
            throw new Error(`Failed to load French dictionary: ${response.statusText}`);
          }
          const frDict = await response.json();
          this.dictionaries.set('fr', frDict as LanguageDictionary);
        } catch (fetchError) {
          console.warn('Failed to fetch dictionary, using fallback:', fetchError);
          // Use the same fallback as server-side if fetch fails
          this.dictionaries.set('fr', {
            metadata: {
              language: 'fr',
              wordCount: 6,
              lastUpdated: new Date().toISOString(),
              version: '1.0.0'
            },
            words: {
              easy: [
                { word: "CHAT", type: "NOUN" },
                { word: "PORTE", type: "NOUN" }
              ],
              medium: [
                { word: "MAISON", type: "NOUN" },
                { word: "JARDIN", type: "NOUN" }
              ],
              hard: [
                { word: "PROBLÈME", type: "NOUN" },
                { word: "SOLUTION", type: "NOUN" }
              ]
            }
          });
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize dictionaries:', error);
      throw error;
    }
  }

  public async validateWord(word: string, language: Language, options: WordOptions = {}): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate word length if specified
    if (options.wordLength && word.length !== options.wordLength) {
      return false;
    }

    // Validate no accents if specified
    if (options.noAccents && /[À-ÿ]/.test(word)) {
      return false;
    }

    // Get dictionary for language
    const dictionary = this.dictionaries.get(language);
    if (!dictionary) {
      // If no dictionary exists, accept any word that matches character set
      return true;
    }

    // Normalize word to uppercase
    const normalizedWord = word.toUpperCase();

    // Check if word exists in any difficulty level
    return Object.values(dictionary.words).some(difficultyWords =>
      difficultyWords.some(wordObj => wordObj.word === normalizedWord)
    );
  }

  public async getRandomWord(language: Language, options: WordOptions = {}): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const dictionary = this.dictionaries.get(language);
    if (!dictionary) {
      return null;
    }

    let wordPool: { word: string; type: string; isUsed?: boolean }[] = [];

    // Filter by difficulty if specified
    if (options.difficulty) {
      wordPool = dictionary.words[options.difficulty.toLowerCase() as keyof typeof dictionary.words];
    } else {
      // Combine all difficulty levels
      wordPool = Object.values(dictionary.words).flat();
    }

    // Apply additional filters
    if (options.wordLength || options.noAccents) {
      wordPool = wordPool.filter(entry => {
        const word = entry.word;
        if (options.wordLength && word.length !== options.wordLength) {
          return false;
        }
        if (options.noAccents && /[À-ÿ]/.test(word)) {
          return false;
        }
        return true;
      });
    }

    if (wordPool.length === 0) {
      return null;
    }

    // Prioritize unused words when possible
    const unusedWords = wordPool.filter(entry => !entry.isUsed);

    // If we have unused words, prefer those
    if (unusedWords.length > 0) {
      const selectedWord = unusedWords[Math.floor(Math.random() * unusedWords.length)].word;

      // Mark the word as used
      await this.markWordAsUsed(selectedWord, language);

      return selectedWord;
    }

    // If all words are used, fall back to any word
    const selectedWord = wordPool[Math.floor(Math.random() * wordPool.length)].word;

    // Still mark it as used (reused)
    await this.markWordAsUsed(selectedWord, language);

    return selectedWord;
  }

  public async getDictionaryStats(language: Language): Promise<DictionaryStats | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const dictionary = this.dictionaries.get(language);
    if (!dictionary) {
      return null;
    }

    const allWords = Object.values(dictionary.words).flat();
    const byType = {
      NOUN: allWords.filter(w => w.type === 'NOUN').length,
      VERB: allWords.filter(w => w.type === 'VERB').length,
      ADJECTIVE: allWords.filter(w => w.type === 'ADJECTIVE').length,
      COMMON: allWords.filter(w => w.type === 'COMMON').length
    };

    return {
      totalWords: dictionary.metadata.wordCount,
      byDifficulty: {
        easy: dictionary.words.easy.length,
        medium: dictionary.words.medium.length,
        hard: dictionary.words.hard.length
      },
      byType
    };
  }

  public async markWordAsUsed(word: string, language: Language): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const dictionary = this.dictionaries.get(language);
    if (!dictionary) {
      return false;
    }

    // Find the word in the dictionary
    let found = false;
    for (const difficultyLevel in dictionary.words) {
      if (Object.prototype.hasOwnProperty.call(dictionary.words, difficultyLevel)) {
        const difficultyWords = dictionary.words[difficultyLevel as keyof typeof dictionary.words];
        const wordIndex = difficultyWords.findIndex(w => w.word === word.toUpperCase());

        if (wordIndex !== -1) {
          // Mark the word as used
          difficultyWords[wordIndex] = {
            ...difficultyWords[wordIndex],
            isUsed: true,
            lastUsedAt: new Date().toISOString()
          };
          found = true;
          break;
        }
      }
    }

    return found;
  }

  public async toggleWordUsage(word: string, language: Language): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const dictionary = this.dictionaries.get(language);
    if (!dictionary) {
      return false;
    }

    // Find the word in the dictionary
    let found = false;
    for (const difficultyLevel in dictionary.words) {
      if (Object.prototype.hasOwnProperty.call(dictionary.words, difficultyLevel)) {
        const difficultyWords = dictionary.words[difficultyLevel as keyof typeof dictionary.words];
        const wordIndex = difficultyWords.findIndex(w => w.word === word.toUpperCase());

        if (wordIndex !== -1) {
          // Toggle the word's used status
          const currentIsUsed = difficultyWords[wordIndex].isUsed || false;
          difficultyWords[wordIndex] = {
            ...difficultyWords[wordIndex],
            isUsed: !currentIsUsed,
            lastUsedAt: !currentIsUsed ? new Date().toISOString() : undefined
          };
          found = true;
          break;
        }
      }
    }

    return found;
  }
} 