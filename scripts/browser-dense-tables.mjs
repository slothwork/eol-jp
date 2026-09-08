import { spawn, spawnSync } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const HOST = '127.0.0.1';
const PORT = Number(process.env.EOL_DENSE_TABLE_SMOKE_PORT ?? 4333);
const BASE_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 30_000;
const SMOKE_FILE = path.resolve('dist/__dense-table-smoke.html');
const SMOKE_PATH = '/__dense-table-smoke.html';

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

async function waitForHttp(url) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await sleep(150);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

function smokeDocument() {
  return `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><title>Dense table browser smoke</title></head>
<body>
  <div id="frames"></div>
  <output id="result">pending</output>
  <script>
    const targets = [
      { id: 'products', path: '/eol/', selector: '.dense-table--product' },
      { id: 'category', path: '/category/lang/', selector: '.dense-table--product' },
      { id: 'upcoming', path: '/upcoming/', selector: '.dense-table--deadline' },
      { id: 'changes', path: '/changes/', selector: '.dense-table--change' },
      { id: 'version', path: '/eol/nodejs/', selector: '#version-support-table', wrapSelector: '.table-wrap' }
    ];
    const root = document.documentElement;
    const deadline = Date.now() + 12000;

    function inspect(target, frame) {
      try {
        const doc = frame.contentDocument;
        const win = frame.contentWindow;
        const table = doc?.querySelector(target.selector);
        const wrap = table?.closest(target.wrapSelector ?? '.dense-table-wrap');
        let row = table?.querySelector('tbody tr:not([hidden])');
        if (!table || !wrap) {
          if (Date.now() < deadline) return setTimeout(() => inspect(target, frame), 50);
          root.dataset.testError = target.id + ': responsive table not found';
          frame.remove();
          return;
        }
        if (!row) {
          row = doc.createElement('tr');
          for (let index = 0; index < 5; index += 1) {
            const cell = doc.createElement('td');
            cell.textContent = 'responsive smoke';
            row.append(cell);
          }
          table.querySelector('tbody')?.append(row);
        }

        const display = win?.getComputedStyle(row).display ?? '';
        const fits = wrap.scrollWidth <= wrap.clientWidth + 1;
        root.dataset[target.id + 'Display'] = display;
        root.dataset[target.id + 'Fits'] = String(fits);
        root.dataset[target.id + 'Width'] = String(win?.innerWidth ?? -1);
        root.dataset[target.id + 'Media'] = String(win?.matchMedia('(max-width: 620px)').matches ?? false);
        root.dataset[target.id + 'StyleSheets'] = String(doc?.styleSheets.length ?? -1);
        root.dataset[target.id + 'Ready'] = 'true';
        frame.remove();

        if (targets.every((item) => root.dataset[item.id + 'Ready'] === 'true')) {
          root.dataset.ready = 'true';
          document.getElementById('result').textContent = 'ready';
        }
      } catch (error) {
        root.dataset.testError = target.id + ': ' + String(error);
        frame.remove();
      }
    }

    for (const target of targets) {
      const frame = document.createElement('iframe');
      frame.src = target.path;
      frame.style.width = '390px';
      frame.style.height = '844px';
      frame.style.border = '0';
      frame.addEventListener('load', () => setTimeout(() => inspect(target, frame), 0), { once: true });
      document.getElementById('frames').append(frame);
    }
  <\/script>
</body>
</html>`;
}

function readDataAttribute(html, name) {
  const match = new RegExp(`\\bdata-${name}="([^"]*)"`).exec(html);
  return match?.[1] ?? null;
}

async function main() {
  const chrome = findChrome();
  const astroCli = process.platform === 'win32' ? 'node_modules/.bin/astro.cmd' : 'node_modules/.bin/astro';
  await writeFile(SMOKE_FILE, smokeDocument(), 'utf-8');

  const preview = spawn(astroCli, ['preview', '--host', HOST, '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });
  let previewLog = '';
  preview.stdout?.on('data', (chunk) => { previewLog += String(chunk); });
  preview.stderr?.on('data', (chunk) => { previewLog += String(chunk); });

  try {
    await waitForHttp(`${BASE_URL}${SMOKE_PATH}`);
    const result = spawnSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=7000',
      '--dump-dom',
      `${BASE_URL}${SMOKE_PATH}`
    ], {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      maxBuffer: 8 * 1024 * 1024
    });

    if (result.error) throw result.error;
    assert(result.status === 0, `Chrome exited with ${result.status}: ${result.stderr?.slice(-1000) ?? ''}`);
    const html = result.stdout ?? '';
    const testError = readDataAttribute(html, 'test-error');
    assert(!testError, `dense table smoke failed: ${testError}`);
    assert(readDataAttribute(html, 'ready') === 'true', 'dense table smoke page did not complete');

    for (const id of ['products', 'category', 'upcoming', 'changes', 'version']) {
      const display = readDataAttribute(html, `${id}-display`);
      const width = readDataAttribute(html, `${id}-width`);
      const media = readDataAttribute(html, `${id}-media`);
      const styleSheets = readDataAttribute(html, `${id}-style-sheets`);
      assert(display === 'grid', `${id}: mobile table row did not collapse to grid (display=${display}, width=${width}, media620=${media}, stylesheets=${styleSheets})`);
      assert(readDataAttribute(html, `${id}-fits`) === 'true', `${id}: mobile table requires horizontal scrolling`);
    }

    console.log('Dense table browser smoke passed for list views and the product-detail version support table.');
  } catch (error) {
    if (previewLog.trim()) console.error(`\n--- Astro preview log ---\n${previewLog.trim()}`);
    throw error;
  } finally {
    await stopChild(preview);
    await rm(SMOKE_FILE, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
