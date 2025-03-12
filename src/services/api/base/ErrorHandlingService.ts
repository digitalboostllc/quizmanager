import { LoggingService } from "../../logging/LoggingService";

/**
 * Centralized error handling service for consistent error handling
 */
export class ErrorHandlingService {
    private static instance: ErrorHandlingService;
    private loggingService: LoggingService;

    private constructor() {
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): ErrorHandlingService {
        if (!ErrorHandlingService.instance) {
            ErrorHandlingService.instance = new ErrorHandlingService();
        }
        return ErrorHandlingService.instance;
    }

    /**
     * Log an error with context information
     * @param error The error to log
     * @param context Context of where the error occurred
     */
    public logError(error: unknown, context: string): void {
        const message = this.getErrorMessage(error);
        this.loggingService.error(message, context, error);
    }

    /**
     * Get a formatted error message from an error object
     * @param error The error object
     * @returns Formatted error message
     */
    public getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return 'An unknown error occurred';
    }

    /**
     * Check if an error message indicates a "not found" error
     * @param message The error message
     * @returns True if it's a not found error
     */
    public isNotFoundError(message: string): boolean {
        return message.toLowerCase().includes('not found') ||
            message.toLowerCase().includes('does not exist') ||
            message.toLowerCase().includes('couldn\'t find');
    }

    /**
     * Check if an error message indicates an authentication or authorization error
     * @param message The error message
     * @returns True if it's an auth error
     */
    public isAuthError(message: string): boolean {
        return message.toLowerCase().includes('unauthorized') ||
            message.toLowerCase().includes('unauthenticated') ||
            message.toLowerCase().includes('forbidden') ||
            message.toLowerCase().includes('permission denied') ||
            message.toLowerCase().includes('not allowed');
    }
} 