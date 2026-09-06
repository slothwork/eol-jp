import assert from 'node:assert/strict';
import path from 'node:path';
import {
  extractPageAssets,
  gzipBytes,
  isLocalAsset,
  resolveAssetPath
} from './performance-budget-utils.mjs';

const html = `<!doctype html>
<html><head>
<link rel="stylesheet" href="/_astro/site.abc.css">
<link rel="stylesheet" href="https://example.com/external.css">
<style>.inline{display:block}</style>
<script type="application/ld+json">{"name":"ignored as executable JS"}</script>
<script type="module" src="/_astro/page.abc.js"></script>
<script src="https://example.com/external.js"></script>
<script>window.test = true;</script>
</head><body></body></html>`;

const assets = extractPageAssets(html);
assert.deepEqual(assets.scripts, ['/_astro/page.abc.js']);
assert.deepEqual(assets.stylesheets, ['/_astro/site.abc.css']);
assert.equal(assets.inlineScripts.length, 1);
assert.match(assets.inlineScripts[0], /window\.test/);
assert.equal(assets.inlineStyles.length, 1);
assert.match(assets.inlineStyles[0], /display:block/);

assert.equal(isLocalAsset('/_astro/app.js'), true);
assert.equal(isLocalAsset('./app.js'), true);
assert.equal(isLocalAsset('https://example.com/app.js'), false);
assert.equal(isLocalAsset('//example.com/app.js'), false);
assert.equal(isLocalAsset('data:text/javascript,1'), false);

const dist = path.resolve('/tmp/eol-dist');
const htmlFile = path.join(dist, 'my-eol', 'index.html');
assert.equal(resolveAssetPath(dist, htmlFile, '/_astro/app.js'), path.join(dist, '_astro', 'app.js'));
assert.equal(resolveAssetPath(dist, htmlFile, './local.js'), path.join(dist, 'my-eol', 'local.js'));
assert.throws(() => resolveAssetPath(dist, htmlFile, '../../../escape.js'), /escapes dist directory/);

const repetitive = Buffer.from('hello performance budget '.repeat(100));
assert.ok(gzipBytes(repetitive) > 0);
assert.ok(gzipBytes(repetitive) < repetitive.byteLength);

console.log('Performance budget utility tests passed.');
