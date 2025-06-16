/**
 * Enhanced error handling utility functions
 */
import logger from './logger';

export interface ErrorDetails {
  message: string;
  source: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * A set of utilities for error handling and logging
 */
export const ErrorUtils = {
  /**
   * Log an error with proper context
   */
  logError(error: Error | unknown, source: string, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    logger.error(`[${source}] ${errorObj.message}`, {
      source,
      stack: errorObj.stack,
      ...(context || {})
    });
  },

  /**
   * Format an error for API responses
   */
  formatErrorResponse(error: Error | unknown, source: string): ErrorDetails {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    return {
      message: errorObj.message,
      source,
      stack: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined
    };
  },
  
  /**
   * Safely parse JSON with error handling
   */
  safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      this.logError(error, 'safeJsonParse', { json });
      return defaultValue;
    }
  }
};
