import { LANGUAGE_CONFIG } from '@/lib/config';
import type { Language } from '@/lib/types';

export class LanguageService {
  private static instance: LanguageService;

  private constructor() {}

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  public isValidLanguage(code: string): boolean {
    return code in LANGUAGE_CONFIG;
  }

  public getLanguageConfig(code: Language) {
    if (!this.isValidLanguage(code)) {
      throw new Error(`Invalid language code: ${code}`);
    }
    return LANGUAGE_CONFIG[code];
  }

  public getCharacterSet(language: Language): RegExp {
    return LANGUAGE_CONFIG[language].characterSet;
  }

  public getWordleCharacterSet(): RegExp {
    // For Wordle, we ONLY allow basic A-Z letters for all languages
    return /^[A-Z]+$/;
  }

  public getLanguageName(language: Language): string {
    return LANGUAGE_CONFIG[language].name;
  }

  public getQuestionMarkStyle(language: Language): string {
    return LANGUAGE_CONFIG[language].questionMarkStyle;
  }

  public validateWord(word: string, language: Language, options?: { isWordle?: boolean }): boolean {
    const pattern = options?.isWordle ? 
      this.getWordleCharacterSet() : 
      this.getCharacterSet(language);
    return pattern.test(word);
  }

  public formatQuestion(question: string): string {
    // Add a question mark if not present
    return question.trim().replace(/[?¿]*$/, '?');
  }
} 