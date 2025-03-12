import { Language } from '@/lib/types';

export class DateFormatter {
  private static formatters: Record<Language, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }),
    es: new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }),
    fr: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }),
    de: new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }),
    it: new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }),
    pt: new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long' }),
    nl: new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }),
  };

  private static timeFormatters: Record<Language, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }),
    es: new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }),
    fr: new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' }),
    de: new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }),
    it: new Intl.DateTimeFormat('it-IT', { timeStyle: 'short' }),
    pt: new Intl.DateTimeFormat('pt-PT', { timeStyle: 'short' }),
    nl: new Intl.DateTimeFormat('nl-NL', { timeStyle: 'short' }),
  };

  public static formatDate(date: Date, language: Language): string {
    return this.formatters[language].format(date);
  }

  public static formatTime(date: Date, language: Language): string {
    return this.timeFormatters[language].format(date);
  }

  public static formatDateTime(date: Date, language: Language): string {
    return `${this.formatDate(date, language)} ${this.formatTime(date, language)}`;
  }

  public static formatRelative(date: Date, language: Language): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    const translations: Record<Language, {
      now: string;
      minutesAgo: string;
      hoursAgo: string;
      yesterday: string;
      daysAgo: string;
    }> = {
      en: {
        now: 'just now',
        minutesAgo: 'minutes ago',
        hoursAgo: 'hours ago',
        yesterday: 'yesterday',
        daysAgo: 'days ago'
      },
      es: {
        now: 'ahora mismo',
        minutesAgo: 'minutos atrás',
        hoursAgo: 'horas atrás',
        yesterday: 'ayer',
        daysAgo: 'días atrás'
      },
      fr: {
        now: 'à l\'instant',
        minutesAgo: 'minutes',
        hoursAgo: 'heures',
        yesterday: 'hier',
        daysAgo: 'jours'
      },
      de: {
        now: 'gerade eben',
        minutesAgo: 'Minuten her',
        hoursAgo: 'Stunden her',
        yesterday: 'gestern',
        daysAgo: 'Tage her'
      },
      it: {
        now: 'proprio ora',
        minutesAgo: 'minuti fa',
        hoursAgo: 'ore fa',
        yesterday: 'ieri',
        daysAgo: 'giorni fa'
      },
      pt: {
        now: 'agora mesmo',
        minutesAgo: 'minutos atrás',
        hoursAgo: 'horas atrás',
        yesterday: 'ontem',
        daysAgo: 'dias atrás'
      },
      nl: {
        now: 'zojuist',
        minutesAgo: 'minuten geleden',
        hoursAgo: 'uur geleden',
        yesterday: 'gisteren',
        daysAgo: 'dagen geleden'
      }
    };

    if (minutes < 5) return translations[language].now;
    if (hours < 1) return `${minutes} ${translations[language].minutesAgo}`;
    if (days < 1) return `${hours} ${translations[language].hoursAgo}`;
    if (days === 1) return translations[language].yesterday;
    if (days < 30) return `${days} ${translations[language].daysAgo}`;
    
    return this.formatDate(date, language);
  }
} 