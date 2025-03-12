import { PrismaClient } from '@prisma/client';
import { ConfigurationService } from '../config/ConfigurationService';
import { LoggingService } from '../logging/LoggingService';

/**
 * Centralized database service for consistent database access
 * Manages connections and provides query methods with proper error handling
 */
export class DatabaseService {
    private static instance: DatabaseService;
    private logger: LoggingService;
    private config: ConfigurationService;
    private prisma: PrismaClient;
    private isConnected: boolean = false;

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();
        this.prisma = new PrismaClient({
            log: this.getLogLevels(),
        });
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Get the Prisma Client instance
     * Ensures the connection is established before returning
     */
    public async getClient(): Promise<PrismaClient> {
        if (!this.isConnected) {
            await this.connect();
        }
        return this.prisma;
    }

    /**
     * Connect to the database
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            this.logger.info('Connecting to database...', 'DatabaseService');
            await this.prisma.$connect();
            this.isConnected = true;
            this.logger.info('Database connection established', 'DatabaseService');
        } catch (error) {
            this.logger.error('Failed to connect to database', 'DatabaseService', error);
            throw new Error('Database connection failed');
        }
    }

    /**
     * Disconnect from the database
     */
    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            this.logger.info('Disconnecting from database...', 'DatabaseService');
            await this.prisma.$disconnect();
            this.isConnected = false;
            this.logger.info('Database connection closed', 'DatabaseService');
        } catch (error) {
            this.logger.error('Failed to disconnect from database', 'DatabaseService', error);
        }
    }

    /**
     * Execute a database query with automatic retry and proper error handling
     * @param operation Name of the operation for logging
     * @param queryFn The query function to execute
     * @returns The query result
     */
    public async executeQuery<T>(
        operation: string,
        queryFn: (prisma: PrismaClient) => Promise<T>
    ): Promise<T> {
        const maxRetries = this.config.getNumber('DATABASE_MAX_RETRIES', 3);
        let retries = 0;

        while (true) {
            try {
                // Ensure connection is established
                const client = await this.getClient();

                // Start tracking query time
                const startTime = Date.now();

                // Execute the query
                this.logger.debug(`Executing database operation: ${operation}`, 'DatabaseService');
                const result = await queryFn(client);

                // Log query time
                const endTime = Date.now();
                const duration = endTime - startTime;
                this.logger.debug(
                    `Database operation completed in ${duration}ms: ${operation}`,
                    'DatabaseService'
                );

                return result;
            } catch (error) {
                retries++;

                // Check if we should retry
                if (this.isRetryableError(error) && retries < maxRetries) {
                    const retryDelay = Math.min(100 * Math.pow(2, retries), 3000); // Exponential backoff
                    this.logger.warn(
                        `Database operation failed, retrying in ${retryDelay}ms (${retries}/${maxRetries}): ${operation}`,
                        'DatabaseService',
                        error
                    );

                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, retryDelay));

                    // If connection issue, reconnect
                    if (!this.isConnected) {
                        await this.connect();
                    }
                } else {
                    // Log and rethrow the error
                    this.logger.error(
                        `Database operation failed: ${operation}`,
                        'DatabaseService',
                        error
                    );
                    throw error;
                }
            }
        }
    }

    /**
     * Check if an error is retryable
     * @param error The error to check
     * @returns True if the error is retryable
     */
    private isRetryableError(error: any): boolean {
        // Check for connection errors or transient errors
        const errorCode = error?.code;
        if (!errorCode) return false;

        // Common retryable error codes
        const retryableCodes = [
            'P1001', // Prisma connection error
            'P1002', // Prisma timeout
            'P1008', // Operations timed out
            'P1017', // Server closed the connection
            // Add more as needed
        ];

        return retryableCodes.includes(errorCode);
    }

    /**
     * Get the log levels for Prisma based on the environment
     */
    private getLogLevels(): Array<'query' | 'info' | 'warn' | 'error'> {
        const isProd = process.env.NODE_ENV === 'production';

        if (isProd) {
            return ['error', 'warn'];
        }

        return ['query', 'info', 'warn', 'error'];
    }
} 