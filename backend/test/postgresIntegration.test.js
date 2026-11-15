import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { runMigrations } from '../migrations/runMigration.js';

const required = ['SEATWATCH_TEST_PGDATA', 'SEATWATCH_TEST_FRESH', 'SEATWATCH_TEST_LEGACY',
  'SEATWATCH_TEST_FAILURE', 'SEATWATCH_TEST_PORT', 'DATABASE_URL', 'JWT_SECRET'];
for (const name of required) assert.ok(process.env[name], `${name} is required`);
const freshName = process.env.SEATWATCH_TEST_FRESH;
const legacyName = process.env.SEATWATCH_TEST_LEGACY;
const failureName = process.env.SEATWATCH_TEST_FAILURE;
const testUrl = new URL(process.env.DATABASE_URL);
assert.match(freshName, /^seatwatch_task05_fresh_[a-f0-9]{32}$/);
assert.equal(testUrl.hostname, '127.0.0.1');
assert.equal(testUrl.port, process.env.SEATWATCH_TEST_PORT);
assert.equal(testUrl.pathname, `/${freshName}`);
assert.equal(testUrl.username, 'seatwatch_test');
assert.match(legacyName, /^seatwatch_task05_legacy_[a-f0-9]{32}$/);
assert.match(failureName, /^seatwatch_task05_failure_[a-f0-9]{32}$/);
assert.equal(new Set([freshName, legacyName, failureName]).size, 3);

const otherPool = (name) => {
  const url = new URL(testUrl);
  url.pathname = `/${name}`;
  return new Pool({ connectionString: url.toString() });
};
const legacyPool = otherPool(legacyName);
const failurePool = otherPool(failureName);
const norm = (value) => path.resolve(value).replaceAll('\\', '/').toLowerCase();

async function verifyIsolation(database, name) {
  const result = await database.query(`SELECT current_database() AS db,
    current_setting('data_directory') AS data_dir,
    host(inet_server_addr()) AS address, inet_server_port() AS port`);
  const { db, data_dir, address, port } = result.rows[0];
  assert.equal(db, name);
  assert.equal(norm(data_dir), norm(process.env.SEATWATCH_TEST_PGDATA));
  assert.equal(address, '127.0.0.1');
  assert.equal(port, Number(process.env.SEATWATCH_TEST_PORT));
  const tables = await database.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(tables.rowCount, 0, `database ${name} must be empty`);
}

async function migrate(database) {
  const client = await database.connect();
  try { await runMigrations(client); } finally { client.release(); }
}

async function request(server, method, route, body, token) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}${route}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

test('real PostgreSQL migrations and employee/license workflows', async () => {
  let server;
  try {
    await verifyIsolation(pool, freshName);
    await verifyIsolation(legacyPool, legacyName);
    await verifyIsolation(failurePool, failureName);

    await migrate(pool);
    const tables = (await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
      .rows.map((row) => row.tablename).sort();
    assert.deepEqual(tables, ['audit_logs', 'employees', 'licenses', 'schema_migrations',
      'software', 'system_health', 'users']);
    const columns = (await pool.query(`SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('employees', 'licenses')`)).rows;
    const has = (table, column) => columns.some((row) => row.table_name === table && row.column_name === column);
    for (const column of ['id', 'name', 'email', 'account_id', 'created_at']) assert.ok(has('employees', column));
    assert.ok(has('licenses', 'employee_id'));
    assert.ok(!has('licenses', 'user_id'));
    const indexes = (await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname = 'public'"))
      .rows.map((row) => row.indexname);
    for (const name of ['idx_licenses_employee_id', 'idx_licenses_software_id',
      'uq_licenses_employee_software', 'employees_account_id_key', 'employees_email_key']) {
      assert.ok(indexes.includes(name), `missing index ${name}`);
    }
    const constraints = (await pool.query(`SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint WHERE conrelid IN ('employees'::regclass, 'licenses'::regclass)`)).rows;
    assert.ok(constraints.some((row) => row.definition.includes('FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT')));
    assert.ok(constraints.some((row) => row.definition.includes('FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL')));
    assert.deepEqual((await pool.query('SELECT name FROM schema_migrations ORDER BY name')).rows.map((r) => r.name),
      ['000-core-schema.sql', '001-admin-setup.sql', '002-employees.sql', '003-retain-license-history.sql']);
    await migrate(pool);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM schema_migrations')).rows[0].count, 4);

    const { default: app } = await import('../app.js');
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const registered = await request(server, 'POST', '/api/auth/register', {
      name: 'Synthetic Account', email: 'account@test.invalid', password: 'test-password-strong', role: 'admin',
    });
    assert.equal(registered.status, 403);
    assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE email = 'account@test.invalid'")).rows[0].count, 0);
    const adminHash = await bcrypt.hash('synthetic-admin-password', 10);
    const admin = (await pool.query(`INSERT INTO users (name, email, password, role)
      VALUES ('Synthetic Admin', 'admin@test.invalid', $1, 'admin') RETURNING id`, [adminHash])).rows[0];
    const adminLogin = await request(server, 'POST', '/api/auth/login',
      { email: 'admin@test.invalid', password: 'synthetic-admin-password' });
    assert.equal(adminLogin.status, 200);
    const token = adminLogin.body.token;
    const provisioned = await request(server, 'POST', '/api/users', {
      name: 'Synthetic Account', email: 'account@test.invalid', password: 'test-password-strong', role: 'admin',
    }, token);
    assert.equal(provisioned.status, 201);
    const accountId = provisioned.body.data.id;
    const stored = (await pool.query('SELECT password, role FROM users WHERE id = $1', [accountId])).rows[0];
    assert.notEqual(stored.password, 'test-password-strong');
    assert.ok(await bcrypt.compare('test-password-strong', stored.password));
    assert.equal(stored.role, 'viewer');
    const login = await request(server, 'POST', '/api/auth/login',
      { email: 'account@test.invalid', password: 'test-password-strong' });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    assert.ok(!('password' in login.body.user));
    assert.equal((await request(server, 'GET', '/api/stats/home')).status, 401);
    assert.equal((await request(server, 'GET', '/api/stats/home', undefined, login.body.token)).status, 200);
    const employee = await request(server, 'POST', '/api/employees',
      { name: 'Synthetic Employee', email: 'employee@test.invalid', password: 'must-not-store', role: 'admin' }, token);
    assert.equal(employee.status, 201);
    assert.deepEqual(Object.keys(employee.body.data).sort(), ['created_at', 'email', 'id', 'name']);
    const employeeId = employee.body.data.id;
    assert.equal((await pool.query('SELECT account_id FROM employees WHERE id = $1', [employeeId])).rows[0].account_id, null);
    assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE email = 'employee@test.invalid'"))
      .rows[0].count, 0);
    const software = (await pool.query(`INSERT INTO software (name, category, price_per_seat)
      VALUES ('Synthetic Tool', 'Testing', 12) RETURNING id`)).rows[0];
    const license = await request(server, 'POST', '/api/licenses',
      { employee_id: employeeId, software_id: software.id }, token);
    assert.equal(license.status, 201);
    assert.equal(license.body.data.employee_id, employeeId);
    assert.equal((await request(server, 'DELETE', `/api/employees/${employeeId}`, undefined, token)).status, 409);
    await assert.rejects(pool.query('DELETE FROM employees WHERE id = $1', [employeeId]), { code: '23001' });
    await assert.rejects(pool.query(`INSERT INTO licenses (employee_id, software_id)
      VALUES (999999, $1)`, [software.id]), { code: '23503' });
    await assert.rejects(pool.query(`INSERT INTO licenses (employee_id, software_id)
      VALUES ($1, 999999)`, [employeeId]), { code: '23503' });
    await assert.rejects(pool.query(`INSERT INTO licenses (employee_id, software_id)
      VALUES ($1, $2)`, [employeeId, software.id]), { code: '23505' });
    await assert.rejects(pool.query(`INSERT INTO employees (name, email)
      VALUES ('Duplicate', 'employee@test.invalid')`), { code: '23505' });
    await assert.rejects(pool.query(`INSERT INTO employees (name, email, account_id)
      VALUES ('Bad link', 'badlink@test.invalid', 999999)`), { code: '23503' });
    assert.equal((await request(server, 'DELETE', `/api/users/${accountId}`, undefined, token)).status, 200);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM employees WHERE id = $1', [employeeId]))
      .rows[0].count, 1);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM licenses WHERE employee_id = $1', [employeeId]))
      .rows[0].count, 1);
    assert.equal((await request(server, 'POST', '/api/auth/login',
      { email: 'account@test.invalid', password: 'test-password-strong' })).status, 401);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM users WHERE id = $1', [admin.id]))
      .rows[0].count, 1);

    // Lifecycle and money use the same PostgreSQL clock and NUMERIC values.
    const licenseService = (await import('../services/licenseService.js')).default;
    await pool.query('UPDATE software SET price_per_seat = $1 WHERE id = $2', ['0.10', software.id]);
    const second = (await pool.query(`INSERT INTO software (name, category, price_per_seat)
      VALUES ('Second Tool', 'Testing', 0.20) RETURNING id`)).rows[0].id;
    const free = (await pool.query(`INSERT INTO software (name, category, price_per_seat)
      VALUES ('Free Tool', 'Testing', 0) RETURNING id`)).rows[0].id;
    const old = (await pool.query(`INSERT INTO licenses (employee_id, software_id, last_active_date)
      VALUES ($1, $2, CURRENT_TIMESTAMP - INTERVAL '31 days') RETURNING id`, [employeeId, second])).rows[0].id;
    const zero = (await pool.query(`INSERT INTO licenses (employee_id, software_id, last_active_date)
      VALUES ($1, $2, CURRENT_TIMESTAMP - INTERVAL '30 days') RETURNING id`, [employeeId, free])).rows[0].id;
    await pool.query(`UPDATE licenses SET last_active_date = CURRENT_TIMESTAMP - INTERVAL '29 days' WHERE id = $1`,
      [license.body.data.id]);
    assert.equal((await request(server, 'POST', '/api/licenses',
      { employee_id: employeeId, software_id: second }, token)).status, 409);
    assert.equal((await request(server, 'GET', '/api/licenses/not-an-id', undefined, token)).status, 400);
    assert.equal((await request(server, 'PUT', `/api/software/${second}`,
      { price_per_seat: 0.001 }, token)).status, 400);
    const summary = await request(server, 'GET', '/api/dashboard/summary', undefined, token);
    const dashboard = await request(server, 'GET', '/api/licenses/dashboard/metrics', undefined, token);
    const idle = await request(server, 'GET', '/api/licenses/idle/list', undefined, token);
    assert.deepEqual(summary.body.data, { active: 1, idle: 2, pruned: 0 });
    assert.equal(idle.body.count, 2);
    assert.equal(dashboard.body.data.totalSpend, '0.30');
    assert.equal(dashboard.body.data.potentialSavings, '0.20');
    assert.equal(dashboard.body.data.savingsPercentage, '66.67');
    assert.deepEqual(dashboard.body.data.spendingByCategory,
      [{ category: 'Testing', monthlySpend: '0.30' }]);
    assert.equal(dashboard.body.data.idleLicenseCount, idle.body.count);
    const { effectiveStatus } = await import('../services/licenseRules.js');
    const edgeCases = (await pool.query(`WITH licenses AS (
      SELECT 'active'::text AS status, NULL::timestamptz AS last_active_date
      UNION ALL SELECT 'active', CURRENT_TIMESTAMP + INTERVAL '1 day'
      UNION ALL SELECT 'active', CURRENT_TIMESTAMP - INTERVAL '30 days'
      UNION ALL SELECT 'pruned', CURRENT_TIMESTAMP - INTERVAL '31 days'
    ) SELECT ${effectiveStatus} AS status FROM licenses`)).rows.map(r => r.status);
    assert.deepEqual(edgeCases, ['active', 'active', 'idle', 'pruned']);
    assert.equal((await request(server, 'GET', '/api/dashboard', undefined, token)).body.data.totalSpend, '0.30');
    assert.equal((await licenseService.reconcileIdleStatuses()), 2);
    assert.equal((await licenseService.reconcileIdleStatuses()), 0);
    await pool.query("UPDATE licenses SET status = 'active' WHERE id = $1", [old]);
    assert.equal((await Promise.all([licenseService.reconcileIdleStatuses(),
      licenseService.reconcileIdleStatuses()])).reduce((a, b) => a + b), 1);
    assert.equal((await request(server, 'GET', '/api/licenses/idle/list', undefined, token)).body.count, 2);
    assert.equal((await request(server, 'PUT', `/api/licenses/${old}`,
      { status: 'idle' }, token)).status, 400);
    assert.equal((await request(server, 'PUT', `/api/licenses/${old}`,
      { last_active_date: '2099-01-01T00:00:00Z' }, token)).status, 400);
    assert.equal((await request(server, 'PUT', `/api/licenses/${old}`,
      { last_active_date: '2026-02-30T00:00:00Z' }, token)).status, 400);
    assert.equal((await request(server, 'PUT', `/api/licenses/${old}`,
      { status: 'active' }, token)).status, 409);
    assert.equal((await request(server, 'DELETE', `/api/licenses/${old}`, undefined, token)).status, 409);
    assert.equal((await request(server, 'DELETE', `/api/software/${second}`, undefined, token)).status, 409);
    await assert.rejects(pool.query('DELETE FROM software WHERE id = $1', [second]), { code: '23001' });
    assert.equal((await request(server, 'POST', `/api/licenses/${old}/prune`, undefined, token)).status, 200);
    assert.equal((await request(server, 'POST', '/api/licenses',
      { employee_id: employeeId, software_id: second }, token)).status, 409);
    assert.equal((await licenseService.reconcileIdleStatuses()), 0);
    assert.equal((await request(server, 'GET', '/api/dashboard/summary', undefined, token)).body.data.pruned, 1);
    assert.equal((await request(server, 'GET', '/api/licenses/idle/list', undefined, token)).body.count, 1);
    assert.equal((await request(server, 'GET', '/api/licenses/dashboard/metrics', undefined, token)).body.data.totalSpend, '0.10');
    const recent = new Date().toISOString();
    assert.equal((await request(server, 'PUT', `/api/licenses/${old}`,
      { status: 'active', last_active_date: recent }, token)).status, 200);
    assert.equal((await request(server, 'GET', '/api/dashboard/summary', undefined, token)).body.data.active, 2);
    await pool.query('UPDATE software SET price_per_seat = 0 WHERE id IN ($1, $2)', [software.id, second]);
    assert.equal((await request(server, 'GET', '/api/licenses/dashboard/metrics', undefined, token)).body.data.savingsPercentage, '0.00');
    assert.equal((await request(server, 'GET', '/api/licenses/dashboard/metrics', undefined, token)).body.data.totalSpend, '0.00');
    assert.equal((await pool.query('SELECT status FROM licenses WHERE id = $1', [zero])).rows[0].status, 'idle');

    const migrationDir = new URL('../migrations/', import.meta.url);
    for (const file of ['000-core-schema.sql', '001-admin-setup.sql']) {
      await legacyPool.query(fs.readFileSync(new URL(file, migrationDir), 'utf8'));
      await failurePool.query(fs.readFileSync(new URL(file, migrationDir), 'utf8'));
    }
    const oldHash = await bcrypt.hash('legacy-test-password', 10);
    for (const database of [legacyPool, failurePool]) {
      await database.query(`INSERT INTO users (id, name, email, password, role)
        VALUES (41, 'Legacy A', 'legacy-a@test.invalid', $1, 'admin'),
               (73, 'Legacy B', 'legacy-b@test.invalid', $1, 'viewer')`, [oldHash]);
      await database.query(`INSERT INTO software (id, name, category) VALUES (9, 'Legacy Tool', 'Testing')`);
      await database.query(`INSERT INTO licenses (id, user_id, software_id) VALUES (101, 73, 9)`);
    }
    await migrate(legacyPool);
    assert.deepEqual((await legacyPool.query('SELECT id, account_id FROM employees ORDER BY id')).rows,
      [{ id: '41', account_id: '41' }, { id: '73', account_id: '73' }]);
    assert.equal((await legacyPool.query('SELECT employee_id FROM licenses WHERE id = 101')).rows[0].employee_id, '73');
    assert.equal((await legacyPool.query('SELECT COUNT(*)::int AS count FROM users WHERE id IN (41, 73)')).rows[0].count, 2);
    assert.equal((await legacyPool.query('SELECT password FROM users WHERE id = 73')).rows[0].password, oldHash);
    assert.equal((await legacyPool.query(`SELECT COUNT(*)::int AS count FROM information_schema.columns
      WHERE table_name = 'licenses' AND column_name = 'user_id'`)).rows[0].count, 0);
    const nextEmployee = (await legacyPool.query(`INSERT INTO employees (name, email)
      VALUES ('Post Migration', 'post@test.invalid') RETURNING id`)).rows[0];
    assert.ok(Number(nextEmployee.id) > 73);
    await legacyPool.query('DELETE FROM users WHERE id = 73');
    assert.equal((await legacyPool.query('SELECT account_id FROM employees WHERE id = 73')).rows[0].account_id, null);
    assert.equal((await legacyPool.query('SELECT employee_id FROM licenses WHERE id = 101')).rows[0].employee_id, '73');
    await migrate(legacyPool);
    assert.equal((await legacyPool.query('SELECT COUNT(*)::int AS count FROM schema_migrations')).rows[0].count, 4);

    const failingClient = await failurePool.connect();
    try {
      const proxy = { query: (sql, params) => {
        if (sql.startsWith('ALTER TABLE licenses ADD COLUMN employee_id')) throw new Error('synthetic migration interruption');
        return failingClient.query(sql, params);
      } };
      await assert.rejects(runMigrations(proxy), /synthetic migration interruption/);
    } finally { failingClient.release(); }
    assert.equal((await failurePool.query("SELECT to_regclass('public.employees') AS employees")).rows[0].employees, null);
    assert.deepEqual((await failurePool.query('SELECT name FROM schema_migrations ORDER BY name')).rows.map((r) => r.name),
      ['000-core-schema.sql', '001-admin-setup.sql']);
    await migrate(failurePool);
    assert.equal((await failurePool.query('SELECT COUNT(*)::int AS count FROM schema_migrations')).rows[0].count, 4);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await Promise.all([pool.end(), legacyPool.end(), failurePool.end()]);
  }
});
