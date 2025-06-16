import { NextResponse } from 'next/server';
import { isDatabaseHealthy } from './db-connection-manager';

type Handler = (req: Request, params: any) => Promise<Response>;

/**
 * Middleware to handle database connection health checks and errors consistently
 */
export function withDatabaseCheck(handler: Handler) {
  return async (req: Request, params: any) => {
    // Check if database connection is healthy
    if (!isDatabaseHealthy() && process.env.NODE_ENV === 'production') {
      console.warn('Database connection is not healthy, returning 503');
      return NextResponse.json(
        { error: 'Database service unavailable, please try again' },
        { status: 503 } // Service Unavailable
      );
    }

    try {
      // Call the original handler
      return await handler(req, params);
    } catch (error: any) {
      // Check for connection errors
      if (
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('10054') ||
        error?.code === 'P1001' ||
        error?.code === 'P1002'
      ) {
        console.error('Database connection error:', error);
        return NextResponse.json(
          { error: 'Database connection error, please try again' },
          { status: 503 }
        );
      }

      // For other errors, return a generic 500
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper to ensure all responses are valid JSON
 */
function withJsonResponseCheck(handler: Handler) {
  return async (req: Request, params: any) => {
    const response = await handler(req, params);
    
    // Only process responses that are not already Response objects
    if (response instanceof NextResponse) {
      // Add proper content-type header if missing
      if (!response.headers.get('content-type')) {
        response.headers.set('content-type', 'application/json');
      }
      return response;
    }
    
    // For any other response, ensure it's wrapped in NextResponse.json
    return NextResponse.json(response);
  };
}

/**
 * Helper for wrapping API handlers with common error handling
 */
export function createApiHandler(handler: Handler) {
  return withDatabaseCheck(withJsonResponseCheck(handler));
}
