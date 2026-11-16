import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import pool from '../config/db.js';
import authRoutes from '../routes/auth.js';
import userRoutes from '../routes/userRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import softwareRoutes from '../routes/softwareRoutes.js';
import { changeUserRole, deleteAccount } from '../services/accountMutations.js';

const secret = 'local-test-secret-only';
const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = secret;
const hash = bcrypt.hashSync('test-password', 4);
let users;
let server;
let queries;

const publicUser = (user) => {
  if (!user) return undefined;
  const { id, name, email, role, created_at } = user;
  return { id, name, email, role, created_at };
};

const query = async (sql, params = []) => {
  const statement = sql.replace(/\s+/g, ' ').trim();
  queries.push(statement);
  if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(statement)) return { rows: [] };
  if (/SELECT \* FROM users|RETURNING \*/i.test(statement)) throw new Error('Unsafe user projection');
  if (statement.startsWith('INSERT INTO audit_logs')) return { rows: [] };
  if (statement.startsWith('SELECT * FROM software ORDER BY')) throw new Error('private database detail');
  if (statement.startsWith('SELECT * FROM software WHERE id')) throw new Error('private database detail');
  if (statement.includes("FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE")) {
    return { rows: [...users.values()].filter((u) => u.role === 'admin').map((u) => ({ id: u.id })) };
  }
  if (statement.startsWith('SELECT id, name, email, password, role FROM users WHERE email')) {
    return { rows: [...users.values()].filter((u) => u.email === params[0]) };
  }
  if (statement.startsWith('SELECT id FROM users WHERE email')) {
    return { rows: [...users.values()].filter((u) => u.email === params[0]).map((u) => ({ id: u.id })) };
  }
  if (statement.startsWith('SELECT id, email, role FROM users WHERE id')) {
    const user = users.get(Number(params[0]));
    return { rows: user ? [{ id: user.id, email: user.email, role: user.role }] : [] };
  }
  if (statement.startsWith('SELECT') && statement.includes('FROM users WHERE id = $1')) {
    const user = publicUser(users.get(Number(params[0])));
    return { rows: user ? [user] : [] };
  }
  if (statement.startsWith('SELECT id, name, email, role, created_at FROM users ORDER BY')) {
    return { rows: [...users.values()].map(publicUser) };
  }
  if (statement.startsWith('INSERT INTO users')) {
    const [name, email, password, suppliedRole] = params;
    const role = suppliedRole || 'viewer';
    const id = Math.max(...users.keys()) + 1;
    const user = { id, name, email, password, role, created_at: '2026-01-01' };
    users.set(id, user);
    return { rows: [publicUser(user)] };
  }
  if (statement.startsWith('UPDATE users SET role')) {
    const user = users.get(Number(params[1]));
    user.role = params[0];
    return { rows: [publicUser(user)] };
  }
  if (statement.startsWith('UPDATE users SET')) {
    const user = users.get(Number(params.at(-1)));
    if (!user) return { rows: [] };
    const fields = [...statement.matchAll(/(name|email) = \$(\d+)/g)];
    for (const [, field, index] of fields) user[field] = params[Number(index) - 1];
    return { rows: [publicUser(user)] };
  }
  if (statement.startsWith('DELETE FROM users WHERE id')) {
    const user = users.get(Number(params[0]));
    users.delete(Number(params[0]));
    return { rows: user ? [publicUser(user)] : [] };
  }
  throw new Error(`Unexpected test query: ${statement}`);
};

before(async () => {
  pool.query = query;
  pool.connect = async () => ({ query, release() {} });
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/software', softwareRoutes);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});

beforeEach(() => {
  queries = [];
  users = new Map([
    [1, { id: 1, name: 'Admin', email: 'admin@test.invalid', password: hash, role: 'admin', created_at: '2026-01-01' }],
    [2, { id: 2, name: 'Manager', email: 'manager@test.invalid', password: hash, role: 'manager', created_at: '2026-01-01' }],
    [3, { id: 3, name: 'Viewer', email: 'viewer@test.invalid', password: hash, role: 'viewer', created_at: '2026-01-01' }],
    [4, { id: 4, name: 'Other', email: 'other@test.invalid', password: hash, role: 'viewer', created_at: '2026-01-01' }],
  ]);
});

const token = (id, role, options = {}) => jwt.sign({ userId: id, role }, secret, { expiresIn: '1h', ...options });
const request = async (method, path, id, body, overrideToken) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: {
      ...(id ? { Authorization: `Bearer ${overrideToken || token(id, users.get(id)?.role || 'admin')}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
};
const noHash = (response) => assert.doesNotMatch(JSON.stringify(response.body), /"password"|\$2[aby]\$/);

test('software read failures do not expose database internals', async () => {
  for (const route of ['/api/software', '/api/software/1']) {
    const result = await request('GET', route, 3);
    assert.equal(result.status, 500);
    assert.doesNotMatch(JSON.stringify(result.body), /private database detail/);
  }
});

test('login succeeds and returns a token without a password hash', async () => {
  const result = await request('POST', '/api/auth/login', null, { email: 'viewer@test.invalid', password: 'test-password' });
  assert.equal(result.status, 200);
  assert.ok(result.body.token);
  assert.equal(result.body.user.role, 'viewer');
  noHash(result);
});

test('session restoration returns the current database role without sensitive fields', async () => {
  const staleToken = token(2, 'manager');
  users.get(2).role = 'viewer';
  const result = await request('GET', '/api/auth/me', 2, undefined, staleToken);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.role, 'viewer');
  noHash(result);
});

test('public registration rejects account creation and privileged role input', async () => {
  const result = await request('POST', '/api/auth/register', null,
    { name: 'Registrant', email: 'registrant@test.invalid', password: 'password123', role: 'admin' });
  assert.equal(result.status, 403);
  assert.equal(result.body.error, 'Accounts are provided by your organization administrator');
  assert.equal(users.size, 4);
  assert.equal(queries.length, 0);
  noHash(result);
});

test('missing, invalid, and expired tokens are rejected', async () => {
  assert.equal((await request('GET', '/api/users/3')).status, 401);
  assert.equal((await request('GET', '/api/users/3', 3, null, 'invalid')).status, 401);
  assert.equal((await request('GET', '/api/users/3', 3, null, token(3, 'viewer', { expiresIn: -1 }))).status, 401);
});

test('a deleted account cannot use an otherwise valid token', async () => {
  const oldToken = token(3, 'viewer');
  users.delete(3);
  assert.equal((await request('GET', '/api/users/3', 3, null, oldToken)).status, 401);
});

test('role changes override stale token claims on subsequent requests', async () => {
  const managerToken = token(2, 'manager');
  users.get(2).role = 'viewer';
  assert.equal((await request('GET', '/api/users', 2, null, managerToken)).status, 403);
  const viewerToken = token(3, 'viewer');
  users.get(3).role = 'admin';
  assert.equal((await request('GET', '/api/users', 3, null, viewerToken)).status, 200);
});

test('viewer cannot list, create, edit, or delete other accounts', async () => {
  assert.equal((await request('GET', '/api/users', 3)).status, 403);
  assert.equal((await request('GET', '/api/users/4', 3)).status, 403);
  assert.equal((await request('POST', '/api/users', 3, { name: 'X', email: 'x@test.invalid', password: 'password123', role: 'admin' })).status, 403);
  assert.equal((await request('PUT', '/api/users/4', 3, { name: 'Changed', role: 'admin' })).status, 403);
  assert.equal((await request('DELETE', '/api/users/1', 3)).status, 403);
  assert.equal((await request('PATCH', '/api/users/4/role', 3, { role: 'admin' })).status, 403);
  assert.equal(users.get(1).role, 'admin');
});

test('viewer may read and update only their own approved fields', async () => {
  const read = await request('GET', '/api/users/3', 3);
  assert.equal(read.status, 200);
  noHash(read);
  const update = await request('PUT', '/api/users/3', 3, { name: 'New name', role: 'admin', password: 'injected' });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.name, 'New name');
  assert.equal(update.body.data.role, 'viewer');
  noHash(update);
});

test('manager can read self but not the account directory or other accounts', async () => {
  const list = await request('GET', '/api/users', 2);
  assert.equal(list.status, 403);
  noHash(list);
  assert.equal((await request('GET', '/api/users/2', 2)).status, 200);
  assert.equal((await request('GET', '/api/users/3', 2)).status, 403);
  assert.equal((await request('PUT', '/api/users/3', 2, { name: 'Changed' })).status, 403);
  assert.equal((await request('POST', '/api/users', 2, { name: 'X', email: 'x@test.invalid', password: 'password123' })).status, 403);
  assert.equal((await request('DELETE', '/api/users/3', 2)).status, 403);
});

test('admin can create a viewer account and cannot set its role through the body', async () => {
  const created = await request('POST', '/api/users', 1, { name: 'New', email: 'new@test.invalid', password: 'password123', role: 'admin' });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.role, 'viewer');
  noHash(created);
  assert.ok(bcrypt.compareSync('password123', users.get(created.body.data.id).password));
  assert.equal((await request('POST', '/api/users', 1, { name: 'No Password', email: 'missing@test.invalid' })).status, 400);
});

test('admin reads and updates safe user records without leaking hashes', async () => {
  const list = await request('GET', '/api/admin/users', 1);
  const read = await request('GET', '/api/users/3', 1);
  const update = await request('PUT', '/api/users/3', 1, { email: 'updated@test.invalid' });
  for (const result of [list, read, update]) {
    assert.equal(result.status, 200);
    noHash(result);
  }
  assert.ok(queries.every((sql) => !/SELECT \* FROM users|RETURNING \*/i.test(sql)));
});

test('both admin role endpoints return safe data and last-admin demotion is blocked', async () => {
  const promote = await request('PATCH', '/api/admin/users/3/role', 1, { role: 'manager' });
  assert.equal(promote.status, 200);
  noHash(promote);
  assert.equal((await request('PATCH', '/api/users/1/role', 1, { role: 'viewer' })).status, 400);
  users.get(2).role = 'admin';
  const demote = await request('PATCH', '/api/users/2/role', 1, { role: 'viewer' });
  assert.equal(demote.status, 200);
  noHash(demote);
  assert.equal((await request('PATCH', '/api/admin/users/1/role', 2, { role: 'viewer' })).status, 403);
});

test('both admin delete endpoints protect self and the last admin', async () => {
  assert.equal((await request('DELETE', '/api/users/1', 1)).status, 400);
  const deleted = await request('DELETE', '/api/admin/users/3', 1);
  assert.equal(deleted.status, 200);
  noHash(deleted);
  assert.equal((await request('DELETE', '/api/admin/users/1', 1)).status, 400);
  users.get(2).role = 'admin';
  assert.equal((await request('DELETE', '/api/admin/users/2', 1)).status, 200);
  assert.equal((await request('DELETE', '/api/users/1', 2)).status, 401);
  assert.equal(users.get(1).role, 'admin');
});

test('transactional mutation guards reject removing the last admin', async () => {
  await assert.rejects(changeUserRole(1, 99, 'viewer'), { status: 400, message: 'Cannot demote the last admin' });
  await assert.rejects(deleteAccount(1, 99), { status: 400, message: 'Cannot delete the last admin' });
  assert.equal(users.get(1).role, 'admin');
  assert.ok(queries.includes('ROLLBACK'));
});

test('missing signing secret fails securely on protected requests while registration stays disabled', async () => {
  delete process.env.JWT_SECRET;
  try {
    const result = await request('POST', '/api/auth/register', null, { name: 'New', email: 'new@test.invalid', password: 'password123' });
    assert.equal(result.status, 403);
    assert.equal(users.size, 4);
    assert.equal((await request('GET', '/api/users/3', 3)).status, 500);
  } finally {
    process.env.JWT_SECRET = secret;
  }
});

test('database failures return a generic response without internal details', async () => {
  pool.query = (sql, params) => {
    if (sql.includes('FROM users ORDER BY id ASC')) throw new Error('private database detail');
    return query(sql, params);
  };
  try {
    const result = await request('GET', '/api/users', 1);
    assert.equal(result.status, 500);
    assert.doesNotMatch(JSON.stringify(result.body), /private database detail/);
  } finally {
    pool.query = query;
  }
});
