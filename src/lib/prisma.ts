import { Prisma, PrismaClient } from '@prisma/client';

function createPrismaClient() {
  // Explicitly set connection options
  // These are crucial for serverless environments
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

  // Add middleware for query timeout and logging
  client.$use(async (params, next) => {
    const before = Date.now();

    try {
      // Create a promise that will reject after a timeout
      const queryPromise = next(params);
      const timeout = 15000; // 15 seconds timeout for queries

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

      if (duration > 2000) {
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
      });
      throw error;
    }
  });

  return client;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// In serverless environments, a new instance is created for each function call
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use a singleton pattern to manage connections
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 