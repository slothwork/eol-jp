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
assert.match(layout, /aria-current=\{current\}/, 'Main navigation must expose the current route semantically');
assert.match(layout, /canonicalPath === href/, 'Exact main navigation matches must identify the current page');
assert.match(layout, /return 'page' as const/, 'Exact main navigation matches must use aria-current=page');
assert.match(layout, /canonicalPath\.startsWith\(prefix\)/, 'Nested routes must remain associated with their main navigation section');
assert.match(layout, /\? 'location' as const/, 'Nested routes must use aria-current=location');
assert.match(layout, /prefixes: \['\/eol\/', '\/category\/'\]/, 'Category routes must remain associated with the product list section');
assert.match(layout, /aria-hidden="true">• /, 'Current navigation must have a non-color visual marker');
assert.match(layout, /current \? <strong>/, 'Current navigation label must receive non-color emphasis');
assert.match(layout, /classList\.add\('js'\)/, 'JS enhancement marker is required for no-JS navigation fallback');
assert.match(layout, /event\.key !== 'Escape'/, 'Mobile navigation must support Escape to close');
assert.match(layout, /dataset\.open = String\(open\)/, 'Mobile navigation open state must be reflected in markup');
assert.match(layout, /url\.origin === window\.location\.origin/, 'Same-origin links must stay in the current tab');
assert.match(layout, /link\.target = '_blank'/, 'External links must open in a new tab');
assert.match(layout, /rel\.add\('noopener'\)/, 'External links must include noopener');
assert.match(layout, /rel\.add\('noreferrer'\)/, 'External links must include noreferrer');
assert.match(layout, /new MutationObserver/, 'Dynamically added external links must receive the same behavior');

assert.match(styles, /@media \(max-width: 620px\)/, 'Narrow-screen breakpoint is required');
assert.match(styles, /\.js \.main-nav \{ display:none; \}/, 'JS-enhanced mobile navigation must collapse by default');
assert.match(styles, /\.js \.main-nav\[data-open="true"\] \{ display:flex; \}/, 'Mobile navigation must display when opened');
assert.match(styles, /min-height:44px/, 'Primary interactive controls must provide a touch-friendly minimum height');
assert.match(styles, /safe-area-inset-bottom/, 'Fixed controls must account for bottom safe area');
assert.match(styles, /safe-area-inset-right/, 'Fixed controls must account for right safe area');
assert.match(styles, /\.table-wrap::before/, 'Mobile tables must expose a horizontal-scroll hint');
assert.match(styles, /\.email-turnstile \{ max-width:100%; overflow-x:auto;/, 'Turnstile containers must not force page-level horizontal overflow');
assert.match(styles, /main a, \.site-footer a \{ overflow-wrap: anywhere; \}/, 'Long URLs must wrap instead of widening the page');

assert.match(styles, /\.hero h1 \{[^}]*font-size: clamp\(2rem,5vw,3\.4rem\)/, 'Hero title must keep the restrained display scale');
assert.match(styles, /\.page-head h1 \{[^}]*font-size:clamp\(1\.9rem,4vw,2\.8rem\)/, 'Page titles must remain below the hero display scale');
assert.match(styles, /\.section h2 \{[^}]*font-size:clamp\(1\.45rem,3vw,1\.9rem\)/, 'Section titles must remain below page titles');
assert.match(styles, /\.product-card h3 \{[^}]*font-size:1\.2rem/, 'Card titles must stay compact for information-dense layouts');
assert.match(styles, /\.history-item h2 \{[^}]*font-size:1\.1rem/, 'Compact history titles must remain subordinate to card titles');

assert.match(styles, /\.brand \{[^}]*color: var\(--color-text-primary\)/, 'Header brand color must follow the semantic text token');
assert.match(styles, /\.main-nav a \{[^}]*color: var\(--color-text-secondary\)[^}]*font-weight: 600/, 'Primary navigation must use the shared secondary text role with stable emphasis');
assert.match(styles, /\.mobile-nav-toggle \{[^}]*color: var\(--color-text-primary\)/, 'Mobile navigation control must follow the semantic text token');
assert.match(styles, /\.site-footer \{[^}]*background:var\(--color-surface-subtle\)[^}]*color:var\(--color-text-secondary\)/, 'Footer presentation must follow semantic surface and text roles');
assert.match(styles, /\.footer-grid \{[^}]*grid-template-columns:minmax\(0,\.85fr\) minmax\(0,1\.15fr\)/, 'Desktop footer must reserve more space for navigation links');
assert.match(styles, /\.copyright \{[^}]*color:var\(--color-text-secondary\)/, 'Footer copyright must follow the shared secondary text role');

console.log('Responsive shell tests passed.');