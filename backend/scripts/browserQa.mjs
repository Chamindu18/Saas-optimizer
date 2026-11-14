import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import app from '../app.js';
import pool from '../config/db.js';

const buildDir = resolve('../frontend/build');
const site = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost:3000').pathname;
  let file = resolve(buildDir, `.${pathname}`);
  if (!file.startsWith(buildDir) || !(await stat(file).catch(() => null))?.isFile()) file = join(buildDir, 'index.html');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
  res.end(await readFile(file));
});
const api = app.listen(5000, '127.0.0.1');
site.listen(3000, '127.0.0.1');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=47891', `--user-data-dir=${process.env.TEMP}\\seatwatch-edge-${Date.now()}`,
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
  await send('Page.navigate', { url: `http://localhost:3000${path}` });
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
async function fill(label, value) {
  const filled = await run((label, value) => {
    const input = [...document.querySelectorAll('input')].find(e => e.name === label || e.placeholder === label || e.parentElement?.textContent?.includes(label));
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, label, value);
  assert.ok(filled, `Input ${label} exists`);
}
async function select(id, value) {
  assert.ok(await run((id, value) => {
    const input = document.getElementById(id);
    if (!input) return false;
    input.value = String(value); input.dispatchEvent(new Event('change', { bubbles: true })); return true;
  }, id, value), `Select ${id} exists`);
}
async function request(path, method = 'GET', body) {
  return run(async (path, method, body) => {
    const response = await fetch(`http://localhost:5000/api${path}`, {
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
    try { target = (await (await fetch('http://127.0.0.1:47891/json/list')).json()).find(t => t.type === 'page' && t.url === 'about:blank'); if (target) break; } catch {}
    await delay(150);
  }
  assert.ok(target, 'Headless Edge CDP target available');
  console.log('Headless Edge target ready');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  console.log('CDP connected');
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) { const p = pending.get(msg.id); pending.delete(msg.id); if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result); }
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
  await check('viewer registration', async () => {
    await fill('Jane Doe', 'Synthetic QA Viewer');
    await fill('you@company.com', 'viewer@seatwatch.test.invalid');
    const count = await run(() => document.querySelectorAll('input[type=password]').length);
    assert.equal(count, 2);
    for (const index of [0, 1]) await run((index) => { const input = document.querySelectorAll('input[type=password]')[index]; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'SyntheticPass123!'); input.dispatchEvent(new Event('input',{bubbles:true})); }, index);
    await clickButton('Create account');
    await waitFor(() => location.pathname === '/dashboard');
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
    const status = await run(async () => (await fetch('http://localhost:5000/api/employees', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('auth_token')}`}, body:JSON.stringify({name:'Denied',email:'denied@test.invalid'}) })).status);
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
    await clickButton('Sign In'); await waitFor(() => location.pathname === '/dashboard');
  });
  await check('admin management pages load', async () => {
    for (const path of ['/employees','/software','/licenses','/admin','/role-management','/audit-log']) {
      await goto(path); assert.equal(await run(() => location.pathname), path);
      await waitFor(() => document.querySelector('h1')?.textContent?.length > 2);
      assert.ok((await run(() => document.body.innerText)).length > 20);
    }
  });
  await check('admin creates a viewer login account', async () => {
    await goto('/admin'); await clickButton('Accounts');
    try { await waitFor(() => !!document.querySelector('form[aria-label="Create account"]')); }
    catch { throw new Error(`Accounts tab did not show form: ${(await run(() => document.body.innerText)).slice(0, 400)}`); }
    for (const [label, value] of [
      ['Account name', 'Synthetic QA Account'],
      ['Account email', 'account@seatwatch.test.invalid'],
      ['Account password', 'AnotherSyntheticPass123!'],
    ]) {
      assert.ok(await run((label, value) => {
        const input = document.querySelector(`input[aria-label="${label}"]`);
        if (!input) return false;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true })); return true;
      }, label, value));
    }
    const formState = await run(() => [...document.querySelectorAll('form[aria-label="Create account"] input')].map(x => ({ label: x.getAttribute('aria-label'), length: x.value.length, valid: x.checkValidity() })));
    assert.ok(formState.every(x => x.length > 0 && x.valid), `Account form invalid: ${JSON.stringify(formState)}`);
    await run(() => document.querySelector('form[aria-label="Create account"]').requestSubmit());
    try { await waitFor(() => document.body.innerText.includes('account@seatwatch.test.invalid')); }
    catch { throw new Error(`Account did not appear: ${(await run(() => document.body.innerText)).slice(0, 400)}`); }
    const accounts = await request('/admin/users');
    assert.equal(accounts.status, 200);
    assert.ok((accounts.body.data || accounts.body).some(x => x.email === 'account@seatwatch.test.invalid' && x.role === 'viewer'));
  });
  await check('create credential-free employee through form', async () => {
    await goto('/employees'); await waitFor(() => document.body.innerText.includes('Add Employee'));
    await clickButton('Add Employee');
    await fill('name', 'Synthetic QA Employee'); await fill('email', 'employee@seatwatch.test.invalid');
    await clickButton('Create Employee');
    await waitFor(() => document.body.innerText.includes('Synthetic QA Employee'));
    const response = await request('/employees');
    assert.equal(response.status, 200);
    assert.ok(JSON.stringify(response.body).includes('Synthetic QA Employee'));
    assert.ok(!JSON.stringify(response.body).includes('password'));
  });
  await check('create software with monthly price through form', async () => {
    await goto('/software'); await waitFor(() => document.body.innerText.includes('Add Software'));
    await clickButton('Add Software');
    await fill('name', 'Synthetic QA Software'); await fill('category', 'QA'); await fill('price_per_seat', '42.50');
    await clickButton('Create Software');
    await waitFor(() => document.body.innerText.includes('Synthetic QA Software'));
    const response = await request('/software');
    assert.equal(response.status, 200); assert.ok(JSON.stringify(response.body).includes('42.50'));
  });
  await check('assign license with employee_id', async () => {
    const employees = await request('/employees'); const software = await request('/software');
    const employee = (employees.body.data || employees.body).find(x => x.email === 'employee@seatwatch.test.invalid');
    const item = (software.body.data || software.body).find(x => x.name === 'Synthetic QA Software');
    assert.ok(employee?.id && item?.id);
    await goto('/licenses'); await waitFor(() => document.body.innerText.includes('Assign License'));
    await clickButton('Assign License'); await select('employee_id', employee.id); await select('software_id', item.id);
    await run(() => document.getElementById('license-form').requestSubmit());
    await waitFor(() => document.body.innerText.includes('Synthetic QA Employee'));
    const response = await request('/licenses');
    assert.equal(response.status, 200);
    assert.ok((response.body.data || response.body).some(x => x.employee_id === employee.id && x.software_id === item.id));
  });
  await check('duplicate assignment displays HTTP 409 feedback', async () => {
    const employees = await request('/employees'); const software = await request('/software');
    const employee = (employees.body.data || employees.body)[0]; const item = (software.body.data || software.body)[0];
    await clickButton('Assign License'); await select('employee_id', employee.id); await select('software_id', item.id);
    await run(() => document.getElementById('license-form').requestSubmit());
    await waitFor(() => document.body.innerText.toLowerCase().includes('already'));
    assert.ok(httpErrors.includes('409 /api/licenses'));
  });
  await check('dashboard metrics match active license', async () => {
    const response = await request('/dashboard/stats'); assert.equal(response.status, 200);
    const metrics = response.body.data || response.body;
    assert.equal(Number(metrics.totalSpend), 42.5); assert.equal(Number(metrics.activeLicenseCount), 1);
    await goto('/dashboard'); await waitFor(() => document.body.innerText.includes('$42.50'));
  });
  await check('idle report and potential savings from recorded activity', async () => {
    const licenses = await request('/licenses'); const license = (licenses.body.data || licenses.body)[0];
    const oldDate = new Date(Date.now() - 31 * 86400000).toISOString();
    assert.equal((await request(`/licenses/${license.id}`, 'PUT', { last_active_date: oldDate })).status, 200);
    const idle = await request('/licenses/idle/list'); assert.equal(idle.status, 200);
    assert.equal((idle.body.data || idle.body).length, 1);
    await goto('/licenses'); await clickButton('Idle Licenses'); await waitFor(() => document.body.innerText.includes('Synthetic QA Employee'));
    const metrics = await request('/dashboard/stats'); assert.equal(Number((metrics.body.data || metrics.body).potentialSavings), 42.5);
  });
  await check('prune, retained status, and financial effect', async () => {
    await clickButton('All Licenses'); await clickButton('Prune');
    await waitFor(() => document.body.innerText.includes('Pruned'));
    const metrics = await request('/dashboard/stats'); const data = metrics.body.data || metrics.body;
    assert.equal(Number(data.totalSpend), 0); assert.equal(Number(data.prunedLicenseCount), 1);
    assert.equal((await request('/licenses/idle/list')).body.data?.length ?? 0, 0);
  });
  await check('reactivation restores current spend', async () => {
    await clickButton('Reactivate'); await waitFor(() => document.body.innerText.includes('Active'));
    const metrics = await request('/dashboard/stats'); assert.equal(Number((metrics.body.data || metrics.body).totalSpend), 42.5);
  });
  await check('employee with license history cannot be deleted', async () => {
    await goto('/employees'); await waitFor(() => document.body.innerText.includes('Synthetic QA Employee'));
    await clickButton('Delete'); await waitFor(() => document.body.innerText.toLowerCase().includes('license'));
    await delay(300); assert.ok(httpErrors.includes('409 /api/employees/1'));
  });
  await check('admin role change applies after viewer refresh', async () => {
    await goto('/role-management'); await waitFor(() => document.body.innerText.includes('viewer@seatwatch.test.invalid'));
    assert.ok(await run(() => { const row = [...document.querySelectorAll('tr')].find(e => e.textContent.includes('viewer@seatwatch.test.invalid')); if (!row) return false; row.querySelector('button').click(); return true; }));
    await run(() => { const select = document.querySelector('.role-dropdown'); select.value = 'manager'; select.dispatchEvent(new Event('change',{bubbles:true})); });
    await clickButton('Save'); await clickButton('Confirm Change');
    await waitFor(() => [...document.querySelectorAll('tr')].some(e => e.textContent.includes('viewer@seatwatch.test.invalid') && e.textContent.includes('manager')));
    await run((token) => { localStorage.setItem('auth_token', token); }, viewerToken);
    await goto('/employees'); await waitFor(() => document.body.innerText.includes('Add Employee'));
    assert.equal((await request('/admin/users')).status, 403);
  });
  for (const width of [390, 768, 1440]) {
    await check(`${width}px viewport renders landing and management`, async () => {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
      for (const path of ['/home','/dashboard','/licenses']) {
        await goto(path); await waitFor(() => document.querySelector('h1')?.textContent?.length > 2);
        assert.ok((await run(() => document.body.innerText)).length > 50);
        const overflow = await run(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 2, `${path} overflows viewport by ${overflow}px`);
      }
    });
  }
  console.log(results.join('\n'));
  console.log(`Browser console errors: ${consoleErrors.length}; network loading failures: ${failed.length}`);
  console.log(`Expected HTTP errors observed: ${httpErrors.join(', ')}`);
  if (consoleErrors.length) console.log(`Console samples: ${consoleErrors.slice(0,3).join(' | ')}`);
  if (failed.length) console.log(`Network samples: ${failed.slice(0,3).join(' | ')}`);
  if (results.some(r => r.startsWith('FAIL'))) process.exitCode = 1;
} finally {
  ws?.close(); edge.kill(); api.closeAllConnections(); site.closeAllConnections(); api.close(); site.close(); await pool.end();
}
