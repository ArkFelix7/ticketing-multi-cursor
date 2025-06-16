// scripts/test-mailbox-sync-api.ts
/**
 * This script tests the mailbox sync API endpoint
 * to verify that it returns valid JSON responses
 */
import fetch from 'node-fetch';
import logger from '../lib/logger';
import dotenv from 'dotenv';
import type { SyncAllMailboxesResult } from '../types/mailbox-sync';

// Load environment variables
dotenv.config();

async function testMailboxSyncApi() {
  logger.info('===== Testing mailbox sync API =====');
  
  try {
    logger.info('Testing POST endpoint...');
    const postResponse = await fetch('http://localhost:3000/api/mailbox/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    logger.info(`POST response status: ${postResponse.status}`);
      // Check that we can parse the response as JSON
    try {
      const postJson = await postResponse.json() as SyncAllMailboxesResult;
      logger.info('Successfully parsed POST response as JSON', { 
        success: postJson.success,
        hasResults: !!postJson.results,
        resultsLength: postJson.results?.length || 0
      });
    } catch (parseError: any) {
      logger.error('Failed to parse POST response as JSON', { error: parseError.message });
      throw parseError;
    }
    
    logger.info('Testing GET endpoint...');
    const getResponse = await fetch('http://localhost:3000/api/mailbox/sync');
    
    logger.info(`GET response status: ${getResponse.status}`);
      // Check that we can parse the response as JSON
    try {
      const getJson = await getResponse.json() as SyncAllMailboxesResult;
      logger.info('Successfully parsed GET response as JSON', { 
        success: getJson.success,
        hasResults: !!getJson.results,
        resultsLength: getJson.results?.length || 0
      });
    } catch (parseError: any) {
      logger.error('Failed to parse GET response as JSON', { error: parseError.message });
      throw parseError;
    }
    
    logger.info('All tests passed!');
    return { success: true };
  } catch (error: any) {
    logger.error('Test failed', { error: error.message, stack: error.stack });
    return { success: false, error: error.message };
  }
}

// Run the test
(async () => {
  try {
    const result = await testMailboxSyncApi();
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  }
})();
