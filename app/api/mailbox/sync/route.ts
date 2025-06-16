import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { syncMailbox, syncAllMailboxes } from '../../../../lib/mailbox-sync';
import logger from '../../../../lib/logger';
import { createApiHandler } from '../../../../lib/api-middleware';

// This endpoint syncs mailboxes, creates tickets, and sends auto-replies
export const POST = createApiHandler(async (request: Request) => {
  logger.info('POST /api/mailbox/sync - Starting mailbox sync');

  // Check if we're syncing a specific mailbox or all of them
  let data: { mailboxId?: string } = {};
  try {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await request.json();
    }
  } catch (jsonError: any) {
    // If request body is empty or invalid, continue with empty object
    logger.warn('Invalid JSON in request body', { 
      error: jsonError.message,
      path: '/api/mailbox/sync'
    });
  }
    
  const { mailboxId } = data;
  let result;
  
  try {  
    if (mailboxId) {
      // Sync specific mailbox
      logger.info(`Syncing specific mailbox`, { mailboxId });
      result = await syncMailbox(mailboxId);
    } else {
      // Sync all active mailboxes
      logger.info('Syncing all active mailboxes');
      result = await syncAllMailboxes();
    }

    logger.info('Mailbox sync completed', { 
      success: result?.success || false,
      mailboxId: mailboxId || 'all'
    });

    // Ensure we always return a valid JSON object
    const responseData = result || { success: true };
    
    // Make sure the response has the expected structure for the client
    if (typeof responseData !== 'object') {
      return NextResponse.json({ 
        success: true, 
        message: 'Operation completed', 
        data: responseData 
      });
    }
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('Mailbox sync error:', { 
      error: error.message,
      stack: error.stack,
      mailboxId: mailboxId || 'all'
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during mailbox sync'
      }, 
      { status: 500 }
    );
  }
});

// Add a scheduled sync API endpoint for cron jobs or manual triggers
export const GET = createApiHandler(async () => {
  logger.info('GET /api/mailbox/sync - Starting scheduled mailbox sync');
  
  try {
    const result = await syncAllMailboxes();
    
    logger.info('Scheduled mailbox sync completed', { 
      success: result?.success || false,
      totalMailboxes: result?.results?.length || 0
    });
    
    // Ensure we always return a valid JSON object
    const responseData = result || { success: true };
    
    // Make sure the response has the expected structure for the client
    if (typeof responseData !== 'object') {
      return NextResponse.json({ 
        success: true, 
        message: 'Scheduled sync completed', 
        data: responseData 
      });
    }
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    logger.error('Scheduled mailbox sync error:', { 
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during scheduled sync'
      }, 
      { status: 500 }
    );
  }
});