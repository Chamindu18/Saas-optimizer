import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import authController from '../controllers/authController.js';
import { createLoginRateLimit } from '../middleware/loginRateLimit.js';

const hash = bcrypt.hashSync('correct-password', 4);
const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'isolated-rate-limit-test-secret';
let queryCount = 0;
pool.query = async (_sql, [email]) => {
  queryCount++;
  return { rows: email === 'admin@test.invalid' || email === 'manager@test.invalid' || email === 'viewer@test.invalid'
    ? [{ id: 1, name: 'Test', email, password: hash, role: email.split('@')[0] }] : [] };
};

const withServer = async (run, trustedProxy = false) => {
  const app = express();
  if (trustedProxy) app.set('trust proxy', ['loopback']);
  app.use(express.json());
  app.post('/api/auth/login', createLoginRateLimit(), authController.login);
  app.get('/health', (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const request = async (path, body, headers = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
  try { await run(request); } finally { await new Promise((resolve) => server.close(resolve)); }
};

test('successful admin, manager and viewer logins retain response contract and do not consume failure quota', async () => {
  await withServer(async (request) => {
    for (const role of ['admin', 'manager', 'viewer']) {
      const result = await request('/api/auth/login', { email: `${role}@test.invalid`, password: 'correct-password' });
      assert.equal(result.status, 200);
      assert.equal(result.body.message, 'Login successful');
      assert.equal(result.body.user.role, role);
      assert.ok(result.body.token);
      assert.ok(!('password' in result.body.user));
    }
  });
});

test('ten failures pass; eleventh is 429 before authentication and other routes remain available', async () => {
  await withServer(async (request) => {
    queryCount = 0;
    for (let i = 0; i < 10; i++) {
      const result = await request('/api/auth/login', { email: i % 2 ? 'admin@test.invalid' : 'missing@test.invalid', password: 'wrong-secret' });
      assert.equal(result.status, 401);
      assert.equal(result.body.error, 'Invalid email or password');
    }
    const blocked = await request('/api/auth/login', { email: 'viewer@test.invalid', password: 'correct-password' });
    assert.equal(blocked.status, 429);
    assert.deepEqual(blocked.body, { success: false, error: 'Too many login attempts. Please try again later.' });
    assert.match(blocked.headers.get('retry-after'), /^\d+$/);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0 && Number(blocked.headers.get('retry-after')) <= 900);
    assert.equal(queryCount, 10);
    assert.equal((await request('/health')).status, 200);
  });
});

test('untrusted forwarding headers cannot rotate the client identity', async () => {
  await withServer(async (request) => {
    for (let i = 0; i < 11; i++) {
      const result = await request('/api/auth/login', { email: 'missing@test.invalid', password: 'wrong' },
        { 'X-Forwarded-For': `198.51.100.${i + 1}` });
      assert.equal(result.status, i === 10 ? 429 : 401);
    }
  });
});

test('trusted proxy IPv6 clients are grouped by /56 and distinct IPv4 clients are separate', async () => {
  await withServer(async (request) => {
    for (let i = 0; i < 10; i++) {
      assert.equal((await request('/api/auth/login', { email: 'missing@test.invalid', password: 'wrong' },
        { 'X-Forwarded-For': `2001:db8:1:2::${i + 1}` })).status, 401);
    }
    assert.equal((await request('/api/auth/login', { email: 'missing@test.invalid', password: 'wrong' },
      { 'X-Forwarded-For': '2001:db8:1:2::ff' })).status, 429);
    assert.equal((await request('/api/auth/login', { email: 'missing@test.invalid', password: 'wrong' },
      { 'X-Forwarded-For': '198.51.100.5' })).status, 401);
  }, true);
});

test.after(() => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});
