/**
 * Configuration service for centralized access to environment variables and settings
 * This provides type-safe access to configuration values
 */
export class ConfigurationService {
    private static instance: ConfigurationService;

    // Cache of configuration values
    private cache: Map<string, any> = new Map();

    private constructor() { }

    public static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }

    /**
     * Get a string configuration value
     * @param key Configuration key
     * @param defaultValue Default value to return if key is not found
     * @returns Configuration value or default
     */
    public getString(key: string, defaultValue?: string): string {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Try to get from environment
        const value = process.env[key] || defaultValue;

        if (value === undefined) {
            throw new Error(`Configuration key "${key}" not found and no default provided`);
        }

        // Cache the value
        this.cache.set(key, value);

        return value;
    }

    /**
     * Get a number configuration value
     * @param key Configuration key
     * @param defaultValue Default value to return if key is not found
     * @returns Configuration value or default
     */
    public getNumber(key: string, defaultValue?: number): number {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Try to get from environment
        const stringValue = process.env[key];
        let value: number | undefined;

        if (stringValue !== undefined) {
            value = Number(stringValue);
            if (isNaN(value)) {
                throw new Error(`Configuration key "${key}" has value "${stringValue}" which cannot be converted to a number`);
            }
        } else {
            value = defaultValue;
        }

        if (value === undefined) {
            throw new Error(`Configuration key "${key}" not found and no default provided`);
        }

        // Cache the value
        this.cache.set(key, value);

        return value;
    }

    /**
     * Get a boolean configuration value
     * @param key Configuration key
     * @param defaultValue Default value to return if key is not found
     * @returns Configuration value or default
     */
    public getBoolean(key: string, defaultValue?: boolean): boolean {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Try to get from environment
        const stringValue = process.env[key];
        let value: boolean | undefined;

        if (stringValue !== undefined) {
            // Convert string to boolean
            value = stringValue.toLowerCase() === 'true' || stringValue === '1';
        } else {
            value = defaultValue;
        }

        if (value === undefined) {
            throw new Error(`Configuration key "${key}" not found and no default provided`);
        }

        // Cache the value
        this.cache.set(key, value);

        return value;
    }

    /**
     * Get a JSON configuration value
     * @param key Configuration key
     * @param defaultValue Default value to return if key is not found
     * @returns Parsed JSON value or default
     */
    public getJSON<T>(key: string, defaultValue?: T): T {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Try to get from environment
        const stringValue = process.env[key];
        let value: T | undefined;

        if (stringValue !== undefined) {
            try {
                value = JSON.parse(stringValue) as T;
            } catch (error) {
                throw new Error(`Configuration key "${key}" has value "${stringValue}" which is not valid JSON`);
            }
        } else {
            value = defaultValue;
        }

        if (value === undefined) {
            throw new Error(`Configuration key "${key}" not found and no default provided`);
        }

        // Cache the value
        this.cache.set(key, value);

        return value;
    }

    /**
     * Get the base URL of the application
     * @returns Base URL
     */
    public getBaseUrl(): string {
        return this.getString('NEXTAUTH_URL') ||
            this.getString('VERCEL_URL', 'http://localhost:3000');
    }

    /**
     * Reset the configuration cache
     * Useful for testing or when environment variables change at runtime
     */
    public resetCache(): void {
        this.cache.clear();
    }
} 