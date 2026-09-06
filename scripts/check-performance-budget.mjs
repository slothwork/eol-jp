import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  extractPageAssets,
  formatKiB,
  gzipBytes,
  resolveAssetPath
} from './performance-budget-utils.mjs';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const budgetPath = path.join(root, 'performance-budget.json');
const budget = JSON.parse(await readFile(budgetPath, 'utf8'));

if (budget?.schemaVersion !== 1 || !Array.isArray(budget.pages) || !budget.global) {
  throw new Error('performance-budget.json has an unsupported schema');
}

async function readBuffer(filePath) {
  return readFile(filePath);
}

async function collectFiles(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await collectFiles(full));
    else if (entry.isFile()) result.push(full);
  }
  return result;
}

function assertBudget(actual, limit, label, failures) {
  if (!Number.isFinite(limit) || limit <= 0) {
    failures.push(`${label}: invalid budget ${limit}`);
    return;
  }
  if (actual > limit) failures.push(`${label}: ${formatKiB(actual)} > ${formatKiB(limit)}`);
}

async function measurePage(entry) {
  const htmlFile = path.resolve(distDir, entry.html);
  const html = await readFile(htmlFile, 'utf8');
  const assets = extractPageAssets(html);
  const jsBuffers = [];
  const cssBuffers = [];

  for (const src of assets.scripts) jsBuffers.push(await readBuffer(resolveAssetPath(distDir, htmlFile, src)));
  for (const href of assets.stylesheets) cssBuffers.push(await readBuffer(resolveAssetPath(distDir, htmlFile, href)));

  const inlineJs = Buffer.from(assets.inlineScripts.join('\n'));
  const inlineCss = Buffer.from(assets.inlineStyles.join('\n'));
  const htmlBuffer = Buffer.from(html);
  const jsGzip = jsBuffers.reduce((sum, value) => sum + gzipBytes(value), gzipBytes(inlineJs));
  const cssGzip = cssBuffers.reduce((sum, value) => sum + gzipBytes(value), gzipBytes(inlineCss));
  const externalGzip = [...jsBuffers, ...cssBuffers].reduce((sum, value) => sum + gzipBytes(value), 0);

  return {
    route: entry.route,
    htmlRaw: htmlBuffer.byteLength,
    htmlGzip: gzipBytes(htmlBuffer),
    jsGzip,
    cssGzip,
    totalGzip: gzipBytes(htmlBuffer) + externalGzip,
    scriptCount: assets.scripts.length,
    stylesheetCount: assets.stylesheets.length
  };
}

const allFiles = await collectFiles(distDir);
const jsFiles = allFiles.filter((file) => file.endsWith('.js'));
const cssFiles = allFiles.filter((file) => file.endsWith('.css'));
const jsGzipSizes = await Promise.all(jsFiles.map(async (file) => gzipBytes(await readBuffer(file))));
const cssGzipSizes = await Promise.all(cssFiles.map(async (file) => gzipBytes(await readBuffer(file))));
const globalMetrics = {
  jsGzip: jsGzipSizes.reduce((sum, value) => sum + value, 0),
  cssGzip: cssGzipSizes.reduce((sum, value) => sum + value, 0),
  largestJsGzip: jsGzipSizes.length ? Math.max(...jsGzipSizes) : 0,
  jsFileCount: jsFiles.length,
  cssFileCount: cssFiles.length
};

console.log('Performance budget report (gzip-equivalent build artifact sizes)');
console.log(`Global JS: ${formatKiB(globalMetrics.jsGzip)} across ${globalMetrics.jsFileCount} files`);
console.log(`Global CSS: ${formatKiB(globalMetrics.cssGzip)} across ${globalMetrics.cssFileCount} files`);
console.log(`Largest JS chunk: ${formatKiB(globalMetrics.largestJsGzip)}`);

const failures = [];
assertBudget(globalMetrics.jsGzip, budget.global.maxJsGzipBytes, 'Global JS gzip', failures);
assertBudget(globalMetrics.cssGzip, budget.global.maxCssGzipBytes, 'Global CSS gzip', failures);
assertBudget(globalMetrics.largestJsGzip, budget.global.maxLargestJsGzipBytes, 'Largest JS chunk gzip', failures);

for (const entry of budget.pages) {
  const metrics = await measurePage(entry);
  console.log(
    `${metrics.route} total=${formatKiB(metrics.totalGzip)} html=${formatKiB(metrics.htmlGzip)} ` +
    `js=${formatKiB(metrics.jsGzip)} css=${formatKiB(metrics.cssGzip)} ` +
    `(raw HTML ${formatKiB(metrics.htmlRaw)}, ${metrics.scriptCount} JS assets, ${metrics.stylesheetCount} CSS assets)`
  );
  assertBudget(metrics.totalGzip, entry.maxTotalGzipBytes, `${entry.route} total gzip`, failures);
  assertBudget(metrics.jsGzip, entry.maxJsGzipBytes, `${entry.route} JS gzip`, failures);
  assertBudget(metrics.cssGzip, entry.maxCssGzipBytes, `${entry.route} CSS gzip`, failures);
}

if (failures.length > 0) {
  console.error('\nPerformance budget exceeded:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Performance budgets passed.');
}
