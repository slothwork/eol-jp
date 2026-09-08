import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const PAGE_SIZE = 20;

const [html, dataText, pageSource] = await Promise.all([
  readFile('dist/releases/index.html', 'utf8'),
  readFile('dist/releases/data.json', 'utf8'),
  readFile('src/pages/releases/index.astro', 'utf8')
]);

const renderedItems = html.match(/\bdata-release-item(?:=|\s|>)/g)?.length ?? 0;
assert.ok(renderedItems <= PAGE_SIZE, `initial HTML must render at most ${PAGE_SIZE} release items, got ${renderedItems}`);
assert.ok(renderedItems > 0, 'initial HTML should render at least one release item');
assert.match(html, /data-release-pagination/, 'initial HTML should include pagination controls');
assert.match(html, /data-initial-total=/, 'initial HTML should expose the initial total count');
assert.match(html, /data-release-view="table"/, 'release page should default to table view');
assert.match(html, /data-release-view-button="table"/, 'release page should include a table view button');
assert.match(html, /data-release-view-button="card"/, 'release page should include a card view button');
assert.match(html, /<table class="release-table">/, 'release page should render a semantic release table');
assert.match(html, /<th scope="col">リリース日<\/th>/, 'release table should expose column headings');
assert.doesNotMatch(html, /data-release-view-button="list"/, 'legacy list view button should be removed');

const data = JSON.parse(dataText);
assert.equal(data.schemaVersion, 2, 'release data schemaVersion should be 2');
assert.equal(data.maxAgeDays, 365, 'release data should cover at most one year');
assert.ok(Array.isArray(data.entries), 'release data entries should be an array');
assert.ok(data.entries.every((entry) => Number.isFinite(entry.ageDays) && entry.ageDays >= 0 && entry.ageDays <= 365), 'release data must only contain entries within one year');

assert.match(pageSource, /const PAGE_SIZE = 20;/, 'release page should keep the page size at 20');
assert.match(pageSource, /entries\.slice\(start, start \+ PAGE_SIZE\)/, 'client pagination should slice only the current page');
assert.match(pageSource, /tableBody\.replaceChildren\(fragment\)/, 'table view should replace only the visible table rows');
assert.match(pageSource, /cardList\.replaceChildren\(fragment\)/, 'card view should replace only the visible cards');
assert.match(pageSource, /type ReleaseView = 'table' \| 'card';/, 'release page should only expose table and card views');
assert.match(pageSource, /const VIEW_STORAGE_KEY = 'eol-release-view';/, 'release view preference should use localStorage only');
assert.match(pageSource, /localStorage\.setItem\(VIEW_STORAGE_KEY, view\)/, 'release view preference should be persisted locally');
assert.doesNotMatch(pageSource, /next\.set\(['"]view['"]/, 'release view should not be added to the URL');
assert.doesNotMatch(
  pageSource,
  /for \(const entry of data\.entries\)\s+fragment\.append/,
  'release data must not be converted into DOM nodes in one bulk append'
);

console.log(`Release pagination tests passed. Initial DOM items: ${renderedItems}; JSON entries: ${data.entries.length}.`);
