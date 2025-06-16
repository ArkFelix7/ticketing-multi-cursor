// lib/logger.ts
/**
 * Simple logger module for the ticketing system
 * Provides consistent logging throughout the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configure minimum log level
const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.info  // In production, only log info and above
  : LOG_LEVELS.debug; // In development, log everything

/**
 * Create a formatted log entry
 */
function createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
}

/**
 * Log to console with proper formatting based on level
 */
function logToConsole(entry: LogEntry): void {
  const { timestamp, level, message, context } = entry;
  const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
  
  switch (level) {
    case 'debug':
      console.debug(prefix, message, context ? context : '');
      break;
    case 'info':
      console.info(prefix, message, context ? context : '');
      break;
    case 'warn':
      console.warn(prefix, message, context ? context : '');
      break;
    case 'error':
      console.error(prefix, message, context ? context : '');
      break;
  }
}

/**
 * Main logging function
 */
function log(level: LogLevel, message: string, context?: Record<string, any>): void {
  if (LOG_LEVELS[level] >= MIN_LOG_LEVEL) {
    const entry = createLogEntry(level, message, context);
    logToConsole(entry);
  }
}

// Public API
export const logger = {
  debug: (message: string, context?: Record<string, any>) => log('debug', message, context),
  info: (message: string, context?: Record<string, any>) => log('info', message, context),
  warn: (message: string, context?: Record<string, any>) => log('warn', message, context),
  error: (message: string, context?: Record<string, any>) => log('error', message, context),
};

export default logger;
