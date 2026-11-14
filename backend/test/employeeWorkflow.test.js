import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import pool from '../config/db.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import licenseRoutes from '../routes/licenseRoutes.js';
import { runMigrations } from '../migrations/runMigration.js';

const secret = 'isolated-employee-test-secret';
const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = secret;
let server;
let accounts;
let employees;
let licenses;
let statements;
let restrictRace;

const publicEmployee = (employee) => employee &&
  ({ id: employee.id, name: employee.name, email: employee.email, created_at: employee.created_at });

const query = async (sql, params = []) => {
  const statement = sql.replace(/\s+/g, ' ').trim();
  statements.push(statement);
  if (statement.startsWith('SELECT id, email, role FROM users WHERE id')) {
    const account = accounts.get(Number(params[0]));
    return { rows: account ? [{ id: account.id, email: account.email, role: account.role }] : [] };
  }
  if (statement.startsWith('SELECT id, name, email, created_at FROM employees ORDER BY')) {
    return { rows: [...employees.values()].map(publicEmployee) };
  }
  if (statement.startsWith('SELECT id, name, email, created_at FROM employees WHERE id')) {
    return { rows: employees.has(Number(params[0])) ? [publicEmployee(employees.get(Number(params[0])))] : [] };
  }
  if (statement.startsWith('INSERT INTO employees')) {
    const id = Math.max(0, ...employees.keys()) + 1;
    const employee = { id, name: params[0], email: params[1], created_at: '2026-01-01' };
    employees.set(id, employee);
    return { rows: [publicEmployee(employee)] };
  }
  if (statement.startsWith('UPDATE employees')) {
    const employee = employees.get(Number(params[2]));
    if (!employee) return { rows: [] };
    employee.name = params[0];
    employee.email = params[1];
    return { rows: [publicEmployee(employee)] };
  }
  if (statement.startsWith('DELETE FROM employees')) {
    if (restrictRace) throw Object.assign(new Error('restricted by license'), { code: '23001' });
    const id = Number(params[0]);
    if (licenses.some((license) => license.employee_id === id)) return { rows: [] };
    const employee = employees.get(id);
    employees.delete(id);
    return { rows: employee ? [publicEmployee(employee)] : [] };
  }
  if (statement.startsWith('SELECT * FROM software WHERE id') ||
      statement.startsWith('SELECT id, name, category, price_per_seat')) {
    return { rows: Number(params[0]) === 5 ? [{ id: 5, name: 'Tool', price_per_seat: '10.00' }] : [] };
  }
  if (statement.startsWith('INSERT INTO licenses')) {
    const license = { id: licenses.length + 1, employee_id: params[0], software_id: params[1],
      status: params[4], last_active_date: params[3] };
    licenses.push(license);
    return { rows: [license] };
  }
  throw new Error(`Unexpected test query: ${statement}`);
};

before(async () => {
  pool.query = query;
  const app = express();
  app.use(express.json());
  app.use('/api/employees', employeeRoutes);
  app.use('/api/licenses', licenseRoutes);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

beforeEach(() => {
  statements = [];
  accounts = new Map([
    [1, { id: 1, email: 'admin@test.invalid', role: 'admin', password: 'hash' }],
    [2, { id: 2, email: 'manager@test.invalid', role: 'manager', password: 'hash' }],
    [3, { id: 3, email: 'viewer@test.invalid', role: 'viewer', password: 'hash' }],
  ]);
  employees = new Map([
    [1, { id: 1, name: 'Existing', email: 'existing@test.invalid', account_id: 3, created_at: '2026-01-01' }],
  ]);
  licenses = [];
  restrictRace = false;
});

const request = async (method, path, actor, body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwt.sign({ userId: actor }, secret, { expiresIn: '1h' })}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};

test('admin and manager create credential-free employees; responses expose no account fields', async () => {
  for (const actor of [1, 2]) {
    const result = await request('POST', '/api/employees', actor,
      { name: '  Team Member  ', email: `member${actor}@test.invalid`, password: 'injected', role: 'admin' });
    assert.equal(result.status, 201);
    assert.equal(result.body.data.name, 'Team Member');
    assert.deepEqual(Object.keys(result.body.data).sort(), ['created_at', 'email', 'id', 'name']);
  }
  assert.ok(statements.every((sql) => !/INSERT INTO users|password|role =/.test(sql)));
});

test('invalid employee input is rejected before SQL writes', async () => {
  for (const body of [{ name: '', email: 'valid@test.invalid' },
    { name: 'Valid', email: 'invalid' }, { name: 'Valid' }]) {
    assert.equal((await request('POST', '/api/employees', 1, body)).status, 400);
  }
  assert.ok(!statements.some((sql) => sql.startsWith('INSERT INTO employees')));
});

test('viewer cannot write; manager can update, and account IDs cannot be edited through employee API', async () => {
  assert.equal((await request('GET', '/api/employees', 3)).status, 200);
  assert.equal((await request('POST', '/api/employees', 3, { name: 'X', email: 'x@test.invalid' })).status, 403);
  assert.equal((await request('PUT', '/api/employees/1', 3, { name: 'X', email: 'x@test.invalid' })).status, 403);
  assert.equal((await request('DELETE', '/api/employees/1', 3)).status, 403);
  const updated = await request('PUT', '/api/employees/1', 2,
    { name: 'Updated', email: 'updated@test.invalid', account_id: 1, role: 'admin' });
  assert.equal(updated.status, 200);
  assert.equal(employees.get(1).account_id, 3);
  assert.equal(accounts.get(3).role, 'viewer');
});

test('license assignment targets employees, and assigned employees cannot be deleted', async () => {
  const assigned = await request('POST', '/api/licenses', 2, { employee_id: 1, software_id: 5 });
  assert.equal(assigned.status, 201);
  assert.equal(assigned.body.data.employee_id, 1);
  assert.equal((await request('POST', '/api/licenses', 3, { employee_id: 1, software_id: 5 })).status, 403);
  assert.equal((await request('POST', '/api/licenses', 2, { employee_id: 999, software_id: 5 })).status, 404);
  assert.equal((await request('DELETE', '/api/employees/1', 1)).status, 409);
  assert.equal(licenses.length, 1);
});

test('concurrent license restriction is returned as a conflict', async () => {
  restrictRace = true;
  const result = await request('DELETE', '/api/employees/1', 1);
  assert.equal(result.status, 409);
  assert.equal(employees.has(1), true);
});

test('manager may delete an unassigned employee without affecting accounts', async () => {
  const removed = await request('DELETE', '/api/employees/1', 2);
  assert.equal(removed.status, 200);
  assert.equal(employees.has(1), false);
  assert.equal(accounts.has(3), true);
});

test('employee and license remain after their linked account is removed', async () => {
  accounts.delete(3);
  employees.get(1).account_id = null; // ON DELETE SET NULL in the migration.
  assert.equal((await request('GET', '/api/employees/1', 1)).status, 200);
  assert.equal((await request('POST', '/api/licenses', 2, { employee_id: 1, software_id: 5 })).status, 201);
  assert.equal(licenses[0].employee_id, 1);
});

test('migration backfills IDs, removes cascading license account reference, and records completion', () => {
  const sql = fs.readFileSync(new URL('../migrations/002-employees.sql', import.meta.url), 'utf8');
  assert.match(sql, /SELECT id, name, email, id, created_at FROM users/);
  assert.match(sql, /UPDATE licenses SET employee_id = user_id/);
  assert.match(sql, /REFERENCES employees\(id\) ON DELETE RESTRICT/);
  assert.match(sql, /REFERENCES users\(id\) ON DELETE SET NULL/);
  assert.match(sql, /ALTER TABLE licenses DROP COLUMN user_id/);
});

test('migration runner records each migration and skips it on a second run', async () => {
  const applied = new Set();
  let employeeTableCreates = 0;
  let ledgerExists = false;
  const client = { query: async (sql, params = []) => {
    if (sql.includes('FROM information_schema.tables')) {
      return { rows: ledgerExists ? [{ table_name: 'schema_migrations' }] : [] };
    }
    if (sql.includes('FROM schema_migrations WHERE name')) {
      return { rows: applied.has(params[0]) ? [{ 1: 1 }] : [], rowCount: applied.has(params[0]) ? 1 : 0 };
    }
    if (sql.startsWith('INSERT INTO schema_migrations')) applied.add(params[0]);
    if (sql.startsWith('CREATE TABLE schema_migrations')) ledgerExists = true;
    if (sql.startsWith('CREATE TABLE employees')) employeeTableCreates++;
    return { rows: [], rowCount: 0 };
  } };
  await runMigrations(client);
  await runMigrations(client);
  assert.deepEqual([...applied], ['000-core-schema.sql', '001-admin-setup.sql', '002-employees.sql']);
  assert.equal(employeeTableCreates, 1);
});

test('existing complete legacy schema is baselined without rerunning account promotions', async () => {
  const applied = new Set();
  const executed = [];
  const client = { query: async (sql, params = []) => {
    executed.push(sql);
    if (sql.includes('FROM information_schema.tables')) return { rows: [
      'users', 'software', 'licenses', 'audit_logs', 'system_health'
    ].map((table_name) => ({ table_name })) };
    if (sql.includes('FROM information_schema.columns')) return { rows: Array.from({ length: 8 }, () => ({})) };
    if (sql.includes('FROM schema_migrations WHERE name')) {
      return { rowCount: applied.has(params[0]) ? 1 : 0 };
    }
    if (sql.startsWith('INSERT INTO schema_migrations')) applied.add(params[0]);
    return { rows: [], rowCount: 0 };
  } };
  await runMigrations(client);
  assert.deepEqual([...applied], ['000-core-schema.sql', '001-admin-setup.sql', '002-employees.sql']);
  assert.ok(!executed.some((sql) => sql.includes("WHERE email = 'admin@example.com'")));
});

test('partial legacy schema is rejected before any migration writes', async () => {
  const executed = [];
  const client = { query: async (sql) => {
    executed.push(sql);
    if (sql.includes('FROM information_schema.tables')) {
      return { rows: [{ table_name: 'users' }] };
    }
    throw new Error('Unexpected write');
  } };
  await assert.rejects(runMigrations(client), /Partial legacy schema/);
  assert.equal(executed.length, 1);
});

test('a failed employee migration rolls back and is not recorded as applied', async () => {
  const executed = [];
  const client = { query: async (sql, params = []) => {
    executed.push(sql);
    if (sql.includes('FROM information_schema.tables')) {
      return { rows: [{ table_name: 'schema_migrations' }] };
    }
    if (sql.includes('FROM schema_migrations WHERE name')) {
      return { rowCount: params[0] === '002-employees.sql' ? 0 : 1 };
    }
    if (sql.startsWith('ALTER TABLE licenses DROP COLUMN user_id')) throw new Error('fixture failure');
    return { rows: [], rowCount: 0 };
  } };
  await assert.rejects(runMigrations(client), /Migration 002-employees.sql failed/);
  assert.ok(executed.includes('ROLLBACK'));
  assert.ok(!executed.some((sql) => sql.startsWith('INSERT INTO schema_migrations')));
});
