import { spawn, spawnSync } from 'node:child_process';

const HOST = '127.0.0.1';
const PORT = Number(process.env.EOL_RELEASE_SMOKE_PORT ?? 4332);
const BASE_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 15_000;

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

async function main() {
  const chrome = findChrome();
  const astroCli = process.platform === 'win32' ? 'node_modules/.bin/astro.cmd' : 'node_modules/.bin/astro';
  const preview = spawn(astroCli, ['preview', '--host', HOST, '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });
  let previewLog = '';
  preview.stdout?.on('data', (chunk) => { previewLog += String(chunk); });
  preview.stderr?.on('data', (chunk) => { previewLog += String(chunk); });

  try {
    await waitForHttp(`${BASE_URL}/releases/`);
    const target = `${BASE_URL}/releases/?days=365&page=2`;
    const result = spawnSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=5000',
      '--dump-dom',
      target
    ], {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      maxBuffer: 8 * 1024 * 1024
    });

    if (result.error) throw result.error;
    assert(result.status === 0, `Chrome exited with ${result.status}: ${result.stderr?.slice(-1000) ?? ''}`);
    const html = result.stdout ?? '';
    const itemCount = html.match(/\bdata-release-item(?:=""|\s|>)/g)?.length ?? 0;
    assert(itemCount > 0, '365-day second page rendered no release items');
    assert(itemCount <= 20, `365-day second page rendered ${itemCount} release items; expected at most 20`);
    assert(/data-release-page-status[^>]*>\s*2\s*\/\s*\d+ページ/.test(html), '365-day query did not render page 2 status');
    assert(/data-release-prev[^>]*(?!disabled)/.test(html) || !/data-release-prev[^>]*disabled/.test(html), 'previous button should be enabled on page 2');
    console.log(`Release browser pagination test passed. Page 2 DOM items: ${itemCount}.`);
  } catch (error) {
    if (previewLog.trim()) console.error(`\n--- Astro preview log ---\n${previewLog.trim()}`);
    throw error;
  } finally {
    await stopChild(preview);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
