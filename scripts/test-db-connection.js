// Simple script to test database connection
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing database connection...');
  console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 40)}...`);
  console.log(`Using DIRECT_URL: ${process.env.DIRECT_URL?.substring(0, 40)}...`);
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Try a simple query
    console.log('Executing test query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

testConnection()
  .then(success => {
    console.log(`Database connection test ${success ? 'passed ✅' : 'failed ❌'}`);
    process.exit(success ? 0 : 1);
  });