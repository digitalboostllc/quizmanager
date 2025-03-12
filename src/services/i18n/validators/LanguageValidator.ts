import { Language } from '@/lib/types';

export interface LanguageValidationResult {
  isValid: boolean;
  errors: string[];
}

export class LanguageValidator {
  private static instance: LanguageValidator;

  private constructor() {}

  public static getInstance(): LanguageValidator {
    if (!LanguageValidator.instance) {
      LanguageValidator.instance = new LanguageValidator();
    }
    return LanguageValidator.instance;
  }

  public validate(code: string): LanguageValidationResult {
    const errors: string[] = [];

    // Check if language code is provided
    if (!code) {
      errors.push('Language code is required');
      return { isValid: false, errors };
    }

    // Check if language code is valid
    if (!this.isValidLanguageCode(code)) {
      errors.push(`Invalid language code: ${code}`);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  private isValidLanguageCode(code: string): code is Language {
    const validCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl'];
    return validCodes.includes(code);
  }
} 