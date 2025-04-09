import { NextResponse } from 'next/server';

// Performance metrics interface
interface PerformanceMetrics {
    path: string;
    method: string;
    duration: number;
    statusCode: number;
    timestamp: number;
    cacheHit: boolean;
    error?: string;
}

// In-memory store for metrics (in production, use a proper metrics service)
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Keep last 1000 requests

// Helper to track API performance
export function trackPerformance(
    response: NextResponse | null,
    path: string,
    method: string,
    startTime: number,
    cacheHit: boolean = false,
    error?: string
) {
    const duration = Date.now() - startTime;

    // Handle potentially null response
    if (!response) {
        console.error(`Null response in trackPerformance for ${method} ${path}`);

        const metrics: PerformanceMetrics = {
            path,
            method,
            duration,
            statusCode: 500, // Assume server error if response is null
            timestamp: Date.now(),
            cacheHit,
            error: error || 'Null response',
        };

        metricsStore.push(metrics);

        if (metricsStore.length > MAX_METRICS) {
            metricsStore.shift();
        }

        console.error(`API error: ${method} ${path} - Null response`);
        return;
    }

    const metrics: PerformanceMetrics = {
        path,
        method,
        duration,
        statusCode: response.status,
        timestamp: Date.now(),
        cacheHit,
        error,
    };

    // Add to store
    metricsStore.push(metrics);

    // Keep only the last MAX_METRICS
    if (metricsStore.length > MAX_METRICS) {
        metricsStore.shift();
    }

    // Log slow requests
    if (duration > 1000) { // Log requests taking more than 1 second
        console.warn(`Slow API request detected: ${method} ${path} took ${duration}ms`);
    }

    // Log errors
    if (error) {
        console.error(`API error: ${method} ${path} - ${error}`);
    }
}

// Helper to get performance metrics
export function getPerformanceMetrics() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;

    // Filter metrics from the last hour
    const recentMetrics = metricsStore.filter(m => m.timestamp > lastHour);

    // Calculate statistics
    const stats = {
        totalRequests: recentMetrics.length,
        averageDuration: recentMetrics.reduce((acc, m) => acc + m.duration, 0) / recentMetrics.length || 0,
        slowRequests: recentMetrics.filter(m => m.duration > 1000).length,
        errorRate: recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length || 0,
        cacheHitRate: recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length || 0,
        requestsByPath: recentMetrics.reduce((acc, m) => {
            acc[m.path] = (acc[m.path] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        requestsByMethod: recentMetrics.reduce((acc, m) => {
            acc[m.method] = (acc[m.method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    };

    return stats;
}

// Helper to get slow requests
export function getSlowRequests(threshold: number = 1000) {
    return metricsStore
        .filter(m => m.duration > threshold)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10); // Get top 10 slowest requests
}

// Helper to get error distribution
export function getErrorDistribution() {
    return metricsStore
        .filter(m => m.statusCode >= 400)
        .reduce((acc, m) => {
            acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
}

// Helper to get cache performance
export function getCachePerformance() {
    const total = metricsStore.length;
    const hits = metricsStore.filter(m => m.cacheHit).length;
    const misses = total - hits;

    return {
        total,
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0,
        missRate: total > 0 ? misses / total : 0,
    };
} 