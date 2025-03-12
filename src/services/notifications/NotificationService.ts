import { ConfigurationService } from '../config/ConfigurationService';
import { EventBusService } from '../events/EventBusService';
import { LoggingService } from '../logging/LoggingService';

/**
 * Notification channel type
 */
export enum NotificationChannel {
    EMAIL = 'email',
    IN_APP = 'in-app',
    PUSH = 'push',
    SMS = 'sms',
}

/**
 * Notification priority
 */
export enum NotificationPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

/**
 * Notification template model with variable placeholders
 */
export interface NotificationTemplate {
    id: string;
    title: string;
    body: string;
    channel: NotificationChannel;
}

/**
 * Notification data structure
 */
export interface Notification {
    id: string;
    userId?: string;
    templateId: string;
    title: string;
    body: string;
    channel: NotificationChannel;
    priority: NotificationPriority;
    variables?: Record<string, string>;
    timestamp: Date;
    read?: boolean;
    sent?: boolean;
    error?: string;
}

/**
 * Notification creation options
 */
export interface SendNotificationOptions {
    userId?: string;
    templateId: string;
    variables?: Record<string, string>;
    priority?: NotificationPriority;
    channel?: NotificationChannel;
}

/**
 * Event published when a notification is created
 */
export interface NotificationCreatedEvent {
    notification: Notification;
}

/**
 * Centralized notification service for managing various types of notifications
 */
export class NotificationService {
    private static instance: NotificationService;
    private logger: LoggingService;
    private config: ConfigurationService;
    private eventBus: EventBusService;

    // In-memory store of notification templates
    private templates: Map<string, NotificationTemplate> = new Map();

    // In-memory store of notifications (in a real app, this would be a database)
    private notifications: Notification[] = [];

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();
        this.eventBus = EventBusService.getInstance();

        // Register some default templates
        this.registerDefaultTemplates();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Register a notification template
     * @param template The template to register
     */
    public registerTemplate(template: NotificationTemplate): void {
        this.templates.set(template.id, template);
        this.logger.debug(`Registered notification template: ${template.id}`, 'NotificationService');
    }

    /**
     * Get a notification template by ID
     * @param templateId The template ID
     * @returns The template or undefined if not found
     */
    public getTemplate(templateId: string): NotificationTemplate | undefined {
        return this.templates.get(templateId);
    }

    /**
     * Create and send a notification
     * @param options Notification options
     * @returns The created notification or null if template not found
     */
    public async sendNotification(options: SendNotificationOptions): Promise<Notification | null> {
        const { templateId, userId, variables = {}, priority = NotificationPriority.NORMAL, channel } = options;

        // Get the template
        const template = this.getTemplate(templateId);
        if (!template) {
            this.logger.error(`Notification template not found: ${templateId}`, 'NotificationService');
            return null;
        }

        // Apply variables to template
        const title = this.applyVariables(template.title, variables);
        const body = this.applyVariables(template.body, variables);

        // Use specified channel or template default
        const notificationChannel = channel || template.channel;

        // Create the notification
        const notification: Notification = {
            id: `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId,
            templateId,
            title,
            body,
            channel: notificationChannel,
            priority,
            variables,
            timestamp: new Date(),
            read: false,
            sent: false,
        };

        try {
            // Send the notification through the appropriate channel
            await this.deliverNotification(notification);

            // Save the notification
            this.notifications.push(notification);

            // Publish the event
            await this.eventBus.publish<NotificationCreatedEvent>('notification.created', {
                notification,
            });

            this.logger.info(
                `Sent ${notificationChannel} notification: ${notification.id}`,
                'NotificationService'
            );

            return notification;
        } catch (error) {
            this.logger.error(
                `Failed to send ${notificationChannel} notification`,
                'NotificationService',
                error
            );

            notification.error = error instanceof Error ? error.message : String(error);
            this.notifications.push(notification);

            return notification;
        }
    }

    /**
     * Get notifications for a user
     * @param userId The user ID
     * @param options Filter options
     * @returns Array of notifications
     */
    public getUserNotifications(
        userId: string,
        options: { unreadOnly?: boolean; limit?: number; channel?: NotificationChannel } = {}
    ): Notification[] {
        const { unreadOnly = false, limit, channel } = options;

        let userNotifications = this.notifications.filter((notification) => {
            let matches = notification.userId === userId;

            if (unreadOnly) {
                matches = matches && notification.read === false;
            }

            if (channel) {
                matches = matches && notification.channel === channel;
            }

            return matches;
        });

        // Sort by timestamp (newest first)
        userNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply limit if specified
        if (limit && limit > 0) {
            userNotifications = userNotifications.slice(0, limit);
        }

        return userNotifications;
    }

    /**
     * Mark a notification as read
     * @param notificationId The notification ID
     * @param userId The user ID (for verification)
     * @returns True if the notification was found and updated
     */
    public markAsRead(notificationId: string, userId: string): boolean {
        const notification = this.notifications.find(
            (n) => n.id === notificationId && n.userId === userId
        );

        if (!notification) {
            return false;
        }

        notification.read = true;

        this.logger.debug(
            `Marked notification as read: ${notificationId}`,
            'NotificationService'
        );

        return true;
    }

    /**
     * Mark all notifications as read for a user
     * @param userId The user ID
     * @returns Number of notifications marked as read
     */
    public markAllAsRead(userId: string): number {
        let count = 0;

        this.notifications.forEach((notification) => {
            if (notification.userId === userId && !notification.read) {
                notification.read = true;
                count++;
            }
        });

        if (count > 0) {
            this.logger.debug(
                `Marked ${count} notifications as read for user ${userId}`,
                'NotificationService'
            );
        }

        return count;
    }

    /**
     * Apply variables to a template string
     * @param template The template string with {{variable}} placeholders
     * @param variables The variables to apply
     * @returns The template with variables applied
     */
    private applyVariables(template: string, variables: Record<string, string>): string {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            return variables[key.trim()] || match;
        });
    }

    /**
     * Deliver a notification through the appropriate channel
     * @param notification The notification to deliver
     */
    private async deliverNotification(notification: Notification): Promise<void> {
        switch (notification.channel) {
            case NotificationChannel.EMAIL:
                await this.sendEmailNotification(notification);
                break;

            case NotificationChannel.IN_APP:
                // In-app notifications are already stored in the notifications array
                notification.sent = true;
                break;

            case NotificationChannel.PUSH:
                await this.sendPushNotification(notification);
                break;

            case NotificationChannel.SMS:
                await this.sendSmsNotification(notification);
                break;

            default:
                throw new Error(`Unsupported notification channel: ${notification.channel}`);
        }
    }

    /**
     * Send an email notification
     * @param notification The notification to send
     */
    private async sendEmailNotification(notification: Notification): Promise<void> {
        // In a real application, this would connect to an email service like SendGrid, Mailchimp, etc.
        this.logger.debug(
            `[MOCK] Sending email notification to user ${notification.userId}`,
            'NotificationService'
        );

        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        notification.sent = true;
    }

    /**
     * Send a push notification
     * @param notification The notification to send
     */
    private async sendPushNotification(notification: Notification): Promise<void> {
        // In a real application, this would connect to a push notification service like Firebase Cloud Messaging
        this.logger.debug(
            `[MOCK] Sending push notification to user ${notification.userId}`,
            'NotificationService'
        );

        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        notification.sent = true;
    }

    /**
     * Send an SMS notification
     * @param notification The notification to send
     */
    private async sendSmsNotification(notification: Notification): Promise<void> {
        // In a real application, this would connect to an SMS service like Twilio
        this.logger.debug(
            `[MOCK] Sending SMS notification to user ${notification.userId}`,
            'NotificationService'
        );

        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        notification.sent = true;
    }

    /**
     * Register default notification templates
     */
    private registerDefaultTemplates(): void {
        this.registerTemplate({
            id: 'welcome',
            title: 'Welcome to the application, {{name}}!',
            body: 'Thank you for joining. We hope you enjoy using our service.',
            channel: NotificationChannel.EMAIL,
        });

        this.registerTemplate({
            id: 'password-reset',
            title: 'Password Reset Request',
            body: 'Click the link below to reset your password: {{resetLink}}',
            channel: NotificationChannel.EMAIL,
        });

        this.registerTemplate({
            id: 'new-quiz',
            title: 'New Quiz Created',
            body: 'Your quiz "{{quizTitle}}" has been created successfully.',
            channel: NotificationChannel.IN_APP,
        });

        this.registerTemplate({
            id: 'quiz-completed',
            title: 'Quiz Completed',
            body: 'You scored {{score}} on "{{quizTitle}}".',
            channel: NotificationChannel.IN_APP,
        });
    }
} 