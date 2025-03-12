import { CachingService } from '../cache/CachingService';
import { ConfigurationService } from '../config/ConfigurationService';
import { LoggingService } from '../logging/LoggingService';

/**
 * Supported locales
 */
export enum Locale {
    EN_US = 'en-US',
    EN_GB = 'en-GB',
    ES_ES = 'es-ES',
    FR_FR = 'fr-FR',
    DE_DE = 'de-DE',
    IT_IT = 'it-IT',
    JA_JP = 'ja-JP',
    KO_KR = 'ko-KR',
    ZH_CN = 'zh-CN',
    ZH_TW = 'zh-TW',
}

/**
 * Translation message format
 */
type TranslationMessages = Record<string, string>;

/**
 * Translation dictionary structure
 */
type TranslationDictionary = Record<string, TranslationMessages>;

/**
 * Centralized internationalization service
 * Manages translations, language switching, and formatting
 */
export class I18nService {
    private static instance: I18nService;
    private logger: LoggingService;
    private config: ConfigurationService;
    private cache: CachingService;

    // Current active locale
    private currentLocale: Locale;

    // Default locale to fall back to
    private defaultLocale: Locale;

    // Translation dictionaries by locale
    private translations: Record<Locale, TranslationDictionary> = {} as Record<Locale, TranslationDictionary>;

    // Date and number formatters
    private dateFormatters: Map<Locale, Intl.DateTimeFormat> = new Map();
    private numberFormatters: Map<Locale, Intl.NumberFormat> = new Map();
    private currencyFormatters: Map<string, Intl.NumberFormat> = new Map();

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();
        this.cache = CachingService.getInstance();

        // Set default locale
        this.defaultLocale = this.getLocaleFromString(
            this.config.getString('DEFAULT_LOCALE', Locale.EN_US)
        );

        // Set current locale to default initially
        this.currentLocale = this.defaultLocale;

        // Initialize formatters for default locale
        this.initializeFormatters(this.defaultLocale);

        // Load translations for default locale
        this.loadTranslations(this.defaultLocale);
    }

    public static getInstance(): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService();
        }
        return I18nService.instance;
    }

    /**
     * Get the current locale
     * @returns The current locale
     */
    public getLocale(): Locale {
        return this.currentLocale;
    }

    /**
     * Set the current locale
     * @param locale The locale to set
     * @returns True if the locale was set, false if the locale is not supported
     */
    public async setLocale(locale: Locale | string): Promise<boolean> {
        const targetLocale = this.getLocaleFromString(locale);

        if (!this.isSupportedLocale(targetLocale)) {
            this.logger.warn(`Unsupported locale: ${locale}`, 'I18nService');
            return false;
        }

        // Only change if different
        if (targetLocale !== this.currentLocale) {
            // Load translations if not already loaded
            if (!this.translations[targetLocale]) {
                await this.loadTranslations(targetLocale);
            }

            // Initialize formatters if not already initialized
            if (!this.dateFormatters.has(targetLocale)) {
                this.initializeFormatters(targetLocale);
            }

            this.currentLocale = targetLocale;
            this.logger.info(`Locale set to: ${targetLocale}`, 'I18nService');
        }

        return true;
    }

    /**
     * Translate a key
     * @param key The translation key in dot notation (namespace.key)
     * @param variables Variables to replace in the translation
     * @param options Translation options
     * @returns The translated string
     */
    public t(
        key: string,
        variables: Record<string, string | number> = {},
        options: { locale?: Locale; defaultValue?: string; namespace?: string } = {}
    ): string {
        const { locale = this.currentLocale, defaultValue, namespace } = options;

        // If namespace is provided, prepend it to the key
        const fullKey = namespace ? `${namespace}.${key}` : key;

        // Split key into namespace and actual key
        const parts = fullKey.split('.');

        if (parts.length < 2) {
            this.logger.warn(
                `Invalid translation key: ${fullKey}. Should be in format "namespace.key"`,
                'I18nService'
            );
            return defaultValue || fullKey;
        }

        const ns = parts[0];
        const messageKey = parts.slice(1).join('.');

        // Get translations for the locale
        const localeDictionary = this.translations[locale];
        if (!localeDictionary) {
            return this.handleMissingTranslation(fullKey, this.defaultLocale, defaultValue, variables);
        }

        // Get translations for the namespace
        const namespaceDictionary = localeDictionary[ns];
        if (!namespaceDictionary) {
            return this.handleMissingTranslation(fullKey, this.defaultLocale, defaultValue, variables);
        }

        // Get the translation
        const translation = namespaceDictionary[messageKey];
        if (!translation) {
            return this.handleMissingTranslation(fullKey, this.defaultLocale, defaultValue, variables);
        }

        // Apply variables
        return this.applyVariables(translation, variables);
    }

    /**
     * Format a date according to the current locale
     * @param date The date to format
     * @param options Intl.DateTimeFormatOptions
     * @returns The formatted date string
     */
    public formatDate(
        date: Date | number,
        options: Intl.DateTimeFormatOptions = {}
    ): string {
        // Get formatter for current locale
        const formatter = this.getDateFormatter(this.currentLocale, options);
        return formatter.format(date);
    }

    /**
     * Format a number according to the current locale
     * @param number The number to format
     * @param options Intl.NumberFormatOptions
     * @returns The formatted number string
     */
    public formatNumber(
        number: number,
        options: Intl.NumberFormatOptions = {}
    ): string {
        // Get formatter for current locale
        const formatter = this.getNumberFormatter(this.currentLocale, options);
        return formatter.format(number);
    }

    /**
     * Format a currency amount
     * @param amount The amount to format
     * @param currencyCode The ISO 4217 currency code
     * @param options Additional formatting options
     * @returns The formatted currency string
     */
    public formatCurrency(
        amount: number,
        currencyCode: string = 'USD',
        options: Omit<Intl.NumberFormatOptions, 'style' | 'currency'> = {}
    ): string {
        const key = `${this.currentLocale}:${currencyCode}:${JSON.stringify(options)}`;

        // Create formatter if it doesn't exist
        if (!this.currencyFormatters.has(key)) {
            this.currencyFormatters.set(
                key,
                new Intl.NumberFormat(this.currentLocale, {
                    style: 'currency',
                    currency: currencyCode,
                    ...options,
                })
            );
        }

        return this.currencyFormatters.get(key)!.format(amount);
    }

    /**
     * Get pluralized form of a string
     * @param key The translation key
     * @param count The count to determine pluralization
     * @param variables Variables to replace in the translation
     * @param options Translation options
     * @returns The pluralized and translated string
     */
    public plural(
        key: string,
        count: number,
        variables: Record<string, string | number> = {},
        options: { locale?: Locale; defaultValue?: string; namespace?: string } = {}
    ): string {
        // Add count to variables
        const mergedVariables = { ...variables, count };

        // Get the singular or plural key based on count
        const pluralizedKey = `${key}.${count === 1 ? 'one' : 'other'}`;

        return this.t(pluralizedKey, mergedVariables, options);
    }

    /**
     * Check if a locale is supported
     * @param locale The locale to check
     * @returns True if the locale is supported
     */
    public isSupportedLocale(locale: string): boolean {
        return Object.values(Locale).includes(locale as Locale);
    }

    /**
     * Get supported locales
     * @returns Array of supported locales
     */
    public getSupportedLocales(): Locale[] {
        return Object.values(Locale);
    }

    /**
     * Register translations manually
     * @param locale The locale
     * @param namespace The namespace
     * @param messages The translation messages
     */
    public registerTranslations(
        locale: Locale,
        namespace: string,
        messages: TranslationMessages
    ): void {
        if (!this.translations[locale]) {
            this.translations[locale] = {};
        }

        this.translations[locale][namespace] = {
            ...this.translations[locale][namespace],
            ...messages,
        };

        this.logger.debug(
            `Registered ${Object.keys(messages).length} translations for ${locale}.${namespace}`,
            'I18nService'
        );
    }

    /**
     * Load translations for a locale
     * @param locale The locale to load
     */
    private async loadTranslations(locale: Locale): Promise<void> {
        // Use cache to avoid loading translations multiple times
        const cacheKey = `translations:${locale}`;

        const cachedTranslations = this.cache.get<TranslationDictionary>(cacheKey);
        if (cachedTranslations) {
            this.translations[locale] = cachedTranslations;
            return;
        }

        try {
            // In a real application, this would load translations from files or an API
            // For demonstration purposes, we'll initialize with sample translations
            const translations = this.getSampleTranslations(locale);

            this.translations[locale] = translations;

            // Cache the translations
            this.cache.set(cacheKey, translations, { ttl: 3600 }); // 1 hour

            this.logger.info(`Loaded translations for locale: ${locale}`, 'I18nService');
        } catch (error) {
            this.logger.error(`Failed to load translations for ${locale}`, 'I18nService', error);
        }
    }

    /**
     * Initialize date and number formatters for a locale
     * @param locale The locale
     */
    private initializeFormatters(locale: Locale): void {
        // Initialize date formatter
        this.dateFormatters.set(
            locale,
            new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        );

        // Initialize number formatter
        this.numberFormatters.set(
            locale,
            new Intl.NumberFormat(locale)
        );

        this.logger.debug(`Initialized formatters for locale: ${locale}`, 'I18nService');
    }

    /**
     * Get date formatter for a locale
     * @param locale The locale
     * @param options Intl.DateTimeFormatOptions
     * @returns The date formatter
     */
    private getDateFormatter(
        locale: Locale,
        options: Intl.DateTimeFormatOptions
    ): Intl.DateTimeFormat {
        const optionsKey = JSON.stringify(options);
        const formatterKey = `${locale}:${optionsKey}`;

        // Use cache to avoid creating formatters repeatedly
        const cachedFormatter = this.cache.get<Intl.DateTimeFormat>(`dateFormatter:${formatterKey}`);
        if (cachedFormatter) {
            return cachedFormatter;
        }

        // Create a new formatter with the specified options
        const formatter = new Intl.DateTimeFormat(locale, options);

        // Cache the formatter
        this.cache.set(`dateFormatter:${formatterKey}`, formatter, { ttl: 3600 }); // 1 hour

        return formatter;
    }

    /**
     * Get number formatter for a locale
     * @param locale The locale
     * @param options Intl.NumberFormatOptions
     * @returns The number formatter
     */
    private getNumberFormatter(
        locale: Locale,
        options: Intl.NumberFormatOptions
    ): Intl.NumberFormat {
        const optionsKey = JSON.stringify(options);
        const formatterKey = `${locale}:${optionsKey}`;

        // Use cache to avoid creating formatters repeatedly
        const cachedFormatter = this.cache.get<Intl.NumberFormat>(`numberFormatter:${formatterKey}`);
        if (cachedFormatter) {
            return cachedFormatter;
        }

        // Create a new formatter with the specified options
        const formatter = new Intl.NumberFormat(locale, options);

        // Cache the formatter
        this.cache.set(`numberFormatter:${formatterKey}`, formatter, { ttl: 3600 }); // 1 hour

        return formatter;
    }

    /**
     * Handle missing translation
     * @param key The translation key
     * @param fallbackLocale The fallback locale
     * @param defaultValue The default value
     * @param variables Variables to replace
     * @returns The translation or fallback
     */
    private handleMissingTranslation(
        key: string,
        fallbackLocale: Locale,
        defaultValue?: string,
        variables: Record<string, string | number> = {}
    ): string {
        // If we're already using the fallback locale, return the default value or key
        if (this.currentLocale === fallbackLocale) {
            this.logger.warn(`Missing translation: ${key}`, 'I18nService');
            return defaultValue ? this.applyVariables(defaultValue, variables) : key;
        }

        // Otherwise, try to get the translation from the fallback locale
        const result = this.t(key, variables, { locale: fallbackLocale, defaultValue });

        // Log the missing translation
        this.logger.debug(
            `Using fallback translation for ${key} (${this.currentLocale} -> ${fallbackLocale})`,
            'I18nService'
        );

        return result;
    }

    /**
     * Apply variables to a translation string
     * @param translation The translation string with {{variable}} placeholders
     * @param variables The variables to apply
     * @returns The translation with variables applied
     */
    private applyVariables(
        translation: string,
        variables: Record<string, string | number>
    ): string {
        return translation.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = variables[key.trim()];
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Get locale enum from string
     * @param locale The locale string
     * @returns The corresponding Locale enum value or the default locale
     */
    private getLocaleFromString(locale: string | Locale): Locale {
        if (this.isSupportedLocale(locale)) {
            return locale as Locale;
        }
        return this.defaultLocale;
    }

    /**
     * Get sample translations for a locale
     * @param locale The locale
     * @returns Sample translations
     */
    private getSampleTranslations(locale: Locale): TranslationDictionary {
        // In a real application, these would come from files or an API
        switch (locale) {
            case Locale.EN_US:
                return {
                    common: {
                        'hello': 'Hello',
                        'welcome': 'Welcome, {{name}}!',
                        'goodbye': 'Goodbye',
                        'loading': 'Loading...',
                        'error': 'Error',
                        'success': 'Success',
                    },
                    quiz: {
                        'title': 'Quiz',
                        'start': 'Start Quiz',
                        'question': 'Question {{current}} of {{total}}',
                        'submit': 'Submit Answer',
                        'next': 'Next Question',
                        'finish': 'Finish Quiz',
                        'results': 'Results',
                        'score': 'Your score: {{score}}%',
                        'time': 'Time: {{time}} seconds',
                        'item.one': '{{count}} item',
                        'item.other': '{{count}} items',
                    },
                    errors: {
                        'notFound': 'Page not found',
                        'serverError': 'Server error',
                        'unauthorized': 'Unauthorized access',
                    },
                };
            case Locale.ES_ES:
                return {
                    common: {
                        'hello': 'Hola',
                        'welcome': '¡Bienvenido, {{name}}!',
                        'goodbye': 'Adiós',
                        'loading': 'Cargando...',
                        'error': 'Error',
                        'success': 'Éxito',
                    },
                    quiz: {
                        'title': 'Cuestionario',
                        'start': 'Iniciar Cuestionario',
                        'question': 'Pregunta {{current}} de {{total}}',
                        'submit': 'Enviar Respuesta',
                        'next': 'Siguiente Pregunta',
                        'finish': 'Finalizar Cuestionario',
                        'results': 'Resultados',
                        'score': 'Tu puntuación: {{score}}%',
                        'time': 'Tiempo: {{time}} segundos',
                        'item.one': '{{count}} elemento',
                        'item.other': '{{count}} elementos',
                    },
                    errors: {
                        'notFound': 'Página no encontrada',
                        'serverError': 'Error del servidor',
                        'unauthorized': 'Acceso no autorizado',
                    },
                };
            default:
                // Return empty dictionary for unsupported locales
                return {};
        }
    }
} 