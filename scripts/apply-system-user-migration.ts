// This script will apply the migration to add the system user
// Run this script with: npx ts-node scripts/apply-system-user-migration.ts

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Create the migration directory if it doesn't exist
const migrationDir = path.join(__dirname, '../prisma/migrations/20250528_add_system_user');
if (!existsSync(migrationDir)) {
  console.log('Creating migration directory...');
  mkdirSync(migrationDir, { recursive: true });
}

// Apply the migration
try {
  console.log('Applying system user migration...');
  execSync('npx prisma db execute --file ./prisma/migrations/20250528_add_system_user/migration.sql', {
    stdio: 'inherit'
  });
  console.log('Migration successfully applied!');
} catch (error) {
  console.error('Failed to apply migration:', error);
}
