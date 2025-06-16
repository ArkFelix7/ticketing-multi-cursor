import { prisma, prismaWithRetry } from './prisma';
import connectionManager from './db-connection-manager';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Try the query with our retry mechanism
    await prismaWithRetry.query(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });
    console.log('✅ Database connection successful');
    
    // Start the health check monitoring
    connectionManager.startHealthCheck();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Function to validate environment variables
export function validateDbEnvVars(): boolean {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing in environment variables');
    return false;
  }
  
  if (!directUrl) {
    console.warn('⚠️ DIRECT_URL is missing. This may be needed for prisma migrations');
  }
  
  if (dbUrl.includes('YOUR_SUPABASE_DB_HOST')) {
    console.error('❌ DATABASE_URL contains placeholder values and has not been properly configured');
    return false;
  }
  
  // Check for pgbouncer configuration
  if (!dbUrl.includes('pgbouncer=true')) {
    console.warn('⚠️ DATABASE_URL should include pgbouncer=true for connection pooling with Supabase');
  }
  
  return true;
}

// Function to gracefully disconnect from the database
export async function disconnectDatabase(): Promise<void> {
  try {
    // Stop the health check
    connectionManager.stopHealthCheck();
    
    // Disconnect from the database
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}