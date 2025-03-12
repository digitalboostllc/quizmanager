import axios from 'axios';
import { API_CONFIG, LANGUAGE_CONFIG } from '@/lib/config';
import type { Language } from '@/lib/types';
import { BaseApiService } from '../base/BaseApiService';
import { DictionaryError } from '../errors/ApiError';
import type { WordValidationOptions, DictionaryResponse, ApiResponse } from '../types';

export class DictionaryService extends BaseApiService {
  private static instance: DictionaryService;

  private constructor() {
    super();
  }

  protected validateEnvironment(): void {
    // No environment variables needed for dictionary service
  }

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  public async validateWord(
    word: string,
    language: Language,
    options: WordValidationOptions = {}
  ): Promise<ApiResponse<DictionaryResponse>> {
    return this.handleRequest(
      async () => {
        // Get language configuration
        const langConfig = LANGUAGE_CONFIG[language];
        const characterSet = options.customCharacterSet || langConfig.characterSet;

        // Check if word matches character set
        if (!characterSet.test(word)) {
          throw new DictionaryError(
            `Word "${word}" contains invalid characters for ${language}`
          );
        }

        // If dictionary check is not required, return after character set validation
        if (options.checkDictionary === false) {
          return {
            word,
            language,
            found: true,
            details: 'Character set validation only'
          };
        }

        try {
          await this.makeApiRequest(language, word);
          return {
            word,
            language,
            found: true,
            details: language === 'en' ? 'Dictionary validated' : 'Character set and dictionary validated'
          };
        } catch (error) {
          // For non-English languages, accept words that match character set
          if (language !== 'en') {
            return {
              word,
              language,
              found: true,
              details: 'Character set match for non-English language'
            };
          }
          
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            throw new DictionaryError(
              `Word "${word}" not found in ${language} dictionary`
            );
          }
          
          throw new DictionaryError(
            `Dictionary validation failed for word "${word}" in ${language}`,
            error
          );
        }
      },
      `Failed to validate word "${word}" for language ${language}`
    );
  }

  private async makeApiRequest(language: string, word: string): Promise<Record<string, unknown>> {
    return this.retryRequest(
      () => axios.get(
        `${API_CONFIG.DICTIONARY_API.BASE_URL}/${language}/${encodeURIComponent(word.toLowerCase())}`,
        { 
          timeout: API_CONFIG.DICTIONARY_API.TIMEOUT,
          validateStatus: (status) => status === 200 || status === 404
        }
      )
    );
  }
} 