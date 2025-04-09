/**
 * Simple in-memory cache for templates to improve performance
 */

const CACHE_TTL = 300000; // 5 minutes in milliseconds

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

// Cache storage
const templateCache: Record<string, CacheItem<any>> = {};

/**
 * Get a template from the cache
 */
export function getTemplateCache<T>(id: string): T | null {
    const cacheItem = templateCache[id];

    if (!cacheItem) {
        return null;
    }

    // Check if cache item has expired
    if (Date.now() - cacheItem.timestamp > CACHE_TTL) {
        delete templateCache[id];
        return null;
    }

    return cacheItem.data;
}

/**
 * Set a template in the cache
 */
export function setTemplateCache<T>(id: string, data: T): void {
    templateCache[id] = {
        data,
        timestamp: Date.now(),
    };
}

/**
 * Clear the entire template cache
 */
export function clearTemplateCache(): void {
    Object.keys(templateCache).forEach(key => {
        delete templateCache[key];
    });
}

/**
 * Clear a specific template from the cache
 */
export function clearTemplateCacheItem(id: string): void {
    delete templateCache[id];
}

/**
 * Get cache stats
 */
export function getTemplateCacheStats() {
    return {
        size: Object.keys(templateCache).length,
        items: Object.keys(templateCache),
    };
} 