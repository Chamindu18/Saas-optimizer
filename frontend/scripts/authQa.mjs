import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, join, extname } from 'node:path';

const dist = resolve('dist');
const origin = 'http://127.0.0.1:3002';
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, origin).pathname;
  let file = resolve(dist, `.${pathname}`);
  if (!file.startsWith(dist) || !(await stat(file).catch(() => null))?.isFile()) file = join(dist, 'index.html');
  response.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] || 'application/octet-stream');
  response.end(await readFile(file));
});
server.listen(3002, '127.0.0.1');
const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--disable-gpu', '--disable-gpu-sandbox', '--disable-features=Vulkan', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=47891',
  `--user-data-dir=${process.env.TEMP}\\seatwatch-landing-qa-${Date.now()}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket, nextId = 0;
const pending = new Map();
const errors = [];
const failedRequests = [];
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 15000);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function run(fn) { return evaluate(`(${fn.toString()})()`); }
try {
  let target;
  for (let i = 0; i < 100; i++) {
    try { target = (await (await fetch('http://127.0.0.1:47891/json/list')).json()).find(item => item.type === 'page' && item.url === 'about:blank'); if (target) break; } catch {}
    await delay(150);
  }
  assert.ok(target, 'Edge CDP target available');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const waiter = pending.get(message.id); pending.delete(message.id);
      if (!waiter) return;
      if (message.error) waiter.reject(new Error(message.error.message)); else waiter.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
    if (message.method === 'Network.loadingFailed') failedRequests.push(message.params.errorText);
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await mkdir(resolve('qa-screenshots/auth'), { recursive: true });
  for (const route of ['login', 'register']) for (const width of [390, 768, 1024, 1440, 1680]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    await send('Page.navigate', { url: `${origin}/${route}` });
    let ready = false;
    for (let i = 0; i < 50; i++) { if (await run(() => document.readyState === 'complete' && !!document.querySelector('.sw-auth__submit'))) { ready = true; break; } await delay(100); }
    assert.ok(ready, `${route} rendered at ${width}`);
    const result = await run(() => {
      const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      const button = document.querySelector('.sw-auth__submit');
      const style = getComputedStyle(button);
      const a = luminance(style.color), b = luminance(style.backgroundColor);
      return { route: location.pathname, width: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth, heading: document.querySelector('h1')?.textContent, labels: [...document.querySelectorAll('.sw-auth .input-label')].map(node => node.textContent), formCount: document.querySelectorAll('form').length, button: { color: style.color, background: style.backgroundColor, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), visible: !!button.getClientRects().length }, home: !!document.querySelector('a[href="/home"]') };
    });
    assert.equal(result.route, `/${route}`);
    assert.ok(result.overflow <= 2, `${route} ${width} overflow ${result.overflow}`);
    assert.ok(result.button.visible && result.button.contrast >= 4.5, `${route} ${width} button contrast ${result.button.contrast}`);
    assert.ok(result.home);
    if (route === 'login') assert.ok(result.labels.length >= 2 && result.formCount === 1);
    else assert.ok(result.formCount === 0 && result.labels.length === 0 && /administrator/i.test(result.heading));
    const layout = await send('Page.getLayoutMetrics');
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(layout.cssContentSize.height), scale: 1 } });
    await writeFile(join(resolve('qa-screenshots/auth'), `${route}-${width}.png`), Buffer.from(shot.data, 'base64'));
    if (width === 390 && route === 'login') {
      await run(() => { const toggle = document.querySelector('.input-toggle-password'); toggle.focus(); toggle.click(); });
      assert.ok(await run(() => document.querySelector('input[name="password"]').type === 'text' && document.activeElement === document.querySelector('.input-toggle-password')), `${route} password visibility and focus`);
      await run(() => document.querySelector('.input-toggle-password').click());
      assert.ok(await run(() => document.querySelector('input[name="password"]').type === 'password'), `${route} password concealed`);
      await run(() => document.querySelector('.sw-auth__submit').click());
      await delay(100);
      assert.ok(await run(() => document.querySelectorAll('[role="alert"]').length >= 2), `${route} required field errors announced`);
    }
    console.log(JSON.stringify(result));
  }
  assert.deepEqual(errors, [], 'No browser console exceptions');
  assert.deepEqual(failedRequests, [], 'No unexpected network failures');
} finally { socket?.close(); edge.kill(); server.closeAllConnections(); server.close(); }
