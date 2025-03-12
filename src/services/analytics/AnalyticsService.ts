import { ConfigurationService } from '../config/ConfigurationService';
import { FeatureFlag, FeatureFlagService } from '../config/FeatureFlagService';
import { LoggingService } from '../logging/LoggingService';

/**
 * Event category types
 */
export enum EventCategory {
    USER = 'user',
    NAVIGATION = 'navigation',
    INTERACTION = 'interaction',
    QUIZ = 'quiz',
    PERFORMANCE = 'performance',
    ERROR = 'error',
}

/**
 * Event data structure
 */
export interface AnalyticsEvent {
    category: EventCategory;
    action: string;
    label?: string;
    value?: number;
    properties?: Record<string, any>;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
}

/**
 * User identification data
 */
export interface UserData {
    userId: string;
    traits?: {
        email?: string;
        name?: string;
        role?: string;
        [key: string]: any;
    };
}

/**
 * Supported analytics providers
 */
export enum AnalyticsProvider {
    GOOGLE_ANALYTICS = 'google-analytics',
    MIXPANEL = 'mixpanel',
    SEGMENT = 'segment',
    CUSTOM = 'custom',
}

/**
 * Centralized analytics service for tracking user behavior and application metrics
 */
export class AnalyticsService {
    private static instance: AnalyticsService;
    private logger: LoggingService;
    private config: ConfigurationService;
    private featureFlags: FeatureFlagService;

    // Tracking enabled flag
    private isEnabled: boolean;

    // Current user data
    private currentUser: UserData | null = null;

    // Session ID
    private sessionId: string;

    // Providers
    private providers: AnalyticsProvider[];

    // Queue for events that failed to send
    private eventQueue: AnalyticsEvent[] = [];

    // Max queue size
    private maxQueueSize: number = 100;

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();
        this.featureFlags = FeatureFlagService.getInstance();

        // Check if analytics is enabled
        this.isEnabled = this.featureFlags.isEnabled(FeatureFlag.ENABLE_ANALYTICS);

        // Get providers from config
        this.providers = this.getProvidersFromConfig();

        // Generate a random session ID
        this.sessionId = this.generateSessionId();

        // Initialize providers
        this.initializeProviders();

        // Log initialization
        this.logger.info(
            `Analytics initialized with providers: ${this.providers.join(', ')}`,
            'AnalyticsService'
        );
    }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Track an event
     * @param category Event category
     * @param action Event action
     * @param label Optional event label
     * @param value Optional numeric value
     * @param properties Additional event properties
     * @returns True if the event was sent successfully
     */
    public track(
        category: EventCategory,
        action: string,
        label?: string,
        value?: number,
        properties?: Record<string, any>
    ): boolean {
        if (!this.isEnabled) {
            return false;
        }

        try {
            const event: AnalyticsEvent = {
                category,
                action,
                label,
                value,
                properties,
                timestamp: new Date(),
                userId: this.currentUser?.userId,
                sessionId: this.sessionId,
            };

            // Send to all providers
            this.sendToProviders(event);

            return true;
        } catch (error) {
            this.logger.error('Failed to track event', 'AnalyticsService', error);
            return false;
        }
    }

    /**
     * Track a page view
     * @param path The page path
     * @param title The page title
     * @param properties Additional properties
     * @returns True if the event was sent successfully
     */
    public trackPageView(
        path: string,
        title?: string,
        properties?: Record<string, any>
    ): boolean {
        return this.track(
            EventCategory.NAVIGATION,
            'page_view',
            title || path,
            undefined,
            {
                path,
                title,
                ...properties,
            }
        );
    }

    /**
     * Track a user interaction
     * @param element The element interacted with
     * @param action The action (click, submit, etc.)
     * @param properties Additional properties
     * @returns True if the event was sent successfully
     */
    public trackInteraction(
        element: string,
        action: string,
        properties?: Record<string, any>
    ): boolean {
        return this.track(
            EventCategory.INTERACTION,
            action,
            element,
            undefined,
            properties
        );
    }

    /**
     * Track an error
     * @param message Error message
     * @param source Error source
     * @param properties Additional properties
     * @returns True if the event was sent successfully
     */
    public trackError(
        message: string,
        source: string,
        properties?: Record<string, any>
    ): boolean {
        return this.track(
            EventCategory.ERROR,
            'error',
            source,
            undefined,
            {
                message,
                ...properties,
            }
        );
    }

    /**
     * Track a timing event
     * @param category Timing category
     * @param variable Timing variable
     * @param time Time in milliseconds
     * @param label Optional label
     * @returns True if the event was sent successfully
     */
    public trackTiming(
        category: string,
        variable: string,
        time: number,
        label?: string
    ): boolean {
        return this.track(
            EventCategory.PERFORMANCE,
            'timing',
            label || variable,
            time,
            {
                category,
                variable,
            }
        );
    }

    /**
     * Identify a user
     * @param userData User data
     * @returns True if the user was identified successfully
     */
    public identify(userData: UserData): boolean {
        if (!this.isEnabled) {
            return false;
        }

        try {
            this.currentUser = userData;

            // Send identify event to providers
            this.sendIdentifyToProviders(userData);

            this.logger.debug(`Identified user: ${userData.userId}`, 'AnalyticsService');

            return true;
        } catch (error) {
            this.logger.error('Failed to identify user', 'AnalyticsService', error);
            return false;
        }
    }

    /**
     * Reset the current user (logout)
     * @returns True if the user was reset successfully
     */
    public reset(): boolean {
        if (!this.isEnabled) {
            return false;
        }

        try {
            // Track logout event if user was identified
            if (this.currentUser) {
                this.track(EventCategory.USER, 'logout');
            }

            // Reset current user
            this.currentUser = null;

            // Generate a new session ID
            this.sessionId = this.generateSessionId();

            // Reset providers
            this.resetProviders();

            this.logger.debug('Reset analytics user', 'AnalyticsService');

            return true;
        } catch (error) {
            this.logger.error('Failed to reset analytics', 'AnalyticsService', error);
            return false;
        }
    }

    /**
     * Get the current session ID
     * @returns The session ID
     */
    public getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Generate a unique session ID
     * @returns Session ID
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Get analytics providers from configuration
     * @returns Array of providers
     */
    private getProvidersFromConfig(): AnalyticsProvider[] {
        const providersStr = this.config.getString('ANALYTICS_PROVIDERS', 'custom');
        const providers = providersStr.split(',').map(p => p.trim().toLowerCase());

        return providers.map(p => {
            switch (p) {
                case 'ga':
                case 'google':
                case 'google-analytics':
                    return AnalyticsProvider.GOOGLE_ANALYTICS;
                case 'mixpanel':
                    return AnalyticsProvider.MIXPANEL;
                case 'segment':
                    return AnalyticsProvider.SEGMENT;
                default:
                    return AnalyticsProvider.CUSTOM;
            }
        });
    }

    /**
     * Initialize analytics providers
     */
    private initializeProviders(): void {
        if (this.providers.includes(AnalyticsProvider.GOOGLE_ANALYTICS)) {
            this.initializeGoogleAnalytics();
        }

        if (this.providers.includes(AnalyticsProvider.MIXPANEL)) {
            this.initializeMixpanel();
        }

        if (this.providers.includes(AnalyticsProvider.SEGMENT)) {
            this.initializeSegment();
        }
    }

    /**
     * Reset analytics providers
     */
    private resetProviders(): void {
        // In a real implementation, this would call the reset methods of each provider
        this.logger.debug('Reset analytics providers', 'AnalyticsService');
    }

    /**
     * Send an event to all providers
     * @param event The event to send
     */
    private sendToProviders(event: AnalyticsEvent): void {
        let sentToAny = false;

        try {
            // Send to appropriate providers
            if (this.providers.includes(AnalyticsProvider.GOOGLE_ANALYTICS)) {
                this.sendToGoogleAnalytics(event);
                sentToAny = true;
            }

            if (this.providers.includes(AnalyticsProvider.MIXPANEL)) {
                this.sendToMixpanel(event);
                sentToAny = true;
            }

            if (this.providers.includes(AnalyticsProvider.SEGMENT)) {
                this.sendToSegment(event);
                sentToAny = true;
            }

            // Always send to custom provider
            if (this.providers.includes(AnalyticsProvider.CUSTOM)) {
                this.sendToCustomProvider(event);
                sentToAny = true;
            }

            // Log the event
            this.logEvent(event);

            // If event wasn't sent to any provider, add to queue for retry
            if (!sentToAny) {
                this.queueEvent(event);
            }
        } catch (error) {
            this.logger.error('Error sending event to providers', 'AnalyticsService', error);
            this.queueEvent(event);
        }
    }

    /**
     * Send identify event to all providers
     * @param userData User data
     */
    private sendIdentifyToProviders(userData: UserData): void {
        try {
            // Send to appropriate providers
            if (this.providers.includes(AnalyticsProvider.GOOGLE_ANALYTICS)) {
                this.sendIdentifyToGoogleAnalytics(userData);
            }

            if (this.providers.includes(AnalyticsProvider.MIXPANEL)) {
                this.sendIdentifyToMixpanel(userData);
            }

            if (this.providers.includes(AnalyticsProvider.SEGMENT)) {
                this.sendIdentifyToSegment(userData);
            }

            // Always send to custom provider
            if (this.providers.includes(AnalyticsProvider.CUSTOM)) {
                this.sendIdentifyToCustomProvider(userData);
            }
        } catch (error) {
            this.logger.error('Error sending identify to providers', 'AnalyticsService', error);
        }
    }

    /**
     * Queue an event for retry
     * @param event The event to queue
     */
    private queueEvent(event: AnalyticsEvent): void {
        // Don't exceed max queue size
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.eventQueue.shift(); // Remove oldest event
        }

        this.eventQueue.push(event);
        this.logger.debug(`Queued event ${event.action} for retry`, 'AnalyticsService');
    }

    /**
     * Log an event for debugging
     * @param event The event to log
     */
    private logEvent(event: AnalyticsEvent): void {
        this.logger.debug(
            `Analytics event: ${event.category}/${event.action}${event.label ? `/${event.label}` : ''}`,
            'AnalyticsService',
            {
                value: event.value,
                properties: event.properties,
                userId: event.userId,
                sessionId: event.sessionId,
            }
        );
    }

    // Provider-specific implementations

    /**
     * Initialize Google Analytics
     */
    private initializeGoogleAnalytics(): void {
        // In a real implementation, this would initialize GA
        this.logger.debug('Initialized Google Analytics', 'AnalyticsService');
    }

    /**
     * Initialize Mixpanel
     */
    private initializeMixpanel(): void {
        // In a real implementation, this would initialize Mixpanel
        this.logger.debug('Initialized Mixpanel', 'AnalyticsService');
    }

    /**
     * Initialize Segment
     */
    private initializeSegment(): void {
        // In a real implementation, this would initialize Segment
        this.logger.debug('Initialized Segment', 'AnalyticsService');
    }

    /**
     * Send an event to Google Analytics
     * @param event The event to send
     */
    private sendToGoogleAnalytics(event: AnalyticsEvent): void {
        // In a real implementation, this would send to GA
        // For example:
        // window.gtag('event', event.action, {
        //   event_category: event.category,
        //   event_label: event.label,
        //   value: event.value,
        //   ...event.properties,
        // });
    }

    /**
     * Send an event to Mixpanel
     * @param event The event to send
     */
    private sendToMixpanel(event: AnalyticsEvent): void {
        // In a real implementation, this would send to Mixpanel
        // For example:
        // window.mixpanel.track(event.action, {
        //   category: event.category,
        //   label: event.label,
        //   value: event.value,
        //   ...event.properties,
        // });
    }

    /**
     * Send an event to Segment
     * @param event The event to send
     */
    private sendToSegment(event: AnalyticsEvent): void {
        // In a real implementation, this would send to Segment
        // For example:
        // window.analytics.track(event.action, {
        //   category: event.category,
        //   label: event.label,
        //   value: event.value,
        //   ...event.properties,
        // });
    }

    /**
     * Send an event to the custom provider
     * @param event The event to send
     */
    private sendToCustomProvider(event: AnalyticsEvent): void {
        // In a real implementation, this might send to a custom endpoint or store locally
        // For example, send to a backend API:
        // fetch('/api/analytics/event', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(event),
        // });
    }

    /**
     * Send identify to Google Analytics
     * @param userData User data
     */
    private sendIdentifyToGoogleAnalytics(userData: UserData): void {
        // In a real implementation, this would send to GA
        // For example:
        // window.gtag('set', 'user_properties', {
        //   user_id: userData.userId,
        //   ...userData.traits,
        // });
    }

    /**
     * Send identify to Mixpanel
     * @param userData User data
     */
    private sendIdentifyToMixpanel(userData: UserData): void {
        // In a real implementation, this would send to Mixpanel
        // For example:
        // window.mixpanel.identify(userData.userId);
        // window.mixpanel.people.set({
        //   ...userData.traits,
        // });
    }

    /**
     * Send identify to Segment
     * @param userData User data
     */
    private sendIdentifyToSegment(userData: UserData): void {
        // In a real implementation, this would send to Segment
        // For example:
        // window.analytics.identify(userData.userId, {
        //   ...userData.traits,
        // });
    }

    /**
     * Send identify to the custom provider
     * @param userData User data
     */
    private sendIdentifyToCustomProvider(userData: UserData): void {
        // In a real implementation, this might send to a custom endpoint or store locally
        // For example, send to a backend API:
        // fetch('/api/analytics/identify', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(userData),
        // });
    }
} 