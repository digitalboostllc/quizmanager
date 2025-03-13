import { Prisma, PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Connection pooling settings optimized for Supabase Pro in a serverless environment
  const connectionOptions: Prisma.PrismaClientOptions = {
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn'] as Prisma.LogLevel[]
      : ['error'] as Prisma.LogLevel[],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  };

  const client = new PrismaClient(connectionOptions);

  // Add connection pool warmup to ensure connections are ready
  async function warmupConnectionPool() {
    try {
      // Execute a simple query to warm up the connection
      const startTime = Date.now();
      await client.$queryRaw`SELECT 1`;
      const duration = Date.now() - startTime;
      console.log(`Connection pool warmed up successfully in ${duration}ms`);
    } catch (e) {
      console.error('Failed to warm up connection pool:', e);
      // No need to rethrow - we'll let normal queries establish connections if warmup fails
    }
  }

  // Warm up the connection pool
  warmupConnectionPool();

  // Add middleware for query timeout and logging
  client.$use(async (params, next) => {
    const before = Date.now();

    try {
      // Create a promise that will reject after a timeout
      const queryPromise = next(params);

      // On Supabase Pro, we can use a longer timeout since we have more resources
      // and better connection pooling capabilities
      const timeout = process.env.NODE_ENV === 'production' ? 12000 : 8000; // 12 seconds in prod, 8 in dev

      // Set up a timeout for the query
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error(`Query ${params.model}.${params.action} timed out after ${timeout}ms`));
        }, timeout);
      });

      // Race between the query and the timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);

      const after = Date.now();
      const duration = after - before;

      // Lower logging threshold in production to catch more potential issues
      const slowThreshold = process.env.NODE_ENV === 'production' ? 500 : 1000; // ms

      if (duration > slowThreshold) {
        console.warn(`Slow query detected (${duration}ms):`, {
          model: params.model,
          action: params.action,
          duration,
          args: params.args ? JSON.stringify(params.args).substring(0, 200) + '...' : 'none',
        });
      }

      return result;
    } catch (e) {
      const after = Date.now();
      const error = e as Error;

      console.error(`Query failed after ${after - before}ms:`, {
        model: params.model,
        action: params.action,
        error: error.message,
        code: (error as any).code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // Only include stack in dev
      });

      throw error;
    }
  });

  return client;
}

// Preserve connection pool across hot reloads in development
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// More aggressive cleanup in serverless environments
if (process.env.NODE_ENV === 'production') {
  // Listen for serverless function completion
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  // Handle shutdown signals
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
} 