import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, join, extname } from 'node:path';

const buildDirectory = resolve('dist');
const site = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1:3001').pathname;
  let file = resolve(buildDirectory, `.${pathname}`);
  if (!file.startsWith(buildDirectory) || !(await stat(file).catch(() => null))?.isFile()) file = join(buildDirectory, 'index.html');
  response.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)] || 'application/octet-stream');
  response.end(await readFile(file));
});
site.listen(3001, '127.0.0.1');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=47891', `--user-data-dir=${process.env.TEMP}\\seatwatch-landing-qa-${Date.now()}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let nextId = 0;
const pending = new Map();
const errors = [];
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
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push(`${message.params.response.status} ${message.params.response.url}`);
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const directory = resolve('qa-screenshots/landing');
  await mkdir(directory, { recursive: true });
  for (const width of [390, 768, 1024, 1440, 1680]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    await send('Page.navigate', { url: 'http://127.0.0.1:3001/home' });
    let ready = false;
    for (let i = 0; i < 50; i++) { if (await run(() => document.readyState === 'complete' && !!document.querySelector('.sw-landing__hero'))) { ready = true; break; } await delay(100); }
    assert.ok(ready, `Landing rendered at ${width}px`);
    const result = await run(() => {
      const hex = color => { const parts = color.match(/[\d.]+/g).slice(0, 3).map(Number); return parts.map(c => { const s = c / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0); };
      const links = [...document.querySelectorAll('.sw-landing__button--primary')].filter(node => node.getClientRects().length);
      const buttons = links.map(node => { const style = getComputedStyle(node); const a = hex(style.color), b = hex(style.backgroundColor); return { text: node.textContent.trim(), color: style.color, background: style.backgroundColor, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), opacity: style.opacity, display: style.display, visibility: style.visibility, pointerEvents: style.pointerEvents, fontSize: style.fontSize }; });
      return { width: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth, buttons, heading: document.querySelector('h1')?.textContent, preview: !!document.querySelector('[role="img"][aria-label]'), features: !!document.querySelector('#features'), workflow: !!document.querySelector('#how-it-works') };
    });
    assert.ok(result.overflow <= 2, `${width}px horizontal overflow: ${result.overflow}`);
    assert.equal(result.buttons.length, width <= 800 ? 2 : 3);
    assert.ok(result.buttons.every(button => button.contrast >= 4.5 && button.opacity === '1' && button.visibility === 'visible' && button.pointerEvents !== 'none'));
    assert.ok(result.preview && result.features && result.workflow);
    const layout = await send('Page.getLayoutMetrics');
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.ceil(layout.cssContentSize.height), scale: 1 } });
    await writeFile(join(directory, `landing-${width}.png`), Buffer.from(shot.data, 'base64'));
    console.log(JSON.stringify(result));
    if (width === 390) {
      await run(() => document.querySelector('.sw-landing__menu-toggle').click());
      let mobile;
      for (let i = 0; i < 30; i++) {
        mobile = await run(() => ({ expanded: document.querySelector('.sw-landing__menu-toggle').getAttribute('aria-expanded'), links: [...document.querySelectorAll('.sw-landing__mobile-nav a')].map(a => a.getAttribute('href')) }));
        if (mobile.expanded === 'true') break;
        await delay(50);
      }
      assert.equal(mobile.expanded, 'true'); assert.deepEqual(mobile.links, ['#features', '#how-it-works', '/login', '/register']);
      const navShot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(directory, 'mobile-navigation-390.png'), Buffer.from(navShot.data, 'base64'));
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      for (let i = 0; i < 30 && !(await run(() => document.querySelector('.sw-landing__mobile-nav') === null)); i++) await delay(50);
      assert.equal(await run(() => document.querySelector('.sw-landing__mobile-nav') === null), true);
      assert.equal(await run(() => document.activeElement === document.querySelector('.sw-landing__menu-toggle')), true);
    }
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await run(() => getComputedStyle(document.querySelector('.sw-landing__button')).transitionDuration), '1e-05s');
  assert.deepEqual(errors, []);
  console.log('Landing browser QA passed.');
} finally { socket?.close(); edge.kill(); site.close(); }

