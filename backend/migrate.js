/**
 * Database Migration
 * 
 * Adds password column to users table if it doesn't exist
 * Run this once to prepare the database for authentication
 */

import pool from './config/db.js';

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    // Add password column to users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT '';
    `);

    console.log('✅ Migration complete - password column added to users table');

    // Verify the column exists
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verified: password column exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
