import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { runMigrations } from '../migrations/runMigration.js';
import { seedDemo, preflight, employees, software, assignments } from '../scripts/seedDemo.js';

const url = new URL(process.env.DATABASE_URL);
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.pathname, '/seatwatch_dev');
assert.equal(url.username, 'seatwatch_user');

test('demo seed safety, lifecycle and financial integration', async () => {
  const client = await pool.connect();
  let server;
  try {
    await assert.rejects(preflight(client, url), /migrations|schema_migrations/);
    await runMigrations(client);
    await assert.rejects(preflight(client, url), /administrator/);
    await client.query(`INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'admin')`, ['Fixture Admin', 'fixture-admin@example.com', 'hash-fixture-only']);
    await client.query(`INSERT INTO employees (name, email) VALUES ($1, $2)`,
      ['Independent Employee', 'independent@example.com']);
    await client.query(`INSERT INTO software (name, category, price_per_seat)
      VALUES ($1, $2, $3)`, ['Independent Product', 'Testing', '7.00']);
    const initial = (await client.query(`SELECT
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM employees) AS employees,
      (SELECT count(*)::int FROM software) AS software,
      (SELECT count(*)::int FROM licenses) AS licenses`)).rows[0];
    const dry = await seedDemo(client, url);
    assert.deepEqual(dry.proposed, { employees: 20, software: 8, licenses: 35 });
    const afterDry = (await client.query(`SELECT
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM employees) AS employees,
      (SELECT count(*)::int FROM software) AS software,
      (SELECT count(*)::int FROM licenses) AS licenses`)).rows[0];
    assert.deepEqual(afterDry, initial);
    await assert.rejects(seedDemo(client, new URL(url.toString().replace('/seatwatch_dev', '/wrong')),
      { apply: true }), /approved local database/);
    const wrongRole = new URL(url); wrongRole.username = 'wrong_user';
    await assert.rejects(seedDemo(client, wrongRole, { apply: true }), /approved local database/);
    process.env.NODE_ENV = 'production';
    await assert.rejects(seedDemo(client, url, { apply: true }), /NODE_ENV/);
    process.env.NODE_ENV = 'development';
    await client.query(`DELETE FROM schema_migrations WHERE name = $1`, ['003-retain-license-history.sql']);
    await assert.rejects(seedDemo(client, url, { apply: true }), /migrations/);
    await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, ['003-retain-license-history.sql']);
    let inserts = 0;
    const interrupted = { query: async (sql, params) => {
      if (sql.startsWith('INSERT INTO employees') && ++inserts === 4)
        throw new Error('injected insert failure');
      return client.query(sql, params);
    } };
    await assert.rejects(seedDemo(interrupted, url, { apply: true }), /injected insert failure/);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM employees`)).rows[0].n, 1);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM software`)).rows[0].n, 1);
    const first = await seedDemo(client, url, { apply: true });
    assert.deepEqual(first.proposed, { employees: 20, software: 8, licenses: 35 });
    const second = await seedDemo(client, url, { apply: true });
    assert.deepEqual(second.proposed, { employees: 0, software: 0, licenses: 0 });
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM licenses`)).rows[0].n, 35);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM employees`)).rows[0].n, 21);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM software`)).rows[0].n, 9);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM users WHERE role = 'admin'`)).rows[0].n, 1);
    assert.equal((await client.query(`SELECT password FROM users WHERE role = 'admin'`)).rows[0].password,
      'hash-fixture-only');
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM licenses GROUP BY employee_id, software_id HAVING count(*) > 1`)).rowCount, 0);
    const lifecycle = (await client.query(`SELECT
      CASE WHEN l.status = 'pruned' THEN 'pruned'
        WHEN l.last_active_date <= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'idle'
        ELSE 'active' END AS effective, count(*)::int AS n
      FROM licenses l GROUP BY 1 ORDER BY 1`)).rows;
    assert.deepEqual(lifecycle, [{ effective: 'active', n: 18 }, { effective: 'idle', n: 12 },
      { effective: 'pruned', n: 5 }]);
    const price = software.map(s => Number(s.price));
    const expectedSpend = assignments.filter(a => a.status !== 'pruned').reduce((v, a) => v + price[a.software], 0);
    const expectedSavings = assignments.filter(a => a.status === 'idle').reduce((v, a) => v + price[a.software], 0);
    const { default: licenseService } = await import('../services/licenseService.js');
    const metrics = await licenseService.metrics();
    assert.equal(metrics.totalSpend, expectedSpend.toFixed(2));
    assert.equal(metrics.potentialSavings, expectedSavings.toFixed(2));
    const { default: app } = await import('../app.js');
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const adminId = (await client.query(`SELECT id FROM users WHERE role = 'admin'`)).rows[0].id;
    const token = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET);
    for (const [route, verify] of [
      ['/api/dashboard/summary', data => assert.deepEqual(data, { active: 18, idle: 12, pruned: 5 })],
      ['/api/licenses/dashboard/metrics', data => {
        assert.equal(data.totalSpend, expectedSpend.toFixed(2));
        assert.equal(data.potentialSavings, expectedSavings.toFixed(2));
      }],
    ]) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${route}`,
        { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 200);
      verify((await response.json()).data);
    }
    const { default: License } = await import('../models/License.js');
    assert.equal((await License.getAllLicenses()).length, 35);
    const editedId = (await client.query(`SELECT l.id FROM licenses l JOIN employees e ON e.id = l.employee_id
      JOIN software s ON s.id = l.software_id WHERE e.email = $1 AND s.name = $2`,
    [employees[0].email, software[0].name])).rows[0].id;
    await client.query(`UPDATE licenses SET status = 'pruned' WHERE id = $1`, [editedId]);
    assert.deepEqual((await seedDemo(client, url, { apply: true })).proposed,
      { employees: 0, software: 0, licenses: 0 });
    assert.equal((await client.query(`SELECT status FROM licenses WHERE id = $1`, [editedId])).rows[0].status,
      'pruned');
    await client.query(`DELETE FROM licenses WHERE id = $1`, [editedId]);
    assert.deepEqual((await seedDemo(client, url, { apply: true })).proposed,
      { employees: 0, software: 0, licenses: 1 });
    const beforeConflict = await client.query(`SELECT count(*)::int AS n FROM employees`);
    await client.query(`UPDATE software SET category = $1 WHERE name = $2`, ['Edited', software[0].name]);
    await assert.rejects(seedDemo(client, url, { apply: true }), /identifier conflict/);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM employees`)).rows[0].n,
      beforeConflict.rows[0].n);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM employees WHERE email = $1`,
      [employees[0].email])).rows[0].n, 1);
    // A failure after a partial insert rolls the new rows back.
    await client.query(`UPDATE software SET category = $1 WHERE name = $2`, [software[0].category, software[0].name]);
    await client.query(`DELETE FROM licenses WHERE employee_id =
      (SELECT id FROM employees WHERE email = $1) AND software_id =
      (SELECT id FROM software WHERE name = $2)`, [employees[0].email, software[0].name]);
    await client.query(`UPDATE employees SET name = $1 WHERE email = $2`, ['Edited', employees[1].email]);
    await assert.rejects(seedDemo(client, url, { apply: true }), /identifier conflict/);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM licenses`)).rows[0].n, 34);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    client.release(); await pool.end();
  }
});
