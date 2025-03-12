import { ConfigurationService } from "../config/ConfigurationService";

/**
 * Log levels
 */
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

/**
 * Log entry structure
 */
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
}

/**
 * Centralized logging service for consistent logging across the application
 */
export class LoggingService {
    private static instance: LoggingService;
    private configService: ConfigurationService;

    // Track log history for potential reporting or debugging
    private logHistory: LogEntry[] = [];
    private maxHistorySize: number = 100;

    private constructor() {
        this.configService = ConfigurationService.getInstance();
    }

    public static getInstance(): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }

    /**
     * Log a debug message
     * @param message The message to log
     * @param context Optional context of where the log is coming from
     * @param data Optional data to include in the log
     */
    public debug(message: string, context?: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, context, data);
    }

    /**
     * Log an info message
     * @param message The message to log
     * @param context Optional context of where the log is coming from
     * @param data Optional data to include in the log
     */
    public info(message: string, context?: string, data?: any): void {
        this.log(LogLevel.INFO, message, context, data);
    }

    /**
     * Log a warning message
     * @param message The message to log
     * @param context Optional context of where the log is coming from
     * @param data Optional data to include in the log
     */
    public warn(message: string, context?: string, data?: any): void {
        this.log(LogLevel.WARN, message, context, data);
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param context Optional context of where the log is coming from
     * @param error Optional error to include in the log
     */
    public error(message: string, context?: string, error?: any): void {
        // If the error is an Error object, extract useful information
        const errorData = error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            }
            : error;

        this.log(LogLevel.ERROR, message, context, errorData);
    }

    /**
     * Log a message at the specified level
     * @param level The log level
     * @param message The message to log
     * @param context Optional context of where the log is coming from
     * @param data Optional data to include in the log
     */
    private log(level: LogLevel, message: string, context?: string, data?: any): void {
        // Only log if the level is sufficient based on environment
        if (!this.shouldLog(level)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const entry: LogEntry = {
            timestamp,
            level,
            message,
            context,
            data,
        };

        // Add to history, maintaining max size
        this.addToHistory(entry);

        // Format the log message
        const formattedMessage = this.formatLogMessage(entry);

        // Log to the appropriate console method
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, data);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, data);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, data);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, data);
                break;
        }

        // In production, we might want to send logs to a service like Sentry or Datadog
        if (process.env.NODE_ENV === 'production') {
            this.sendToExternalService(entry);
        }
    }

    /**
     * Format a log entry into a string
     * @param entry The log entry to format
     * @returns Formatted log message
     */
    private formatLogMessage(entry: LogEntry): string {
        const contextPart = entry.context ? `[${entry.context}] ` : '';
        return `${entry.timestamp} ${entry.level.toUpperCase()} ${contextPart}${entry.message}`;
    }

    /**
     * Determine if a message at the given level should be logged
     * @param level The log level
     * @returns True if the message should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        // Get minimum log level from environment or use default based on environment
        const minLevel = this.configService.getString(
            'LOG_LEVEL',
            process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
        );

        // Convert levels to numeric values for comparison
        const levels = {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 1,
            [LogLevel.WARN]: 2,
            [LogLevel.ERROR]: 3,
        };

        return levels[level] >= levels[minLevel as LogLevel];
    }

    /**
     * Add a log entry to the history, maintaining max size
     * @param entry The log entry to add
     */
    private addToHistory(entry: LogEntry): void {
        this.logHistory.push(entry);
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    }

    /**
     * Send logs to an external service in production
     * This is a placeholder for integration with services like Sentry, Datadog, etc.
     * @param entry The log entry to send
     */
    private sendToExternalService(entry: LogEntry): void {
        // This is where you would integrate with a service like Sentry, Datadog, etc.
        // For example:

        // if (entry.level === LogLevel.ERROR && typeof window !== 'undefined' && window.Sentry) {
        //   window.Sentry.captureException(entry.data || entry.message);
        // }
    }

    /**
     * Get the recent log history
     * @returns Array of recent log entries
     */
    public getLogHistory(): LogEntry[] {
        return [...this.logHistory];
    }

    /**
     * Clear the log history
     */
    public clearLogHistory(): void {
        this.logHistory = [];
    }
} 