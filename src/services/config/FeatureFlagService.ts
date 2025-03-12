import { ConfigurationService } from "./ConfigurationService";

/**
 * Feature keys for the application
 * Add new feature flags here
 */
export enum FeatureFlag {
    ENABLE_SMART_GENERATOR = "ENABLE_SMART_GENERATOR",
    ENABLE_IMAGE_GENERATION = "ENABLE_IMAGE_GENERATION",
    ENABLE_ANALYTICS = "ENABLE_ANALYTICS",
    ENABLE_ADVANCED_TEMPLATES = "ENABLE_ADVANCED_TEMPLATES",
}

/**
 * Service for managing feature flags and toggles
 * Centralizes the logic for checking if features are enabled
 */
export class FeatureFlagService {
    private static instance: FeatureFlagService;
    private configService: ConfigurationService;

    // Cache of feature flag values
    private cache: Map<string, boolean> = new Map();

    private constructor() {
        this.configService = ConfigurationService.getInstance();
    }

    public static getInstance(): FeatureFlagService {
        if (!FeatureFlagService.instance) {
            FeatureFlagService.instance = new FeatureFlagService();
        }
        return FeatureFlagService.instance;
    }

    /**
     * Check if a feature flag is enabled
     * @param flag The feature flag to check
     * @returns True if the feature is enabled, false otherwise
     */
    public isEnabled(flag: FeatureFlag): boolean {
        // Check cache first
        if (this.cache.has(flag)) {
            return this.cache.get(flag)!;
        }

        // Default values for different environments
        const defaultValue = this.getDefaultValue(flag);

        // Get from environment with default
        const isEnabled = this.configService.getBoolean(flag, defaultValue);

        // Cache the value
        this.cache.set(flag, isEnabled);

        return isEnabled;
    }

    /**
     * Get the default value for a feature flag based on the environment
     * @param flag The feature flag
     * @returns The default value for the flag
     */
    private getDefaultValue(flag: FeatureFlag): boolean {
        const isProduction = process.env.NODE_ENV === 'production';

        // Default values for each flag
        switch (flag) {
            case FeatureFlag.ENABLE_SMART_GENERATOR:
                // Enabled in all environments
                return true;

            case FeatureFlag.ENABLE_IMAGE_GENERATION:
                // Enabled in all environments
                return true;

            case FeatureFlag.ENABLE_ANALYTICS:
                // Only enabled in production by default
                return isProduction;

            case FeatureFlag.ENABLE_ADVANCED_TEMPLATES:
                // Experimental feature, disabled by default in production
                return !isProduction;

            default:
                // For any new flags, default to disabled in production, enabled elsewhere
                return !isProduction;
        }
    }

    /**
     * Reset the feature flag cache
     * Useful for testing or when environment variables change at runtime
     */
    public resetCache(): void {
        this.cache.clear();
    }
} 