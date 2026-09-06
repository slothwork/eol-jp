import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const HOST = '127.0.0.1';
const PREVIEW_PORT = Number(process.env.EOL_SMOKE_PREVIEW_PORT ?? 4321);
const DEBUG_PORT = Number(process.env.EOL_SMOKE_DEBUG_PORT ?? 9222);
const BASE_URL = `http://${HOST}:${PREVIEW_PORT}`;
const DEBUG_URL = `http://${HOST}:${DEBUG_PORT}`;
const STEP_TIMEOUT_MS = 12_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser'
  ].filter(Boolean);

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (result.status === 0) return candidate;
  }

  throw new Error(`Chrome/Chromium not found. Tried: ${candidates.join(', ')}`);
}

async function waitForHttp(url, timeoutMs = STEP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

function closeChildStreams(child) {
  child?.stdin?.destroy();
  child?.stdout?.destroy();
  child?.stderr?.destroy();
}

async function stopChild(child, label) {
  if (!child) return;
  if (child.exitCode !== null || child.signalCode !== null) {
    closeChildStreams(child);
    return;
  }

  const waitForExit = (timeoutMs) => new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off('exit', done);
      resolve(true);
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.off('exit', done);
      resolve(false);
    }, timeoutMs);
    child.once('exit', done);
  });

  child.kill('SIGTERM');
  if (!(await waitForExit(2_000))) {
    console.warn(`${label} did not exit after SIGTERM; sending SIGKILL.`);
    child.kill('SIGKILL');
    await waitForExit(1_000);
  }
  closeChildStreams(child);
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
  }

  async connect() {
    if (typeof WebSocket !== 'function') {
      throw new Error('Global WebSocket is required. Use Node.js 22 or newer.');
    }

    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out connecting to Chrome DevTools Protocol')), STEP_TIMEOUT_MS);
      this.socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('Failed to connect to Chrome DevTools Protocol'));
      }, { once: true });
    });

    this.socket.addEventListener('message', (event) => this.#handleMessage(event));
  }

  #handleMessage(event) {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
      return;
    }

    if (!message.method) return;
    const waiters = this.waiters.get(message.method);
    if (!waiters?.length) return;
    const waiter = waiters.shift();
    if (waiters.length === 0) this.waiters.delete(message.method);
    clearTimeout(waiter.timer);
    waiter.resolve(message.params ?? {});
  }

  send(method, params = {}) {
    assert(this.socket?.readyState === WebSocket.OPEN, `CDP socket is not open for ${method}`);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for CDP command ${method}`));
      }, STEP_TIMEOUT_MS);
      this.pending.set(id, {
        method,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent(method, timeoutMs = STEP_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const waiters = this.waiters.get(method) ?? [];
        this.waiters.set(method, waiters.filter((waiter) => waiter.timer !== timer));
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeoutMs);
      const waiters = this.waiters.get(method) ?? [];
      waiters.push({ resolve, reject, timer });
      this.waiters.set(method, waiters);
    });
  }

  close() {
    this.socket?.close();
  }
}

async function createPageClient() {
  const response = await fetch(`${DEBUG_URL}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Could not create Chrome target: ${response.status}`);
  const target = await response.json();
  assert(target.webSocketDebuggerUrl, 'Chrome target did not return webSocketDebuggerUrl');
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'Browser evaluation failed');
  }
  return result.result?.value;
}

async function waitForExpression(client, expression, description, timeoutMs = STEP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(client, `Boolean(${expression})`)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function navigate(client, pathname) {
  const url = `${BASE_URL}${pathname}`;
  const loaded = client.waitForEvent('Page.loadEventFired');
  const result = await client.send('Page.navigate', { url });
  if (result.errorText) throw new Error(`Navigation failed for ${pathname}: ${result.errorText}`);
  await loaded;
  await waitForExpression(client, `document.readyState === 'complete'`, `${pathname} readyState`);
  await sleep(100);
  return url;
}

async function assertPageShell(client, pathname) {
  await navigate(client, pathname);
  const snapshot = await evaluate(client, `({
    title: document.title,
    heading: document.querySelector('main h1, main h2')?.textContent?.trim() ?? '',
    bodyLength: document.body?.innerText?.trim().length ?? 0
  })`);
  assert(snapshot.title.includes('EOL情報.jp'), `${pathname}: title does not include EOL情報.jp`);
  assert(snapshot.heading.length > 0, `${pathname}: main heading is missing`);
  assert(snapshot.bodyLength > 100, `${pathname}: page body looks unexpectedly empty`);
  console.log(`✓ ${pathname} — ${snapshot.heading}`);
}

async function runBrowserFlow(client) {
  await navigate(client, '/');
  await evaluate(client, `localStorage.clear()`);

  for (const pathname of ['/', '/eol/', '/upcoming/', '/calendar/', '/my-eol/', '/my-eol/github-import/']) {
    await assertPageShell(client, pathname);
  }

  await navigate(client, '/eol/nodejs/');
  await waitForExpression(client, `document.querySelector('[data-tracked-version-select]')?.options.length > 1`, 'Node.js version selector');
  const savedVersion = await evaluate(client, `(() => {
    const select = document.querySelector('[data-tracked-version-select]');
    const save = document.querySelector('[data-tracked-version-save]');
    if (!(select instanceof HTMLSelectElement) || !(save instanceof HTMLButtonElement) || select.options.length < 2) return null;
    select.selectedIndex = 1;
    const version = select.value;
    save.click();
    return version;
  })()`);
  assert(savedVersion, 'Node.js version could not be selected for My EOL smoke test');
  await waitForExpression(
    client,
    `JSON.parse(localStorage.getItem('eol-jp:tracked-products:v1') ?? '{"products":{}}').products?.nodejs?.version === ${JSON.stringify(savedVersion)}`,
    'My EOL localStorage save'
  );
  await waitForExpression(client, `!document.querySelector('[data-tracked-version-summary]')?.hidden`, 'tracked version summary');
  console.log(`✓ product save — Node.js ${savedVersion}`);

  await navigate(client, '/my-eol/');
  await waitForExpression(client, `document.querySelector('[data-my-eol-loading]')?.hidden === true`, 'My EOL catalog load');
  const dashboard = await evaluate(client, `({
    total: document.querySelector('[data-my-eol-total]')?.textContent?.trim(),
    text: document.querySelector('[data-my-eol-list]')?.textContent ?? ''
  })`);
  assert(dashboard.total === '1', `My EOL dashboard expected total=1, got ${dashboard.total}`);
  assert(dashboard.text.includes('Node.js'), 'My EOL dashboard does not render the saved Node.js entry');
  console.log('✓ My EOL dashboard — saved product is rendered');

  await navigate(client, '/eol/');
  await waitForExpression(client, `document.querySelector('[data-view-history-section]')?.hidden === false`, 'recently viewed section');
  const historyHasNode = await evaluate(client, `Boolean(document.querySelector('[data-view-history-list] a[href="/eol/nodejs/"]'))`);
  assert(historyHasNode, 'Recently viewed products does not contain Node.js');
  console.log('✓ view history — Node.js is shown in recently viewed products');

  await navigate(client, '/my-eol/github-import/');
  await evaluate(client, `(() => {
    const input = document.querySelector('[data-github-repository-url]');
    const form = document.querySelector('[data-github-import-form]');
    if (!(input instanceof HTMLInputElement) || !(form instanceof HTMLFormElement)) return false;
    input.value = 'https://example.com/not-a-github-repository';
    form.requestSubmit();
    return true;
  })()`);
  await waitForExpression(
    client,
    `document.querySelector('[data-github-import-status]')?.textContent?.includes('GitHubの公開リポジトリURL')`,
    'GitHub import invalid URL validation'
  );
  assert(await evaluate(client, `document.querySelector('[data-github-import-submit]')?.disabled === false`), 'GitHub import submit button remained disabled');
  console.log('✓ GitHub import — invalid URL is rejected without external API dependency');

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true
  });
  await navigate(client, '/');
  await waitForExpression(client, `getComputedStyle(document.querySelector('[data-menu-toggle]')).display !== 'none'`, 'mobile menu toggle');
  await evaluate(client, `document.querySelector('[data-menu-toggle]')?.click()`);
  await waitForExpression(client, `document.querySelector('[data-main-nav]')?.dataset.open === 'true'`, 'mobile navigation opening');
  assert(await evaluate(client, `document.querySelector('[data-menu-toggle]')?.getAttribute('aria-expanded') === 'true'`), 'Mobile menu aria-expanded was not updated');
  await client.send('Emulation.clearDeviceMetricsOverride');
  console.log('✓ mobile navigation — menu opens and updates aria-expanded');
}

async function main() {
  const chrome = findChrome();
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'eol-jp-smoke-'));
  const astroCli = path.resolve('node_modules/astro/astro.js');
  let preview = null;
  let browser = null;
  let client = null;
  let previewLog = '';
  let browserLog = '';

  try {
    preview = spawn(process.execPath, [
      astroCli, 'preview', '--host', HOST, '--port', String(PREVIEW_PORT)
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    preview.stdout?.on('data', (chunk) => { previewLog += String(chunk); });
    preview.stderr?.on('data', (chunk) => { previewLog += String(chunk); });
    await waitForHttp(`${BASE_URL}/`);

    browser = spawn(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${tempDir}`,
      'about:blank'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    browser.stdout?.on('data', (chunk) => { browserLog += String(chunk); });
    browser.stderr?.on('data', (chunk) => { browserLog += String(chunk); });
    await waitForHttp(`${DEBUG_URL}/json/version`);

    client = await createPageClient();
    await runBrowserFlow(client);
    console.log('Browser smoke tests passed.');
  } catch (error) {
    if (previewLog.trim()) console.error(`\n--- Astro preview log ---\n${previewLog.trim()}`);
    if (browserLog.trim()) console.error(`\n--- Chrome log ---\n${browserLog.trim()}`);
    throw error;
  } finally {
    client?.close();
    await sleep(50);
    await stopChild(browser, 'Chrome');
    await stopChild(preview, 'Astro preview');
    try {
      await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (error) {
      console.warn(`Could not remove temporary Chrome profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});