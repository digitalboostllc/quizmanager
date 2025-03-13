import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  });

  // Add middleware for query timeout and logging
  client.$use(async (params, next) => {
    const before = Date.now();

    try {
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      if (duration > 5000) {
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
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 