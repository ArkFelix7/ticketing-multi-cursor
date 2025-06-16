/**
 * Database Connection Manager
 * 
 * This module provides utilities for managing database connections,
 * handling connection pooling, retries, and monitoring.
 */

import prisma from './prisma';

// Connection pool health check
let isHealthy = true;
let healthCheckId: NodeJS.Timeout | null = null;
const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

/**
 * Start a periodic health check to monitor database connectivity
 */
export function startHealthCheck() {
  if (healthCheckId) return; // Already started

  healthCheckId = setInterval(async () => {
    try {
      // Execute a lightweight query to test connection
      await prisma.$queryRaw`SELECT 1 as health_check`;
      
      if (!isHealthy) {
        console.log('Database connection restored');
        isHealthy = true;
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      isHealthy = false;
    }
  }, HEALTH_CHECK_INTERVAL);
  
  // Ensure this doesn't prevent Node from exiting
  if (healthCheckId.unref) {
    healthCheckId.unref();
  }
}

/**
 * Stop the health check interval
 */
export function stopHealthCheck() {
  if (healthCheckId) {
    clearInterval(healthCheckId);
    healthCheckId = null;
  }
}

/**
 * Check if the database connection is currently healthy
 */
export function isDatabaseHealthy() {
  return isHealthy;
}

/**
 * Execute a database transaction with retry logic
 */
export async function executeTransaction<T>(
  callback: (tx: any) => Promise<T>, 
  options = { maxRetries: 3 }
): Promise<T> {
  let attempt = 0;
  
  while (attempt < options.maxRetries) {
    try {
      return await prisma.$transaction(callback);
    } catch (error: any) {
      attempt++;
      
      // Check if it's a connection error worth retrying
      const isConnectionError = 
        error?.code === 'P1001' || 
        error?.code === 'P1002' || 
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('10054');
      
      if (!isConnectionError || attempt >= options.maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      console.warn(`Database transaction failed, retrying in ${delay}ms (attempt ${attempt}/${options.maxRetries})`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Maximum retry attempts reached');
}

// Start health check automatically in production
if (process.env.NODE_ENV === 'production') {
  startHealthCheck();
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    stopHealthCheck();
    prisma.$disconnect();
  });
}

export default {
  startHealthCheck,
  stopHealthCheck,
  isDatabaseHealthy,
  executeTransaction,
};
