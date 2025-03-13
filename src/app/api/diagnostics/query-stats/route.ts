import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get table statistics using a safer approach
        const tableNames = ['Quiz', 'Template', 'User', 'ScheduledPost'];

        // Collect counts for each table
        const tableCounts = await Promise.all(
            tableNames.map(async (tableName) => {
                const start = performance.now();
                let count = 0;

                // Use a safer approach to count each table
                switch (tableName) {
                    case 'Quiz':
                        count = await prisma.quiz.count();
                        break;
                    case 'Template':
                        count = await prisma.template.count();
                        break;
                    case 'User':
                        count = await prisma.user.count();
                        break;
                    case 'ScheduledPost':
                        count = await prisma.scheduledPost.count();
                        break;
                }

                const end = performance.now();

                return {
                    table: tableName,
                    count,
                    queryTime: Math.round(end - start)
                };
            })
        );

        // Get sample query execution times
        const queryPerformance = await measureQueries();

        // Get database metadata if possible
        let databaseMetadata: Record<string, unknown> = {};
        try {
            const metadataResult = await prisma.$queryRaw`
        SELECT 
          current_setting('max_connections') as max_connections,
          current_setting('shared_buffers') as shared_buffers,
          current_setting('work_mem') as work_mem,
          version() as postgres_version
      `;
            databaseMetadata = metadataResult as Record<string, unknown>;
        } catch (e) {
            console.error('Could not fetch database metadata:', e);
            // Fail gracefully - this isn't critical
            databaseMetadata = { error: 'Could not fetch database metadata' };
        }

        // Return all the statistics
        return NextResponse.json({
            tableCounts,
            queryPerformance,
            databaseMetadata,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error in diagnostics/query-stats:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get database statistics' },
            { status: 500 }
        );
    }
}

// Helper function to measure various query performance
async function measureQueries() {
    const results = [];

    // Measure a simple Quiz query
    try {
        const start = performance.now();
        await prisma.quiz.findFirst({
            select: { id: true }
        });
        const end = performance.now();
        results.push({
            name: 'Simple Query (findFirst)',
            duration: Math.round(end - start)
        });
    } catch (e) {
        results.push({
            name: 'Simple Query (findFirst)',
            error: e instanceof Error ? e.message : 'Unknown error'
        });
    }

    // Measure a more complex query with relations
    try {
        const start = performance.now();
        await prisma.quiz.findFirst({
            include: {
                template: true,
                user: true
            }
        });
        const end = performance.now();
        results.push({
            name: 'Complex Query (with relations)',
            duration: Math.round(end - start)
        });
    } catch (e) {
        results.push({
            name: 'Complex Query (with relations)',
            error: e instanceof Error ? e.message : 'Unknown error'
        });
    }

    // Measure a filtered query
    try {
        const start = performance.now();
        await prisma.quiz.findMany({
            where: {
                status: 'PUBLISHED'
            },
            take: 10
        });
        const end = performance.now();
        results.push({
            name: 'Filtered Query (status=PUBLISHED)',
            duration: Math.round(end - start)
        });
    } catch (e) {
        results.push({
            name: 'Filtered Query (status=PUBLISHED)',
            error: e instanceof Error ? e.message : 'Unknown error'
        });
    }

    // Measure a text search query
    try {
        const start = performance.now();
        await prisma.quiz.findMany({
            where: {
                title: {
                    contains: 'test',
                    mode: 'insensitive'
                }
            },
            take: 10
        });
        const end = performance.now();
        results.push({
            name: 'Text Search Query (title contains "test")',
            duration: Math.round(end - start)
        });
    } catch (e) {
        results.push({
            name: 'Text Search Query (title contains "test")',
            error: e instanceof Error ? e.message : 'Unknown error'
        });
    }

    return results;
} 