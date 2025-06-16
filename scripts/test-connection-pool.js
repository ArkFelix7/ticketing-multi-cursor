// Simple script to test database connection pooling and resilience
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Create Prisma client with connection logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Number of concurrent queries to run
const CONCURRENCY = 5;
// Number of iterations per batch
const ITERATIONS = 10;
// Delay between batches in ms
const DELAY = 500;

async function runQuery(id) {
  try {
    console.log(`Query ${id} starting...`);
    const start = Date.now();
    
    // Run a simple query
    const result = await prisma.$queryRaw`SELECT pg_sleep(0.1), ${id} as test_id`;
    
    const duration = Date.now() - start;
    console.log(`✅ Query ${id} completed in ${duration}ms`);
    return true;
  } catch (error) {
    console.error(`❌ Query ${id} failed: ${error.message}`);
    return false;
  }
}

async function testConnectionPool() {
  console.log('Testing database connection pooling...');
  console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 40)}...`);
  console.log(`Concurrency: ${CONCURRENCY}, Iterations: ${ITERATIONS}, Delay: ${DELAY}ms`);
  
  let successCount = 0;
  let failureCount = 0;
  
  try {
    // Try to connect
    console.log('Establishing initial connection...');
    await prisma.$connect();
    console.log('✅ Initial connection successful');
    
    // Run batches of concurrent queries
    for (let batch = 1; batch <= ITERATIONS; batch++) {
      console.log(`\nRunning batch ${batch}/${ITERATIONS}...`);
      
      // Create an array of query promises
      const queries = Array.from({ length: CONCURRENCY }, (_, i) => {
        const queryId = `${batch}.${i+1}`;
        return runQuery(queryId);
      });
      
      // Run queries concurrently
      const results = await Promise.allSettled(queries);
      
      // Track results
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value === true) {
          successCount++;
        } else {
          failureCount++;
        }
      });
      
      // Wait before next batch
      if (batch < ITERATIONS) {
        console.log(`Waiting ${DELAY}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY));
      }
    }
    
    return {
      success: successCount,
      failures: failureCount,
      total: successCount + failureCount
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: successCount,
      failures: failureCount + 1,
      total: successCount + failureCount + 1
    };
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testConnectionPool()
  .then(results => {
    console.log('\n--- TEST RESULTS ---');
    console.log(`Total queries: ${results.total}`);
    console.log(`Successful: ${results.success}`);
    console.log(`Failed: ${results.failures}`);
    console.log(`Success rate: ${(results.success / results.total * 100).toFixed(2)}%`);
    process.exit(results.failures > 0 ? 1 : 0);
  });
