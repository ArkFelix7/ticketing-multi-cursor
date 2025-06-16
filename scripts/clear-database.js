// Script to clear all tables in the Supabase database
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🔄 Starting database clearing process...');
  
  try {
    // Delete records in reverse order to respect foreign key constraints
    console.log('Deleting attachments...');
    await prisma.attachment.deleteMany({});
    
    console.log('Deleting messages...');
    await prisma.message.deleteMany({});
    
    console.log('Deleting tickets...');
    await prisma.ticket.deleteMany({});
    
    console.log('Deleting emails...');
    await prisma.email.deleteMany({});
    
    console.log('Deleting mailboxes...');
    await prisma.mailbox.deleteMany({});
    
    console.log('Deleting users...');
    await prisma.user.deleteMany({});
    
    console.log('Deleting companies...');
    await prisma.company.deleteMany({});
    
    console.log('✅ All database tables have been cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => {
    console.log('Database clearing operation completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during database clearing:', error);
    process.exit(1);
  });
