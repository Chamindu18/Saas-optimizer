import pool from '../config/db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const legacy = ['000-core-schema.sql', '001-admin-setup.sql'];

// Migrations contain simple semicolon-terminated statements, without SQL functions.
const statements = (source) => source.split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('--'))
  .join('\n').split(';').map((statement) => statement.trim()).filter(Boolean);

async function establishBaseline(client) {
  const tables = await client.query(`SELECT table_name FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name IN
    ('users', 'software', 'licenses', 'audit_logs', 'system_health', 'schema_migrations')`);
  const present = new Set(tables.rows.map((row) => row.table_name));
  if (present.has('schema_migrations')) return;
  const existing = ['users', 'software', 'licenses', 'audit_logs', 'system_health']
    .filter((table) => present.has(table));
  if (existing.length && existing.length !== 5) {
    throw new Error('Partial legacy schema: inspect and repair it before running migrations');
  }
  if (existing.length) {
    const columns = await client.query(`SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND
      ((table_name = 'users' AND column_name IN ('id', 'name', 'email', 'password', 'role')) OR
       (table_name = 'licenses' AND column_name IN ('id', 'user_id', 'software_id')))`);
    if (columns.rows.length !== 8) {
      throw new Error('Unexpected legacy schema: inspect it before running migrations');
    }
  }
  await client.query('BEGIN');
  try {
    await client.query(`CREATE TABLE schema_migrations (
      name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    if (existing.length) {
      for (const name of legacy) {
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function runMigrations(client) {
  await establishBaseline(client);
  const files = fs.readdirSync(directory).filter((name) => /^\d+-.*\.sql$/.test(name)).sort();
  for (const name of files) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (applied.rowCount) continue;
    await client.query('BEGIN');
    try {
      for (const statement of statements(fs.readFileSync(path.join(directory, name), 'utf8'))) {
        await client.query(statement);
      }
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const client = await pool.connect();
  try {
    await runMigrations(client);
    console.log('Migrations complete');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
