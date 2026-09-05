import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [layout, styles] = await Promise.all([
  fs.readFile('src/layouts/BaseLayout.astro', 'utf8'),
  fs.readFile('src/styles.css', 'utf8')
]);

assert.match(layout, /viewport-fit=cover/, 'Viewport must support safe-area insets');
assert.match(layout, /data-menu-toggle/, 'Mobile menu toggle is required');
assert.match(layout, /aria-controls="site-main-nav"/, 'Mobile menu toggle must reference the main navigation');
assert.match(layout, /id="site-main-nav"/, 'Main navigation must expose the controlled id');
assert.match(layout, /aria-expanded="false"/, 'Mobile menu toggle must expose collapsed state');
assert.match(layout, /classList\.add\('js'\)/, 'JS enhancement marker is required for no-JS navigation fallback');
assert.match(layout, /event\.key !== 'Escape'/, 'Mobile navigation must support Escape to close');
assert.match(layout, /dataset\.open = String\(open\)/, 'Mobile navigation open state must be reflected in markup');

assert.match(styles, /@media \(max-width: 620px\)/, 'Narrow-screen breakpoint is required');
assert.match(styles, /\.js \.main-nav \{ display:none; \}/, 'JS-enhanced mobile navigation must collapse by default');
assert.match(styles, /\.js \.main-nav\[data-open="true"\] \{ display:flex; \}/, 'Mobile navigation must display when opened');
assert.match(styles, /min-height:44px/, 'Primary interactive controls must provide a touch-friendly minimum height');
assert.match(styles, /safe-area-inset-bottom/, 'Fixed controls must account for bottom safe area');
assert.match(styles, /safe-area-inset-right/, 'Fixed controls must account for right safe area');
assert.match(styles, /\.table-wrap::before/, 'Mobile tables must expose a horizontal-scroll hint');
assert.match(styles, /\.email-turnstile \{ max-width:100%; overflow-x:auto;/, 'Turnstile containers must not force page-level horizontal overflow');
assert.match(styles, /main a, \.site-footer a \{ overflow-wrap: anywhere; \}/, 'Long URLs must wrap instead of widening the page');

console.log('Responsive shell tests passed.');
