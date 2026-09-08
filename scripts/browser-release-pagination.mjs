import { spawn, spawnSync } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const HOST = '127.0.0.1';
const PORT = Number(process.env.EOL_RELEASE_SMOKE_PORT ?? 4332);
const BASE_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 30_000;
const STYLE_SMOKE_FILE = path.resolve('dist/releases/__pagination-style-smoke.html');
const STYLE_SMOKE_PATH = '/releases/__pagination-style-smoke.html';

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

function styleSmokeDocument() {
  return `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><title>Release pagination style smoke</title></head>
<body>
  <iframe id="target" src="/releases/?days=365&page=2" style="width:390px;height:844px;border:0"></iframe>
  <output id="result">pending</output>
  <script>
    const frame = document.getElementById('target');
    const root = document.documentElement;
    const deadline = Date.now() + 10000;

    function retry(fn) {
      if (Date.now() < deadline) {
        setTimeout(fn, 50);
        return true;
      }
      return false;
    }

    function inspectCard() {
      try {
        const doc = frame.contentDocument;
        const results = doc?.querySelector('[data-release-results]');
        const items = doc ? Array.from(doc.querySelectorAll('[data-release-card-list] [data-release-item]')) : [];
        if (results?.getAttribute('data-release-view') !== 'card' || items.length === 0) {
          if (retry(inspectCard)) return;
          root.dataset.testError = 'timed out waiting for card view';
          frame.remove();
          return;
        }

        const item = items[0];
        const date = item.querySelector('.release-item-date');
        const links = item.querySelector('.release-item-links');
        const itemStyle = getComputedStyle(item);
        const dateStyle = date ? getComputedStyle(date) : null;
        const linksStyle = links ? getComputedStyle(links) : null;

        root.dataset.cardItemCount = String(items.length);
        root.dataset.cardView = results?.getAttribute('data-release-view') ?? '';
        root.dataset.storedView = frame.contentWindow?.localStorage.getItem('eol-release-view') ?? '';
        root.dataset.itemDisplay = itemStyle.display;
        root.dataset.itemBorderStyle = itemStyle.borderTopStyle;
        root.dataset.itemPaddingLeft = itemStyle.paddingLeft;
        root.dataset.dateDisplay = dateStyle?.display ?? '';
        root.dataset.linksDisplay = linksStyle?.display ?? '';
        root.dataset.ready = 'true';
        document.getElementById('result').textContent = 'ready';
        frame.remove();
      } catch (error) {
        root.dataset.testError = String(error);
        frame.remove();
      }
    }

    function inspectTable() {
      try {
        const doc = frame.contentDocument;
        const status = doc?.querySelector('[data-release-page-status]')?.textContent?.trim() ?? '';
        const results = doc?.querySelector('[data-release-results]');
        const tableWrap = doc?.querySelector('[data-release-table-wrap]');
        const rows = doc ? Array.from(doc.querySelectorAll('[data-release-table-body] [data-release-item]')) : [];
        if (!status.startsWith('2 /') || results?.getAttribute('data-release-view') !== 'table' || rows.length === 0) {
          if (retry(inspectTable)) return;
          root.dataset.testError = 'timed out waiting for dynamic table page 2';
          frame.remove();
          return;
        }

        const rowStyle = getComputedStyle(rows[0]);
        root.dataset.tableItemCount = String(rows.length);
        root.dataset.pageStatus = status;
        root.dataset.defaultView = results?.getAttribute('data-release-view') ?? '';
        root.dataset.tableRowDisplay = rowStyle.display;
        root.dataset.tableFits = String(Boolean(tableWrap) && tableWrap.scrollWidth <= tableWrap.clientWidth + 1);

        const cardButton = doc?.querySelector('[data-release-view-button="card"]');
        cardButton?.click();
        setTimeout(inspectCard, 0);
      } catch (error) {
        root.dataset.testError = String(error);
        frame.remove();
      }
    }

    frame.addEventListener('load', () => setTimeout(inspectTable, 0), { once: true });
    setTimeout(inspectTable, 100);
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
  await writeFile(STYLE_SMOKE_FILE, styleSmokeDocument(), 'utf-8');

  const preview = spawn(astroCli, ['preview', '--host', HOST, '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });
  let previewLog = '';
  preview.stdout?.on('data', (chunk) => { previewLog += String(chunk); });
  preview.stderr?.on('data', (chunk) => { previewLog += String(chunk); });

  try {
    await waitForHttp(`${BASE_URL}${STYLE_SMOKE_PATH}`);
    const result = spawnSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=5000',
      '--dump-dom',
      `${BASE_URL}${STYLE_SMOKE_PATH}`
    ], {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      maxBuffer: 8 * 1024 * 1024
    });

    if (result.error) throw result.error;
    assert(result.status === 0, `Chrome exited with ${result.status}: ${result.stderr?.slice(-1000) ?? ''}`);
    const html = result.stdout ?? '';
    const testError = readDataAttribute(html, 'test-error');
    assert(!testError, `release style smoke page failed: ${testError}`);
    assert(readDataAttribute(html, 'ready') === 'true', 'release style smoke page did not complete');

    const tableItemCount = Number(readDataAttribute(html, 'table-item-count') ?? '0');
    const cardItemCount = Number(readDataAttribute(html, 'card-item-count') ?? '0');
    const pageStatus = readDataAttribute(html, 'page-status') ?? '';
    const defaultView = readDataAttribute(html, 'default-view');
    const tableRowDisplay = readDataAttribute(html, 'table-row-display');
    const tableFits = readDataAttribute(html, 'table-fits');
    const cardView = readDataAttribute(html, 'card-view');
    const storedView = readDataAttribute(html, 'stored-view');
    const itemDisplay = readDataAttribute(html, 'item-display');
    const borderStyle = readDataAttribute(html, 'item-border-style');
    const paddingLeft = readDataAttribute(html, 'item-padding-left') ?? '0px';
    const dateDisplay = readDataAttribute(html, 'date-display');
    const linksDisplay = readDataAttribute(html, 'links-display');

    assert(tableItemCount > 0, '365-day second page rendered no table rows');
    assert(tableItemCount <= 20, `365-day second page rendered ${tableItemCount} table rows; expected at most 20`);
    assert(cardItemCount > 0, 'card toggle rendered no release cards');
    assert(cardItemCount <= 20, `card toggle rendered ${cardItemCount} release cards; expected at most 20`);
    assert(/^2\s*\/\s*\d+ページ$/.test(pageStatus), `365-day query did not render page 2 status: ${pageStatus}`);
    assert(defaultView === 'table', `release page default view should be table: view=${defaultView}`);
    assert(tableRowDisplay === 'grid', `mobile release table row should collapse to grid: display=${tableRowDisplay}`);
    assert(tableFits === 'true', 'mobile release table should not require horizontal scrolling');
    assert(cardView === 'card', `release view toggle did not switch to card: view=${cardView}`);
    assert(storedView === 'card', `release view preference was not stored: stored=${storedView}`);
    assert(itemDisplay === 'grid', `dynamic release card lost grid layout: display=${itemDisplay}`);
    assert(borderStyle === 'solid', `dynamic release card lost border styling: border-style=${borderStyle}`);
    assert(Number.parseFloat(paddingLeft) > 0, `dynamic release card lost padding: padding-left=${paddingLeft}`);
    assert(dateDisplay === 'flex', `dynamic release date lost flex layout: display=${dateDisplay}`);
    assert(linksDisplay === 'flex', `dynamic release links lost flex layout: display=${linksDisplay}`);

    console.log(`Release browser pagination test passed. Table rows: ${tableItemCount}; card items: ${cardItemCount}.`);
  } catch (error) {
    if (previewLog.trim()) console.error(`\n--- Astro preview log ---\n${previewLog.trim()}`);
    throw error;
  } finally {
    await stopChild(preview);
    await rm(STYLE_SMOKE_FILE, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
