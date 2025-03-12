import { ConfigurationService } from "../config/ConfigurationService";
import { LoggingService } from "../logging/LoggingService";

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
    value: T;
    expiresAt: number | null; // null means no expiration
}

/**
 * Cache options
 */
interface CacheOptions {
    ttl?: number; // Time to live in seconds, undefined means no expiration
    namespace?: string; // Optional namespace for the key
}

/**
 * Centralized caching service for efficient data caching
 * Provides in-memory caching with optional TTL
 */
export class CachingService {
    private static instance: CachingService;
    private logger: LoggingService;
    private config: ConfigurationService;

    // Main cache store
    private cache: Map<string, CacheEntry<any>> = new Map();

    // Default TTL in seconds (5 minutes)
    private defaultTTL: number = 300;

    // Cleanup interval in milliseconds (1 minute)
    private cleanupInterval: number = 60 * 1000;

    // Cleanup timer reference
    private cleanupTimer: NodeJS.Timeout | null = null;

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();

        // Get default TTL from config or use default
        this.defaultTTL = this.config.getNumber('CACHE_DEFAULT_TTL', this.defaultTTL);

        // Start cleanup timer
        this.startCleanupTimer();
    }

    public static getInstance(): CachingService {
        if (!CachingService.instance) {
            CachingService.instance = new CachingService();
        }
        return CachingService.instance;
    }

    /**
     * Set a value in the cache
     * @param key The cache key
     * @param value The value to cache
     * @param options Cache options (TTL, namespace)
     */
    public set<T>(key: string, value: T, options: CacheOptions = {}): void {
        const fullKey = this.getFullKey(key, options.namespace);
        const ttl = options.ttl !== undefined ? options.ttl : this.defaultTTL;

        // Calculate expiration time
        const expiresAt = ttl === 0 ? null : Date.now() + ttl * 1000;

        // Store in cache
        this.cache.set(fullKey, { value, expiresAt });

        this.logger.debug(`Cache set: ${fullKey}`, 'CachingService', {
            ttl,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'never'
        });
    }

    /**
     * Get a value from the cache
     * @param key The cache key
     * @param namespace Optional namespace
     * @returns The cached value or undefined if not found or expired
     */
    public get<T>(key: string, namespace?: string): T | undefined {
        const fullKey = this.getFullKey(key, namespace);
        const entry = this.cache.get(fullKey);

        // If no entry, return undefined
        if (!entry) {
            this.logger.debug(`Cache miss: ${fullKey}`, 'CachingService');
            return undefined;
        }

        // Check if expired
        if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
            this.logger.debug(`Cache expired: ${fullKey}`, 'CachingService');
            this.cache.delete(fullKey);
            return undefined;
        }

        this.logger.debug(`Cache hit: ${fullKey}`, 'CachingService');
        return entry.value as T;
    }

    /**
     * Get a value from the cache or compute it if not found
     * @param key The cache key
     * @param computeFn Function to compute the value if not in cache
     * @param options Cache options
     * @returns The cached or computed value
     */
    public async getOrSet<T>(
        key: string,
        computeFn: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const fullKey = this.getFullKey(key, options.namespace);

        // Try to get from cache first
        const cachedValue = this.get<T>(key, options.namespace);
        if (cachedValue !== undefined) {
            return cachedValue;
        }

        // Compute the value
        this.logger.debug(`Computing value for cache key: ${fullKey}`, 'CachingService');
        try {
            const value = await computeFn();

            // Store in cache
            this.set(key, value, options);

            return value;
        } catch (error) {
            this.logger.error(`Error computing value for cache: ${fullKey}`, 'CachingService', error);
            throw error;
        }
    }

    /**
     * Delete a value from the cache
     * @param key The cache key
     * @param namespace Optional namespace
     * @returns True if the key was found and deleted
     */
    public delete(key: string, namespace?: string): boolean {
        const fullKey = this.getFullKey(key, namespace);
        const result = this.cache.delete(fullKey);

        if (result) {
            this.logger.debug(`Cache delete: ${fullKey}`, 'CachingService');
        }

        return result;
    }

    /**
     * Clear all values in a namespace
     * @param namespace The namespace to clear
     * @returns Number of entries cleared
     */
    public clearNamespace(namespace: string): number {
        const prefix = `${namespace}:`;
        let count = 0;

        // Find all keys in the namespace
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                count++;
            }
        }

        if (count > 0) {
            this.logger.debug(`Cleared ${count} entries from namespace: ${namespace}`, 'CachingService');
        }

        return count;
    }

    /**
     * Clear the entire cache
     */
    public clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.logger.debug(`Cache cleared (${size} entries)`, 'CachingService');
    }

    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    public getStats(): { size: number; namespaces: Record<string, number> } {
        const namespaces: Record<string, number> = {};

        // Count entries by namespace
        for (const key of this.cache.keys()) {
            const parts = key.split(':');
            if (parts.length > 1) {
                const namespace = parts[0];
                namespaces[namespace] = (namespaces[namespace] || 0) + 1;
            } else {
                namespaces['default'] = (namespaces['default'] || 0) + 1;
            }
        }

        return {
            size: this.cache.size,
            namespaces,
        };
    }

    /**
     * Start the cleanup timer
     */
    private startCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * Clean up expired cache entries
     */
    private cleanup(): void {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt !== null && entry.expiresAt < now) {
                this.cache.delete(key);
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`, 'CachingService');
        }
    }

    /**
     * Get the full cache key with optional namespace
     * @param key The base key
     * @param namespace Optional namespace
     * @returns The full cache key
     */
    private getFullKey(key: string, namespace?: string): string {
        return namespace ? `${namespace}:${key}` : key;
    }
} 