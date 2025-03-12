import { Language } from '@/lib/types';

export class NumberFormatter {
  private static instance: NumberFormatter;
  private static readonly formatters: Record<Language, Intl.NumberFormat> = {
    en: new Intl.NumberFormat('en-US'),
    es: new Intl.NumberFormat('es-ES'),
    fr: new Intl.NumberFormat('fr-FR'),
    de: new Intl.NumberFormat('de-DE'),
    it: new Intl.NumberFormat('it-IT'),
    pt: new Intl.NumberFormat('pt-PT'),
    nl: new Intl.NumberFormat('nl-NL')
  };

  private static readonly currencyFormatters: Record<Language, Intl.NumberFormat> = {
    en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    es: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }),
    fr: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
    de: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    it: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
    pt: new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }),
    nl: new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
  };

  private static readonly percentFormatters: Record<Language, Intl.NumberFormat> = {
    en: new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }),
    es: new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 2 }),
    fr: new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2 }),
    de: new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2 }),
    it: new Intl.NumberFormat('it-IT', { style: 'percent', minimumFractionDigits: 2 }),
    pt: new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 2 }),
    nl: new Intl.NumberFormat('nl-NL', { style: 'percent', minimumFractionDigits: 2 })
  };

  private constructor() {}

  public static getInstance(): NumberFormatter {
    if (!NumberFormatter.instance) {
      NumberFormatter.instance = new NumberFormatter();
    }
    return NumberFormatter.instance;
  }

  public formatNumber(value: number, language: Language): string {
    return NumberFormatter.formatters[language].format(value);
  }

  public formatCurrency(value: number, language: Language): string {
    return NumberFormatter.currencyFormatters[language].format(value);
  }

  public formatPercent(value: number, language: Language): string {
    return NumberFormatter.percentFormatters[language].format(value);
  }

  public formatOrdinal(value: number, language: Language): string {
    const number = Math.abs(Math.floor(value));
    
    switch (language) {
      case 'en':
        const suffix = this.getEnglishOrdinalSuffix(number);
        return `${number}${suffix}`;
      
      case 'fr':
        if (number === 1) return `${number}er`;
        return `${number}e`;
      
      case 'es':
        return `${number}º`;
      
      case 'it':
        return `${number}º`;
      
      case 'pt':
        return `${number}º`;
      
      case 'de':
        return `${number}.`;
      
      case 'nl':
        return `${number}e`;
      
      default:
        return `${number}`;
    }
  }

  private getEnglishOrdinalSuffix(number: number): string {
    const j = number % 10;
    const k = number % 100;
    
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  public parseNumber(value: string, language: Language): number | null {
    try {
      // Remove language-specific grouping and decimal separators
      let normalizedValue = value;
      
      switch (language) {
        case 'en':
        case 'nl':
          // 1,234.56 -> 1234.56
          normalizedValue = value.replace(/,/g, '');
          break;
        
        case 'de':
        case 'fr':
        case 'it':
        case 'es':
        case 'pt':
          // 1.234,56 -> 1234.56
          normalizedValue = value.replace(/\./g, '').replace(',', '.');
          break;
      }
      
      const parsed = parseFloat(normalizedValue);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }
} 