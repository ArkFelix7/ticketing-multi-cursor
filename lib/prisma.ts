import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Configure with connection management and retry settings
const prismaClientSingleton = () => {
  // Skip Prisma client creation during build if no DATABASE_URL is provided
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
    console.warn('DATABASE_URL not found, creating mock Prisma client for build');
    return {} as PrismaClient;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Add connection management options
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add retry settings for transient connection errors
    errorFormat: 'pretty',
  });
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit due to instantiating too many clients
export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Create a connection manager for retry logic
export const prismaWithRetry = {
  async query<T>(queryFn: () => Promise<T>): Promise<T> {
    const MAX_RETRIES = 3;
    let retries = 0;
    let lastError: any;

    while (retries < MAX_RETRIES) {
      try {
        return await queryFn();
      } catch (error: any) {
        lastError = error;
        
        // Only retry on connection errors (like ECONNRESET - error code 10054)
        if (error?.code === 'P1001' || 
            error?.code === 'P1002' || 
            error?.message?.includes('ECONNRESET') ||
            error?.message?.includes('10054')) {
          retries++;
          console.warn(`Database connection error, retrying (${retries}/${MAX_RETRIES})...`);
          // Add exponential backoff delay
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // If we've exhausted retries, throw the last error
    throw lastError;
  }
};

export default prisma;
