import { Language } from './types';

interface LanguageConfig {
    name: string;
    characterSet: RegExp;
    locale: string;
}

export const LANGUAGE_CONFIG: Record<Language, LanguageConfig> = {
    en: {
        name: 'English',
        characterSet: /^[A-Z]+$/,
        locale: 'en-US'
    },
    fr: {
        name: 'French',
        characterSet: /^[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]+$/,
        locale: 'fr-FR'
    },
    es: {
        name: 'Spanish',
        characterSet: /^[A-ZÁÉÍÑÓÚÜ]+$/,
        locale: 'es-ES'
    },
    de: {
        name: 'German',
        characterSet: /^[A-ZÄÖÜß]+$/,
        locale: 'de-DE'
    },
    it: {
        name: 'Italian',
        characterSet: /^[A-ZÀÈÉÌÍÎÒÓÙÚ]+$/,
        locale: 'it-IT'
    },
    pt: {
        name: 'Portuguese',
        characterSet: /^[A-ZÁÂÃÀÇÉÊÍÓÔÕÚ]+$/,
        locale: 'pt-PT'
    },
    nl: {
        name: 'Dutch',
        characterSet: /^[A-ZÄËÏÖÜĲ]+$/,
        locale: 'nl-NL'
    }
}; 