import { LoggingService } from '../logging/LoggingService';

/**
 * Event handler function type
 */
type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Event subscription with optional context
 */
interface Subscription<T = any> {
    eventName: string;
    handler: EventHandler<T>;
    context?: string;
}

/**
 * Centralized event bus for publish/subscribe communication
 * Allows components to communicate without direct dependencies
 */
export class EventBusService {
    private static instance: EventBusService;
    private logger: LoggingService;

    // Map of event names to array of handlers
    private eventHandlers: Map<string, Array<EventHandler<any>>> = new Map();

    // Track subscriptions for cleanup
    private subscriptions: Subscription[] = [];

    private constructor() {
        this.logger = LoggingService.getInstance();
    }

    public static getInstance(): EventBusService {
        if (!EventBusService.instance) {
            EventBusService.instance = new EventBusService();
        }
        return EventBusService.instance;
    }

    /**
     * Subscribe to an event
     * @param eventName The name of the event to subscribe to
     * @param handler The handler function to call when the event is published
     * @param context Optional context information for logging and tracking
     * @returns Subscription object that can be used to unsubscribe
     */
    public subscribe<T = any>(
        eventName: string,
        handler: EventHandler<T>,
        context?: string
    ): Subscription<T> {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }

        this.eventHandlers.get(eventName)!.push(handler as EventHandler<any>);

        const subscription: Subscription<T> = {
            eventName,
            handler,
            context,
        };

        this.subscriptions.push(subscription);

        this.logger.debug(
            `Subscribed to event "${eventName}"${context ? ` from ${context}` : ''}`,
            'EventBusService'
        );

        return subscription;
    }

    /**
     * Unsubscribe from an event
     * @param subscription The subscription to remove
     * @returns True if the subscription was removed, false otherwise
     */
    public unsubscribe(subscription: Subscription): boolean {
        const { eventName, handler } = subscription;

        if (!this.eventHandlers.has(eventName)) {
            return false;
        }

        const handlers = this.eventHandlers.get(eventName)!;
        const index = handlers.indexOf(handler);

        if (index === -1) {
            return false;
        }

        handlers.splice(index, 1);

        // Remove from subscriptions array
        const subIndex = this.subscriptions.findIndex(
            (sub) => sub.eventName === eventName && sub.handler === handler
        );

        if (subIndex !== -1) {
            this.subscriptions.splice(subIndex, 1);
        }

        this.logger.debug(
            `Unsubscribed from event "${eventName}"${subscription.context ? ` from ${subscription.context}` : ''}`,
            'EventBusService'
        );

        // Clean up empty handler arrays
        if (handlers.length === 0) {
            this.eventHandlers.delete(eventName);
        }

        return true;
    }

    /**
     * Unsubscribe all handlers for a specific context
     * @param context The context to unsubscribe
     * @returns Number of subscriptions removed
     */
    public unsubscribeContext(context: string): number {
        if (!context) {
            return 0;
        }

        const subscriptionsToRemove = this.subscriptions.filter(
            (sub) => sub.context === context
        );

        subscriptionsToRemove.forEach((sub) => {
            this.unsubscribe(sub);
        });

        this.logger.debug(
            `Unsubscribed ${subscriptionsToRemove.length} events from context "${context}"`,
            'EventBusService'
        );

        return subscriptionsToRemove.length;
    }

    /**
     * Publish an event with data
     * @param eventName The name of the event to publish
     * @param data The data to pass to handlers
     * @returns Number of handlers notified
     */
    public async publish<T = any>(eventName: string, data: T): Promise<number> {
        if (!this.eventHandlers.has(eventName)) {
            return 0;
        }

        const handlers = this.eventHandlers.get(eventName)!;

        this.logger.debug(
            `Publishing event "${eventName}" to ${handlers.length} handlers`,
            'EventBusService'
        );

        const promises = handlers.map(async (handler) => {
            try {
                await handler(data);
            } catch (error) {
                this.logger.error(
                    `Error in handler for event "${eventName}"`,
                    'EventBusService',
                    error
                );
            }
        });

        await Promise.all(promises);

        return handlers.length;
    }

    /**
     * Get all active subscriptions
     * @returns Array of subscriptions
     */
    public getSubscriptions(): ReadonlyArray<Subscription> {
        return [...this.subscriptions];
    }

    /**
     * Get all active event names
     * @returns Array of event names
     */
    public getEventNames(): string[] {
        return Array.from(this.eventHandlers.keys());
    }

    /**
     * Check if an event has any subscribers
     * @param eventName The event name to check
     * @returns True if the event has subscribers
     */
    public hasSubscribers(eventName: string): boolean {
        return this.eventHandlers.has(eventName) &&
            this.eventHandlers.get(eventName)!.length > 0;
    }

    /**
     * Clear all subscriptions
     */
    public clearAllSubscriptions(): void {
        this.eventHandlers.clear();
        this.subscriptions = [];

        this.logger.debug('Cleared all event subscriptions', 'EventBusService');
    }
} 