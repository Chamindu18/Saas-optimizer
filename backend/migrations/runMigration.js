/**
 * Database Migration Runner
 * 
 * Executes SQL migration to set up admin system tables and schema
 * Usage: node migrations/runMigration.js
 */

import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '001-admin-setup.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Parse SQL statements, removing comments and empty lines
    const lines = sql.split('\n');
    let currentStatement = '';
    const statements = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comment-only lines
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      // Add line to current statement
      currentStatement += ' ' + trimmedLine;

      // If line ends with semicolon, we have a complete statement
      if (trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    let count = 0;
    for (const statement of statements) {
      if (statement.length > 10) { // Skip very short statements
        try {
          await pool.query(statement);
          count++;
          console.log(`✅ Statement ${count} executed successfully`);
        } catch (err) {
          // Some statements might fail if they already exist (e.g., ADD COLUMN IF NOT EXISTS)
          // This is expected and not an error
          if (err.code === '42701' || err.code === '42P07' || err.message.includes('already exists')) {
            console.log(`⚠️  Statement ${count} skipped (already exists)`);
          } else {
            console.error(`❌ Statement ${count} failed:`, err.message);
            console.error(`   SQL: ${statement.substring(0, 100)}...`);
            throw err;
          }
        }
      }
    }

    console.log(`\n✅ Migration completed successfully!\n`);

    // Verify the schema
    console.log('📊 Verifying schema...\n');

    // Check users table has role column
    const usersCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name='users' AND column_name='role'`
    );
    console.log(`✅ users.role column exists: ${usersCheck.rows.length > 0 ? 'YES' : 'NO'}`);

    // Check audit_logs table exists
    const auditCheck = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_name='audit_logs'`
    );
    console.log(`✅ audit_logs table exists: ${auditCheck.rows.length > 0 ? 'YES' : 'NO'}`);

    // Check system_health table exists
    const healthCheck = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_name='system_health'`
    );
    console.log(`✅ system_health table exists: ${healthCheck.rows.length > 0 ? 'YES' : 'NO'}`);

    // Check admin user exists
    const adminCheck = await pool.query(
      `SELECT id, email, role FROM users WHERE role='admin'`
    );
    console.log(`✅ Admin users found: ${adminCheck.rows.length}`);
    if (adminCheck.rows.length > 0) {
      adminCheck.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

    console.log('\n🎉 Database setup complete and verified!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run migration
runMigration();
