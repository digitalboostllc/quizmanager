import { Prisma, PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Connection pooling settings optimized for serverless
  const connectionOptions: Prisma.PrismaClientOptions = {
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn'] as Prisma.LogLevel[]
      : ['error'] as Prisma.LogLevel[],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
    // Configure connection timeouts for Supabase
    // Reference: https://www.prisma.io/docs/orm/prisma-client/deployment/connection-pooling
  };

  const client = new PrismaClient(connectionOptions);

  // Add connection pool warmup to ensure connections are ready
  async function warmupConnectionPool() {
    try {
      // Execute a simple query to warm up the connection
      await client.$queryRaw`SELECT 1`;
      console.log('Connection pool warmed up successfully');
    } catch (e) {
      console.error('Failed to warm up connection pool:', e);
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
      const timeout = 8000; // Reduced timeout to 8 seconds to fail faster

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

      if (duration > 1000) { // Lower threshold to 1 second for highlighting slow queries
        console.warn(`Slow query detected (${duration}ms):`, {
          model: params.model,
          action: params.action,
          duration,
          args: JSON.stringify(params.args).substring(0, 200) + '...',
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
        stack: error.stack
      });
      throw error;
    }
  });

  return client;
}

// Preserve connection pool across hot reloads in development
export const prisma = globalForPrisma.prisma || createPrismaClient();

// Important: close the connection when the Node.js process ends
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add connection cleanup for serverless environment
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 