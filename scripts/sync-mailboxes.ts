// scripts/sync-mailboxes.ts
import prisma from '../lib/prisma';
import { syncAllMailboxes } from '../lib/mailbox-sync';
import logger from '../lib/logger';

async function main() {
  logger.info('===== Starting mailbox synchronization script =====');
  
  try {
    // Get all active mailboxes
    const mailboxes = await prisma.mailbox.findMany({
      where: { isActive: true },
      include: { company: true }
    });
    
    logger.info(`Found ${mailboxes.length} active mailboxes to sync`);
    
    // Process them one by one
    const result = await syncAllMailboxes();
    
    const successCount = result.results?.filter((r: any) => r.success).length || 0;
    logger.info('Mailbox sync completed', { 
      totalProcessed: result.results?.length || 0,
      successCount,
      errorCount: (result.results?.length || 0) - successCount
    });
  } catch (error: any) {
    logger.error('Failed to sync mailboxes:', { 
      error: error.message,
      stack: error.stack 
    });
  } finally {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
}

main()
  .catch(e => {
    logger.error('Unhandled error in sync-mailboxes script:', { 
      error: e.message,
      stack: e.stack
    });
    process.exit(1);
  })
  .finally(() => {
    logger.info('===== Sync process completed =====');
    process.exit(0);
  });
