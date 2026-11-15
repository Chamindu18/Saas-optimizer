// Local development fixture only. No authentication accounts are created or updated.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import pool from '../config/db.js';

const migrations = ['000-core-schema.sql', '001-admin-setup.sql',
  '002-employees.sql', '003-retain-license-history.sql'];
const marker = 'SeatWatch Demo 08D';
const first = ['Avery', 'Morgan', 'Rowan', 'Taylor', 'Jordan', 'Casey', 'Riley', 'Quinn',
  'Parker', 'Jamie', 'Sage', 'Emery', 'Finley', 'Reese', 'Skyler', 'Drew', 'Alex', 'Robin',
  'Cameron', 'Devon'];
const last = ['Vale', 'North', 'Ellis', 'Stone', 'Reed', 'Hale', 'Wren', 'Park', 'Rivera',
  'Bennett', 'Lane', 'Frost', 'Mercer', 'Blake', 'Rowe', 'Pike', 'Sutton', 'Arden',
  'Marigold-Winterbourne', 'Alexandria-Winterbourne'];
export const employees = first.map((name, i) => ({
  name: `${name} ${last[i]} [${marker}]`,
  email: `seatwatch-demo-08d-employee-${String(i + 1).padStart(2, '0')}@example.com`,
}));
export const software = [
  ['Slack', 'Communication', '9.00'], ['Figma', 'Design', '15.00'],
  ['Notion', 'Productivity', '10.00'], ['GitHub', 'Development', '21.00'],
  ['Zoom', 'Communication', '16.00'], ['Jira', 'Project Management', '12.00'],
  ['Canva', 'Design', '0.00'], ['Datadog', 'Monitoring', '120.00'],
].map(([name, category, price]) => ({ name: `[${marker}] ${name}`, category, price }));
// Each pair is unique. First 18 active, next 12 idle, final 5 pruned.
export const assignments = Array.from({ length: 35 }, (_, i) => ({
  employee: i % 20, software: i < 20 ? i % 8 : (i % 8 + 1) % 8,
  status: i < 18 ? 'active' : i < 30 ? 'idle' : 'pruned',
  daysAgo: i < 15 ? 2 + i : i < 18 ? 0 : i === 18 ? 30 : i === 19 ? 31 :
    i < 30 ? 35 + (i - 20) * 3 : 45 + i,
}));

const requiredColumns = {
  users: ['id', 'role'], employees: ['id', 'name', 'email', 'account_id'],
  software: ['id', 'name', 'category', 'price_per_seat'],
  licenses: ['id', 'employee_id', 'software_id', 'assigned_date', 'last_active_date', 'status'],
  schema_migrations: ['name'],
};
const count = async (client, table) => Number((await client.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n);

export async function preflight(client, url, expected = {
  database: 'seatwatch_dev', role: 'seatwatch_user',
}) {
  if (process.env.NODE_ENV !== 'development') throw new Error('NODE_ENV must be development');
  if (!url || !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      url.pathname !== `/${expected.database}` || decodeURIComponent(url.username) !== expected.role ||
      url.search || url.hash) throw new Error('Connection URL does not identify the approved local database');
  const identity = (await client.query(`SELECT current_database() AS db, current_user AS role,
    host(inet_server_addr()) AS server_address, host(inet_client_addr()) AS client_address,
    inet_server_port() AS port, pg_backend_pid() AS backend_pid,
    (SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = current_database()) AS owner`)).rows[0];
  if (identity.db !== expected.database || identity.role !== expected.role ||
      identity.owner !== expected.role || identity.server_address !== '127.0.0.1' ||
      identity.client_address !== '127.0.0.1' ||
      Number(identity.port) !== Number(url.port || 5432)) {
    throw new Error('Connected database identity, owner, or loopback transport failed verification');
  }
  // Non-superusers cannot read data_directory. Verify the backend PID and the
  // actual local TCP listener both belong to Windows postgres.exe processes.
  if (process.platform !== 'win32') throw new Error('Local process verification requires Windows');
  const inspectProcess = (pid) => {
    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command',
      `(Get-Process -Id ${Number(pid)} -ErrorAction Stop | Select-Object ProcessName,Id | ConvertTo-Json -Compress)`],
    { encoding: 'utf8', timeout: 5000, windowsHide: true });
    const processInfo = JSON.parse(output);
    if (processInfo.ProcessName !== 'postgres' || processInfo.Id !== Number(pid))
      throw new Error('PostgreSQL server process is not local');
    return true;
  };
  inspectProcess(identity.backend_pid);
  const listeners = execFileSync('netstat.exe', ['-ano', '-p', 'TCP'],
    { encoding: 'utf8', timeout: 5000, windowsHide: true }).split(/\r?\n/);
  const listenerPids = listeners.map(line => line.trim().split(/\s+/)).filter(parts =>
    parts[0] === 'TCP' && parts[2] === '0.0.0.0:0' && parts[3] === 'LISTENING' &&
    parts[1].endsWith(`:${identity.port}`)).map(parts => Number(parts[4]));
  if (!listenerPids.some(pid => {
    try { return inspectProcess(pid); } catch { return false; }
  })) throw new Error('Local PostgreSQL TCP listener could not be verified');
  const migrationRows = await client.query('SELECT name FROM schema_migrations');
  const applied = new Set(migrationRows.rows.map(r => r.name));
  if (migrations.some(name => !applied.has(name))) throw new Error('Required migrations are missing');
  const columns = await client.query(`SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns WHERE table_schema = 'public'`);
  for (const [table, names] of Object.entries(requiredColumns)) {
    for (const name of names) {
      if (!columns.rows.some(r => r.table_name === table && r.column_name === name))
        throw new Error(`Required column missing: ${table}.${name}`);
    }
  }
  const activity = columns.rows.find(r => r.table_name === 'licenses' && r.column_name === 'last_active_date');
  if (activity.data_type !== 'timestamp with time zone' || activity.is_nullable !== 'NO')
    throw new Error('Unexpected license activity column definition');
  const constraints = (await client.query(`SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint WHERE conrelid IN ('employees'::regclass, 'software'::regclass, 'licenses'::regclass)`)).rows;
  for (const fragment of ['UNIQUE (employee_id, software_id)',
    'FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT',
    'FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE RESTRICT']) {
    if (!constraints.some(r => r.definition.includes(fragment))) throw new Error(`Required constraint missing: ${fragment}`);
  }
  const admins = Number((await client.query("SELECT count(*)::int AS n FROM users WHERE role = 'admin'")).rows[0].n);
  if (!admins) throw new Error('Existing administrator account is required');
  const counts = {};
  for (const table of ['users', 'employees', 'software', 'licenses']) counts[table] = await count(client, table);
  return { host: url.hostname, database: identity.db, role: identity.role,
    migrations: migrations.length, admins, counts };
}

export async function seedDemo(client, url, { apply = false, expected } = {}) {
  if (apply) await client.query('BEGIN');
  try {
    if (apply) await client.query('SELECT pg_advisory_xact_lock($1)', [807008]);
    const verified = await preflight(client, url, expected);
    const employeeRows = (await client.query(`SELECT id, name, email, account_id FROM employees
      WHERE email = ANY($1::text[]) OR name = ANY($2::text[])`,
    [employees.map(x => x.email), employees.map(x => x.name)])).rows;
    const softwareRows = (await client.query(`SELECT id, name, category, price_per_seat FROM software
      WHERE name = ANY($1::text[])`, [software.map(x => x.name)])).rows;
    const employeeIds = [];
    const softwareIds = [];
    let newEmployees = 0; let newSoftware = 0; let newLicenses = 0;
    for (const fixture of employees) {
      const matches = employeeRows.filter(r => r.email === fixture.email || r.name === fixture.name);
      if (matches.length && (matches.length !== 1 || matches[0].name !== fixture.name ||
          matches[0].email !== fixture.email || matches[0].account_id !== null))
        throw new Error('Demo employee identifier conflict; no records changed');
      if (matches.length) employeeIds.push(matches[0].id);
      else {
        newEmployees++;
        if (apply) employeeIds.push((await client.query(`INSERT INTO employees (name, email)
          VALUES ($1, $2) RETURNING id`, [fixture.name, fixture.email])).rows[0].id);
      }
    }
    for (const fixture of software) {
      const matches = softwareRows.filter(r => r.name === fixture.name);
      if (matches.length && (matches.length !== 1 || matches[0].category !== fixture.category ||
          Number(matches[0].price_per_seat).toFixed(2) !== fixture.price))
        throw new Error('Demo software identifier conflict; no records changed');
      if (matches.length) softwareIds.push(matches[0].id);
      else {
        newSoftware++;
        if (apply) softwareIds.push((await client.query(`INSERT INTO software (name, category, price_per_seat)
          VALUES ($1, $2, $3) RETURNING id`, [fixture.name, fixture.category, fixture.price])).rows[0].id);
      }
    }
    if (apply) {
      const existing = (await client.query(`SELECT employee_id, software_id, status, last_active_date
        FROM licenses WHERE employee_id = ANY($1::bigint[]) OR software_id = ANY($2::bigint[])`,
      [employeeIds, softwareIds])).rows;
      const fixturePairs = new Set(assignments.map(a => `${employeeIds[a.employee]}:${softwareIds[a.software]}`));
      if (existing.some(r => !fixturePairs.has(`${r.employee_id}:${r.software_id}`)))
        throw new Error('Demo identifiers have non-demo license history; refusing to adopt them');
      const seededAt = (await client.query('SELECT CURRENT_TIMESTAMP AS now')).rows[0].now;
      for (const [index, fixture] of assignments.entries()) {
        const employeeId = employeeIds[fixture.employee]; const softwareId = softwareIds[fixture.software];
        if (existing.some(r => r.employee_id === employeeId && r.software_id === softwareId)) continue;
        newLicenses++;
        // Three rows use the schema default. They are ordinary active rows, not unknown activity.
        const activity = new Date(seededAt.getTime() - fixture.daysAgo * 86400000);
        if (index >= 15 && index < 18) {
          await client.query(`INSERT INTO licenses (employee_id, software_id, assigned_date, status)
            VALUES ($1, $2, $3, $4)`, [employeeId, softwareId, seededAt, fixture.status]);
        } else {
          await client.query(`INSERT INTO licenses
            (employee_id, software_id, assigned_date, last_active_date, status)
            VALUES ($1, $2, $3, $4, $5)`,
          [employeeId, softwareId, seededAt, activity, fixture.status]);
        }
      }
      await client.query('COMMIT');
    } else {
      // Without IDs for absent rows, only inspect existing fixture pairs.
      const existing = (await client.query(`SELECT l.employee_id, l.software_id FROM licenses l
        JOIN employees e ON e.id = l.employee_id JOIN software s ON s.id = l.software_id
        WHERE e.email = ANY($1::text[]) AND s.name = ANY($2::text[])`,
      [employees.map(x => x.email), software.map(x => x.name)])).rows;
      newLicenses = 35 - existing.length;
    }
    return { ...verified, proposed: { employees: newEmployees, software: newSoftware,
      licenses: newLicenses }, applied: apply };
  } catch (error) {
    if (apply) await client.query('ROLLBACK');
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  if (args.some(x => !['--apply', '--database=seatwatch_dev'].includes(x)) ||
      (apply && !args.includes('--database=seatwatch_dev'))) {
    console.error('Use --apply --database=seatwatch_dev to insert, or no arguments for dry-run');
    process.exitCode = 1;
  } else {
    try {
      const url = new URL(process.env.DATABASE_URL || '');
      const client = await pool.connect();
      try {
        if (apply) console.log(JSON.stringify({ dryRun: await seedDemo(client, url) }));
        const result = await seedDemo(client, url, { apply });
        console.log(JSON.stringify(result));
      } finally { client.release(); }
    } catch (error) {
      console.error(`Demo seed refused: ${error.message}`);
      process.exitCode = 1;
    } finally { await pool.end(); }
  }
}
