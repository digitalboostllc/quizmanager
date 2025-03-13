import { getCachePerformance, getErrorDistribution, getPerformanceMetrics, getSlowRequests } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const metrics = {
            performance: getPerformanceMetrics(),
            slowRequests: getSlowRequests(),
            errorDistribution: getErrorDistribution(),
            cache: getCachePerformance(),
        };

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch metrics',
                code: 'METRICS_ERROR',
            },
            { status: 500 }
        );
    }
} 