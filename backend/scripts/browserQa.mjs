import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import app from '../app.js';
import pool from '../config/db.js';

const buildDir = resolve('../frontend/dist');
const loopbackHost = '127.0.0.1';
const sitePort = 3000;
const apiPort = 5000;
const cdpPort = 47891;
const siteOrigin = `http://${loopbackHost}:${sitePort}`;
const apiOrigin = `http://${loopbackHost}:${apiPort}`;
const cdpOrigin = `http://${loopbackHost}:${cdpPort}`;
const screenshotDir = resolve(process.env.SEATWATCH_QA_SCREENSHOTS_DIR || join(tmpdir(), 'seatwatch-browser-qa-screenshots'));
let shuttingDown = false;
const proxyRequests = new Set();
const site = createServer(async (req, res) => {
  const pathname = new URL(req.url, siteOrigin).pathname;
  if (pathname.startsWith('/api/')) {
    const controller = new AbortController();
    proxyRequests.add(controller);
    try {
      const response = await fetch(`${apiOrigin}${req.url}`, {
        method: req.method,
        headers: { authorization: req.headers.authorization || '', 'content-type': req.headers['content-type'] || 'application/json' },
        ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: req, duplex: 'half' } : {}),
        signal: controller.signal,
      });
      res.writeHead(response.status, { 'content-type': response.headers.get('content-type') || 'application/json' });
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      if (!shuttingDown) {
        console.error('QA same-origin proxy failed:', error.message);
        process.exitCode = 1;
        if (!res.destroyed) {
          if (!res.headersSent) res.writeHead(502);
          res.end();
        }
      }
    } finally { proxyRequests.delete(controller); }
    return;
  }
  let file = resolve(buildDir, `.${pathname}`);
  if (!file.startsWith(buildDir) || !(await stat(file).catch(() => null))?.isFile()) file = join(buildDir, 'index.html');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
  res.end(await readFile(file));
});
const api = app.listen(apiPort, loopbackHost);
site.listen(sitePort, loopbackHost);
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${process.env.TEMP}\\seatwatch-edge-${Date.now()}`,
  'about:blank',
], { stdio: 'ignore', windowsHide: true });

const delay = ms => new Promise(r => setTimeout(r, ms));
let ws, nextId = 0;
const pending = new Map();
const failed = [], consoleErrors = [], results = [], httpErrors = [];
let viewerToken;
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function run(fn, ...args) { return evaluate(`(${fn.toString()})(${args.map(JSON.stringify).join(',')})`); }
async function waitFor(fn, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = await run(fn).catch(() => null);
    if (value) return value;
    await delay(150);
  }
  throw new Error('Timed out waiting for browser state');
}
async function goto(path) {
  await send('Page.navigate', { url: `${siteOrigin}${path}` });
  await waitFor(() => document.readyState === 'complete');
}
async function clickButton(label) {
  const clicked = await run((label) => {
    const button = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === label);
    if (!button) return false;
    button.click(); return true;
  }, label);
  assert.ok(clicked, `Button ${label} exists`);
}
async function pressKey(key, code = key, modifiers = 0) {
  const windowsVirtualKeyCode = key === 'Tab' ? 9 : key === 'Enter' ? 13 : key === 'Escape' ? 27 : 0;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, modifiers,
    ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode, modifiers });
}
async function fill(label, value) {
  const filled = await run((label, value) => {
    const input = [...document.querySelectorAll('input')].find(e => e.name === label || e.type === label || [...e.labels].some(associated => associated.textContent.trim() === label));
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, label, value);
  assert.ok(filled, `Input ${label} exists`);
}
async function select(id, value) {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    ready = await run((id, value) => {
      const input = document.getElementById(id) || document.querySelector('select[name=' + JSON.stringify(id) + ']');
      return !!input && !input.disabled && [...input.options].some(option => option.value === String(value));
    }, id, value);
    if (ready) break;
    await delay(150);
  }
  assert.ok(ready, 'Select ' + id + ' has option ' + value);
  assert.ok(await run((id, value) => {
    const input = document.getElementById(id) || document.querySelector('select[name=' + JSON.stringify(id) + ']');
    input.value = String(value);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return input.value === String(value);
  }, id, value), 'Select ' + id + ' accepted ' + value);
}async function capture(name, width) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
  await delay(180);
  await mkdir(screenshotDir, { recursive: true });
  const layout = await send('Page.getLayoutMetrics');
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: Math.ceil(layout.cssContentSize.height), scale: 1 } });
  await writeFile(join(screenshotDir, name), Buffer.from(shot.data, 'base64'));
}
async function request(path, method = 'GET', body) {
  return run(async (path, method, body) => {
    const response = await fetch(`/api${path}`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  }, path, method, body);
}
async function check(name, fn) {
  try { await fn(); results.push(`PASS ${name}`); }
  catch (e) { results.push(`FAIL ${name}: ${e.message}`); }
}
try {
  if (!api.listening) await new Promise((resolve, reject) => { api.once('listening', resolve); api.once('error', reject); });
  if (!site.listening) await new Promise((resolve, reject) => { site.once('listening', resolve); site.once('error', reject); });
  console.log('Local API and frontend ready');
  let target;
  for (let i = 0; i < 80; i++) {
    try { target = (await (await fetch(`${cdpOrigin}/json/list`)).json()).find(t => t.type === 'page' && t.url === 'about:blank'); if (target) break; } catch {}
    await delay(150);
  }
  assert.ok(target, 'Headless Edge CDP target available');
  console.log('Headless Edge target ready');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  console.log('CDP connected');
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) { const p = pending.get(msg.id); pending.delete(msg.id); if (!p) return; if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result); }
    if (msg.method === 'Network.loadingFailed') failed.push(msg.params.errorText);
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) httpErrors.push(`${msg.params.response.status} ${new URL(msg.params.response.url).pathname}`);
    if (msg.method === 'Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog', { accept: true, promptText: new Date().toISOString() });
    if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push(msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await goto('/home');
  await check('landing page has honest MVP copy', async () => {
    const text = await run(() => document.body.innerText);
    assert.match(text, /License management MVP/);
    assert.doesNotMatch(text, /500\+|Free Trial|\$299|AI Analysis|guarantee/i);
  });
  await goto('/register');
  await check('public registration denied and access guidance shown', async () => {
    assert.match(await run(() => document.body.innerText), /Access is provided by your administrator/);
    assert.equal(await run(() => document.querySelectorAll('form').length), 0);
    assert.ok(await run(() => !!document.querySelector('a[href="/login"]')));
    const denied = await run(async () => {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Denied', email: 'denied@seatwatch.test.invalid', password: 'SyntheticPass123!', role: 'admin' }) });
      return { status: response.status, body: await response.json() };
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.body.error, 'Accounts are provided by your organization administrator');
    assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE email = 'denied@seatwatch.test.invalid'")).rows[0].count, 0);
  });
  await goto('/login');
  await check('login keyboard order, focus visibility, and validation announcements', async () => {
    await waitFor(() => !!document.querySelector('input[name="email"]'));
    await run(() => { document.body.tabIndex = -1; document.body.focus(); });
    for (const expected of ['SeatWatch home', 'Back to home', 'email', 'password', 'Show password', 'Sign in']) {
      await pressKey('Tab');
      const active = await run(() => ({ name: document.activeElement?.getAttribute('aria-label') || document.activeElement?.getAttribute('name') || document.activeElement?.textContent?.trim(), visible: document.activeElement?.matches(':focus-visible'), outline: getComputedStyle(document.activeElement).outlineStyle }));
      assert.equal(active.name, expected);
      assert.equal(active.visible, true);
      assert.notEqual(active.outline, 'none');
    }
    await pressKey('Tab', 'Tab', 8);
    assert.equal(await run(() => document.activeElement?.getAttribute('aria-label')), 'Show password');
    await pressKey('Tab');
    await pressKey('Enter');
    await waitFor(() => document.querySelectorAll('.input-error-message[role="alert"]').length === 2).catch(async error => {
      const state = await run(() => ({ active: document.activeElement?.outerHTML?.slice(0, 200), alerts: [...document.querySelectorAll('[role="alert"]')].map(element => element.textContent) }));
      throw new Error(`${error.message}: ${JSON.stringify(state)}`);
    });
    assert.ok(await run(() => [...document.querySelectorAll('input')].filter(input => input.getAttribute('aria-invalid') === 'true' && input.getAttribute('aria-describedby')).length === 2));
  });
  await check('admin provisions viewer through authorized account endpoint', async () => {
    await fill('email', process.env.ADMIN_BOOTSTRAP_EMAIL);
    await fill('password', process.env.ADMIN_BOOTSTRAP_PASSWORD);
    await clickButton('Sign in'); await waitFor(() => location.pathname === '/dashboard');
    const status = await run(async () => (await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` }, body: JSON.stringify({ name: 'Synthetic QA Viewer', email: 'viewer@seatwatch.test.invalid', password: 'SyntheticPass123!', role: 'admin' }) })).status);
    assert.equal(status, 201);
    assert.equal((await pool.query("SELECT role FROM users WHERE email = 'viewer@seatwatch.test.invalid'")).rows[0].role, 'viewer');
    await run(() => { localStorage.removeItem('auth_token'); localStorage.removeItem('user'); });
  });
  await goto('/login');
  await check('provisioned viewer login', async () => {
    await fill('email', 'viewer@seatwatch.test.invalid');
    await fill('password', 'SyntheticPass123!');
    await clickButton('Sign in'); await waitFor(() => location.pathname === '/dashboard');
    viewerToken = await run(() => localStorage.getItem('auth_token'));
  });
  await check('viewer session restore and protected data', async () => {
    await goto('/dashboard');
    assert.equal(await run(() => location.pathname), '/dashboard');
    assert.match(await run(() => document.body.innerText), /Dashboard/);
  });
  await check('viewer admin route denied', async () => {
    await goto('/admin'); await waitFor(() => location.pathname === '/dashboard');
  });
  await check('viewer server mutation denied', async () => {
    const status = await run(async () => (await fetch('/api/employees', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('auth_token')}`}, body:JSON.stringify({name:'Denied',email:'denied@test.invalid'}) })).status);
    assert.equal(status, 403);
  });
  await check('logout redirects protected route', async () => {
    await run(() => { localStorage.removeItem('auth_token'); localStorage.removeItem('user'); });
    await goto('/dashboard'); await waitFor(() => location.pathname === '/login');
  });
  await goto('/login');
  await check('synthetic admin login', async () => {
    await fill('email', process.env.ADMIN_BOOTSTRAP_EMAIL);
    await fill('password', process.env.ADMIN_BOOTSTRAP_PASSWORD);
    await clickButton('Sign in'); await waitFor(() => location.pathname === '/dashboard');
  });
  await check('admin management pages load', async () => {
    for (const path of ['/employees','/software','/licenses','/admin','/role-management','/audit-log']) {
      await goto(path); assert.equal(await run(() => location.pathname), path);
      await waitFor(() => document.querySelector('h1')?.textContent?.length > 2);
      assert.ok((await run(() => document.body.innerText)).length > 20);
    }
  });
  await check('management dialog focuses and restores its trigger', async () => {
    await goto('/employees');
    await waitFor(() => !![...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Add employee'));
    await run(() => { const trigger = [...document.querySelectorAll('button')].find(e => e.textContent.trim() === 'Add employee'); trigger.focus(); trigger.click(); });
    await waitFor(() => !!document.querySelector('[role="dialog"]'));
    assert.ok(await run(() => document.querySelector('[role="dialog"]').contains(document.activeElement)));
    await run(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await waitFor(() => !document.querySelector('[role="dialog"]'));
    assert.ok(await run(() => document.activeElement?.textContent?.trim() === 'Add employee'));
  });
  await check('admin creates a viewer login account', async () => {
    await goto('/admin'); await waitFor(() => !!document.querySelector('.sw-management__table'));
    await clickButton('Create account');
    await waitFor(() => !!document.querySelector('[role="dialog"] form'));
    for (const [label, value] of [
      ['Name', 'Synthetic QA Account'],
      ['Email', 'account@seatwatch.test.invalid'],
      ['Password', 'AnotherSyntheticPass123!'],
    ]) {
      assert.ok(await run((label, value) => {
        const input = [...document.querySelectorAll('[role="dialog"] input')].find(e => e.labels?.[0]?.textContent?.includes(label));
        if (!input) return false;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true })); return true;
      }, label, value));
    }
    const formState = await run(() => [...document.querySelectorAll('[role="dialog"] form input')].map(x => ({ length: x.value.length, valid: x.checkValidity() })));
    assert.ok(formState.every(x => x.length > 0 && x.valid), `Account form invalid: ${JSON.stringify(formState)}`);
    await run(() => document.querySelector('[role="dialog"] form').requestSubmit());
    try { await waitFor(() => document.body.innerText.includes('account@seatwatch.test.invalid')); }
    catch { throw new Error(`Account did not appear: ${(await run(() => document.body.innerText)).slice(0, 400)}`); }
    const accounts = await request('/admin/users');
    assert.equal(accounts.status, 200);
    assert.ok((accounts.body.data || accounts.body).some(x => x.email === 'account@seatwatch.test.invalid' && x.role === 'viewer'));
  });
  for (const width of [390, 768, 1024, 1440, 1680]) {
    await check(`administration ${width}px account, role, and audit layout`, async () => {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
      await goto('/admin'); await waitFor(() => !!document.querySelector('.sw-management__table'));
      assert.ok(await run(() => document.documentElement.scrollWidth - innerWidth <= 2));
      assert.ok(await run(() => !!document.querySelector('button[aria-label="Delete Synthetic QA Account"]')));
      await capture(`task08c3-accounts-${width}.png`, width);
      await clickButton('Create account'); await waitFor(() => !!document.querySelector('[role="dialog"]'));
      assert.ok(await run(() => document.querySelector('[role="dialog"]').contains(document.activeElement)));
      assert.ok(await run(() => document.querySelector('[role="dialog"]').getBoundingClientRect().height <= innerHeight));
      await capture(`task08c3-create-${width}.png`, width);
      await run(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
      await waitFor(() => !document.querySelector('[role="dialog"]'));
      await run(() => document.querySelector('button[aria-label="Delete Synthetic QA Account"]').click());
      await waitFor(() => !!document.querySelector('[role="dialog"]'));
      assert.ok(await run(() => document.querySelector('[role="dialog"]').textContent.includes('account@seatwatch.test.invalid')));
      await capture(`task08c3-delete-${width}.png`, width);
      await clickButton('Cancel');
      await goto('/role-management'); await waitFor(() => !!document.querySelector('button[aria-label="Change role for Synthetic QA Account"]'));
      await run(() => document.querySelector('button[aria-label="Change role for Synthetic QA Account"]').click());
      await waitFor(() => !!document.querySelector('#proposed-role'));
      await capture(`task08c3-role-${width}.png`, width);
      await clickButton('Cancel');
      await goto('/audit-log'); await waitFor(() => document.body.innerText.includes('No recorded events') || !!document.querySelector('.sw-management__table'));
      assert.ok(await run(() => document.documentElement.scrollWidth - innerWidth <= 2));
      await capture(`task08c3-audit-${width}.png`, width);
    });
  }
  await check('create credential-free employee through form', async () => {
    await goto('/employees'); await waitFor(() => document.body.innerText.includes('Add employee'));
    await clickButton('Add employee');
    await fill('name', 'Synthetic QA Employee'); await fill('email', 'employee@seatwatch.test.invalid');
    await clickButton('Create employee');
    await waitFor(() => document.body.innerText.includes('Synthetic QA Employee'));
    const response = await request('/employees');
    assert.equal(response.status, 200);
    assert.ok(JSON.stringify(response.body).includes('Synthetic QA Employee'));
    assert.ok(!JSON.stringify(response.body).includes('password'));
  });
  await check('create software with monthly price through form', async () => {
    await goto('/software'); await waitFor(() => document.body.innerText.includes('Add software'));
    await clickButton('Add software');
    await fill('name', 'Synthetic QA Software'); await fill('category', 'QA'); await fill('price_per_seat', '42.50');
    await clickButton('Create software');
    await waitFor(() => document.body.innerText.includes('Synthetic QA Software'));
    const response = await request('/software');
    assert.equal(response.status, 200); assert.ok(JSON.stringify(response.body).includes('42.50'));
  });
  await check('management forms expose validation and named row actions', async () => {
    await goto('/employees'); await waitFor(() => !!document.querySelector('button[aria-label="Edit Synthetic QA Employee"]'));
    assert.ok(await run(() => document.querySelector('th[scope="row"]')?.textContent.includes('Synthetic QA Employee')));
    await clickButton('Add employee');
    await run(() => document.querySelector('[role="dialog"] form').requestSubmit());
    await waitFor(() => !!document.querySelector('[role="dialog"] [aria-invalid="true"]'));
    assert.ok(await run(() => document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('required')));
    await run(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await goto('/software'); await waitFor(() => !!document.querySelector('button[aria-label="Edit Synthetic QA Software"]'));
    await clickButton('Add software');
    await fill('name', 'Validation Product'); await fill('category', 'QA'); await fill('price_per_seat', '-1');
    await run(() => document.querySelector('[role="dialog"] form').requestSubmit());
    await waitFor(() => !!document.querySelector('[role="dialog"] [aria-invalid="true"]'));
    assert.ok(await run(() => document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('nonnegative')));
  });
  await check('assign license with employee_id', async () => {
    const employees = await request('/employees'); const products = await request('/software');
    const employee = (employees.body.data || employees.body).find(x => x.email === 'employee@seatwatch.test.invalid');
    const item = (products.body.data || products.body).find(x => x.name === 'Synthetic QA Software');
    assert.ok(employee?.id && item?.id);
    await goto('/licenses'); await waitFor(() => document.body.innerText.includes('Assign License'));
    await clickButton('Assign License'); await select('employee_id', employee.id); await select('software_id', item.id);
    await run(() => document.getElementById('license-form').requestSubmit());
    await waitFor(() => !document.querySelector('[role="dialog"]'));
    const response = await request('/licenses');
    assert.equal(response.status, 200);
    assert.ok((response.body.data || response.body).some(x => x.employee_id === employee.id && x.software_id === item.id));
  });
  await check('duplicate assignment displays HTTP 409 feedback', async () => {
    const employees = await request('/employees'); const products = await request('/software');
    const employee = (employees.body.data || employees.body)[0]; const item = (products.body.data || products.body)[0];
    await clickButton('Assign License'); await select('employee_id', employee.id); await select('software_id', item.id);
    await run(() => document.getElementById('license-form').requestSubmit());
    await waitFor(() => document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('already'));
    assert.ok(httpErrors.includes('409 /api/licenses'));
    await clickButton('Cancel');
  });
  await check('dashboard metrics match active license', async () => {
    const response = await request('/dashboard/stats'); assert.equal(response.status, 200);
    const metrics = response.body.data || response.body;
    assert.equal(Number(metrics.totalSpend), 42.5); assert.equal(Number(metrics.activeLicenseCount), 1);
    await goto('/dashboard'); await waitFor(() => !!document.querySelector('[aria-label="Monthly spending by category"]'));
    assert.ok(await run(() => document.body.innerText.includes('Synthetic QA Employee')));
  });
  await check('idle filter follows effective status and captures screenshot', async () => {
    const licenses = await request('/licenses'); const license = (licenses.body.data || licenses.body)[0];
    const oldDate = new Date(Date.now() - 31 * 86400000).toISOString();
    assert.equal((await request('/licenses/' + license.id, 'PUT', { last_active_date: oldDate })).status, 200);
    const idle = await request('/licenses/idle/list'); assert.equal(idle.status, 200);
    assert.equal((idle.body.data || idle.body).length, 1);
    await goto('/licenses'); await waitFor(() => !!document.querySelector('.sw-licenses__panel'));
    await run(() => { const control = document.querySelector('.sw-licenses__filters select'); control.value = 'idle'; control.dispatchEvent(new Event('change', { bubbles: true })); });
    await waitFor(() => document.body.innerText.includes('1 of 1 assignments'));
    await capture('task08c2-licenses-idle-1440.png', 1440);
    const metrics = await request('/dashboard/stats'); assert.equal(Number((metrics.body.data || metrics.body).potentialSavings), 42.5);
  });
  await check('prune confirmation and retained history', async () => {
    await goto('/licenses'); await waitFor(() => !!document.querySelector('.sw-licenses__panel'));
    await clickButton('Prune'); await waitFor(() => !!document.querySelector('[role="dialog"]'));
    assert.ok(await run(() => document.querySelector('[role="dialog"]').innerText.includes('does not cancel vendor billing')));
    await capture('task08c2-licenses-prune.png', 1440);
    await clickButton('Prune license'); await waitFor(() => document.querySelector('.sw-licenses__summary')?.innerText.includes('Pruned'));
    await waitFor(() => document.querySelector('.sw-licenses__panel')?.innerText.includes('Reactivate'));
    const metrics = await request('/dashboard/stats'); const data = metrics.body.data || metrics.body;
    assert.equal(Number(data.totalSpend), 0); assert.equal(Number(data.prunedLicenseCount), 1);
    assert.equal((await request('/licenses/idle/list')).body.data?.length ?? 0, 0);
  });
  await check('reactivation requires manually recorded activity', async () => {
    await clickButton('Reactivate'); await waitFor(() => !!document.querySelector('[role="dialog"]'));
    await capture('task08c2-licenses-reactivate.png', 1440);
    await run(() => document.querySelector('[role="dialog"] form').requestSubmit());
    await waitFor(() => document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('valid activity'));
    const recent = new Date(Date.now() - 86400000);
    const local = new Date(recent.getTime() - recent.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    await fill('datetime-local', local);
    await clickButton('Reactivate license');
    await waitFor(() => !document.querySelector('[role="dialog"]'));
    await waitFor(() => document.querySelector('.sw-licenses__panel')?.innerText.includes('Active'));
    const metrics = await request('/dashboard/stats'); assert.equal(Number((metrics.body.data || metrics.body).totalSpend), 42.5);
  });
  await check('employee with license history cannot be deleted', async () => {
    await goto('/employees'); await waitFor(() => document.body.innerText.includes('Synthetic QA Employee'));
    assert.ok(await run(() => { const button = document.querySelector('button[aria-label="Delete Synthetic QA Employee"]'); button?.click(); return !!button; }));
    await waitFor(() => !!document.querySelector('[role="dialog"]'));
    await clickButton('Delete employee'); await waitFor(() => document.querySelector('[role="alert"]')?.textContent.includes('license history'));
    await delay(300); assert.ok(httpErrors.includes('409 /api/employees/1'));
  });
  await check('software with license history cannot be deleted', async () => {
    await goto('/software'); await waitFor(() => !!document.querySelector('button[aria-label="Delete Synthetic QA Software"]'));
    await run(() => document.querySelector('button[aria-label="Delete Synthetic QA Software"]').click());
    await waitFor(() => !!document.querySelector('[role="dialog"]'));
    await clickButton('Delete software');
    await waitFor(() => document.querySelector('[role="alert"]')?.textContent.includes('license history'));
    assert.ok(httpErrors.some(item => item.startsWith('409 /api/software/')));
  });
  await check('admin role change applies after viewer refresh', async () => {
    await goto('/role-management'); await waitFor(() => document.body.innerText.includes('viewer@seatwatch.test.invalid'));
    assert.ok(await run(() => { const row = [...document.querySelectorAll('tr')].find(e => e.textContent.includes('viewer@seatwatch.test.invalid')); if (!row) return false; row.querySelector('button').click(); return true; }));
    await waitFor(() => !!document.querySelector('#proposed-role'));
    await run(() => { const select = document.querySelector('#proposed-role'); select.value = 'manager'; select.dispatchEvent(new Event('change',{bubbles:true})); });
    await clickButton('Confirm role change');
    await waitFor(() => [...document.querySelectorAll('tr')].some(e => e.textContent.includes('viewer@seatwatch.test.invalid') && e.textContent.includes('Manager')));
    await goto('/audit-log'); await waitFor(() => !!document.querySelector('.sw-management__table'));
    assert.ok(await run(() => document.body.innerText.includes('ROLE_CHANGE')));
    await capture('task08c3-audit-recorded-1440.png', 1440);
    await run((token) => { localStorage.setItem('auth_token', token); }, viewerToken);
    await goto('/employees'); await waitFor(() => document.body.innerText.includes('Add employee'));
    assert.equal((await request('/admin/users')).status, 403);
  });
  await check('isolated management fixtures cover long labels and price edges', async () => {
    const longName = `Synthetic ${'Very Long Employee Name '.repeat(3)}`.trim();
    const longEmail = `${'long.employee.address.'.repeat(5)}qa@seatwatch.test.invalid`;
    assert.equal((await request('/employees', 'POST', { name: longName, email: longEmail })).status, 201);
    assert.equal((await request('/software', 'POST', { name: `Synthetic ${'Long Product Name '.repeat(5)}`.trim(), category: 'Long category label for layout verification', price_per_seat: 99999999.99 })).status, 201);
    assert.equal((await request('/software', 'POST', { name: 'Synthetic Zero Price Product', category: 'QA', price_per_seat: 0 })).status, 201);
  });
  for (const width of [390, 768, 1024, 1440, 1680]) {
    await check(`${width}px viewport renders landing and management`, async () => {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
      for (const path of ['/home','/dashboard','/licenses']) {
        await goto(path); await waitFor(() => document.querySelector('h1')?.textContent?.length > 2);
        assert.ok((await run(() => document.body.innerText)).length > 50);
        const overflow = await run(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 2, `${path} overflows viewport by ${overflow}px`);
        if (path === '/licenses') {
          await waitFor(() => !!document.querySelector('.sw-licenses__panel'));
          assert.ok(await run(() => document.querySelector('.sw-management__table-scroll').scrollWidth >= document.querySelector('.sw-management__table-scroll').clientWidth));
          await capture('task08c2-licenses-' + width + '.png', width);
          if (width === 390) {
            await clickButton('Assign License'); await waitFor(() => !!document.querySelector('[role="dialog"]'));
            assert.ok(await run(() => document.querySelector('[role="dialog"]').contains(document.activeElement)));
            await capture('task08c2-licenses-assignment-390.png', width);
            await clickButton('Cancel'); await waitFor(() => !document.querySelector('[role="dialog"]'));
          }
        }
        if (path === '/dashboard') {
          await waitFor(() => !!document.querySelector('[aria-label="Monthly spending by category"]'));
          assert.ok(await run(() => !!document.querySelector('h1') && document.querySelector('h1').textContent === 'Overview'));
          await waitFor(() => document.querySelectorAll('.sw-dashboard__table-panel').length === 2);
          assert.ok(await run(() => [...document.querySelectorAll('.sw-dashboard__text-link')].every(a => a.getAttribute('href') === '/licenses')));
          assert.ok(await run(() => [...document.querySelectorAll('.sw-dashboard__table-scroll')].every(e => e.scrollWidth >= e.clientWidth)));
        }
      }
    });
  }
  for (const width of [390, 768, 1024, 1440, 1680]) {
    await check(`${width}px employee and software management layout`, async () => {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
      for (const path of ['/employees', '/software']) {
        await goto(path);
        try { await waitFor(() => document.querySelector('.sw-management__header h1')?.textContent === (location.pathname === '/employees' ? 'Employees' : 'Software') && !!document.querySelector('.sw-management__table')); }
        catch { throw new Error(`${path} did not render table: ${(await run(() => document.body.innerText)).slice(0, 450)}`); }
        const overflow = await run(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 2, `${path} overflows by ${overflow}px`);
        assert.ok(await run(() => document.querySelector('.sw-management__table-scroll').scrollWidth >= document.querySelector('.sw-management__table-scroll').clientWidth));
        await mkdir(screenshotDir, { recursive: true });
        const layout = await send('Page.getLayoutMetrics');
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: Math.ceil(layout.cssContentSize.height), scale: 1 } });
        await writeFile(join(screenshotDir, `task08c-${path.slice(1)}-${width}.png`), Buffer.from(shot.data, 'base64'));
        await run(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === (location.pathname === '/employees' ? 'Add employee' : 'Add software')).click());
        await waitFor(() => !!document.querySelector('[role="dialog"]'));
        assert.ok(await run(() => document.querySelector('[role="dialog"]').contains(document.activeElement)));
        assert.ok(await run(() => document.querySelector('[role="dialog"]').getBoundingClientRect().height <= innerHeight));
        if (width === 390) {
          const dialogShot = await send('Page.captureScreenshot', { format: 'png' });
          await writeFile(join(screenshotDir, `task08c-${path.slice(1)}-dialog-390.png`), Buffer.from(dialogShot.data, 'base64'));
        }
        await run(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
        await waitFor(() => !document.querySelector('[role="dialog"]'));
      }
    });
  }
  await check('mobile drawer keyboard dismissal and reduced motion', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await goto('/dashboard');
    await waitFor(() => !!document.querySelector('[aria-label="Open navigation"]'));
    await run(() => { const trigger = document.querySelector('[aria-label="Open navigation"]'); trigger.focus(); trigger.click(); });
    await waitFor(() => !!document.querySelector('[role="dialog"]'));
    assert.ok(await run(() => document.querySelector('[role="dialog"]').contains(document.activeElement)));
    await run(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await waitFor(() => !document.querySelector('[role="dialog"]'));
    assert.ok(await run(() => document.activeElement?.getAttribute('aria-label') === 'Open navigation'));
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const duration = await run(() => { const element = document.createElement('div'); element.className = 'skeleton'; document.querySelector('.sw-app').append(element); const value = getComputedStyle(element).animationDuration; element.remove(); return value; });
    assert.ok(parseFloat(duration) <= 0.001, `reduced motion duration is ${duration}`);
  });
  console.log(results.join('\n'));
  console.log(`Browser console errors: ${consoleErrors.length}; network loading failures: ${failed.length}`);
  console.log(`Expected HTTP errors observed: ${httpErrors.join(', ')}`);
  if (consoleErrors.length) console.log(`Console samples: ${consoleErrors.slice(0,3).join(' | ')}`);
  if (failed.length) console.log(`Network samples: ${failed.slice(0,3).join(' | ')}`);
  if (results.some(r => r.startsWith('FAIL')) || consoleErrors.length || failed.length) process.exitCode = 1;
} finally {
  shuttingDown = true;
  ws?.close(); edge.kill();
  for (const controller of proxyRequests) controller.abort();
  site.closeAllConnections(); site.close(); api.closeAllConnections(); api.close(); await pool.end();
}
