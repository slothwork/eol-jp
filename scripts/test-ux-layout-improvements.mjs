import { readFile } from 'node:fs/promises';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [
  productIndex,
  recentHistory,
  productDetail,
  trackedVersionPanel,
  denseTable,
  productTable,
  deadlineTable,
  categoryPage,
  upcomingPage,
  upcomingWindow,
  changesPage,
  myEolPage,
  denseTableCss
] = await Promise.all([
  readFile(new URL('../src/pages/eol/index.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/RecentViewedProducts.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/eol/[slug].astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/TrackedVersionPanel.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/DenseTable.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ProductTable.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/DeadlineTable.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/category/[category].astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/upcoming.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/upcoming/[window].astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/changes.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/my-eol.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/dense-tables.css', import.meta.url), 'utf8')
]);

assert(
  productIndex.includes('data-view-history-slot'),
  'Product index must provide a dedicated recently-viewed sidebar slot.'
);
assert(
  productIndex.includes('product-browser-layout.has-recent-history'),
  'Product index must only reserve sidebar width when history exists.'
);
assert(
  productIndex.includes('@media (min-width: 981px)'),
  'Recently-viewed sidebar must be limited to sufficiently wide desktop layouts.'
);
assert(
  recentHistory.includes('sidebarSlot.append(section)'),
  'Recently viewed component must mount into the product-index sidebar slot when available.'
);
assert(
  recentHistory.includes("sidebarLayout?.classList.toggle('has-recent-history', hasItems)"),
  'Recently viewed component must release sidebar width when history is empty.'
);
assert(
  recentHistory.includes('const SIDEBAR_VISIBLE_ITEMS = 4;'),
  'Desktop sidebar should remain compact by default.'
);

assert(
  productDetail.includes('const INITIAL_RELEASE_LIMIT = 10;'),
  'Version support table must initially show the latest 10 releases.'
);
assert(
  productDetail.includes('すべて表示（残り {hiddenReleaseCount} 件）'),
  'Version support table must provide an explicit expansion control.'
);
assert(
  productDetail.includes('id="version-support-table"'),
  'Product detail must keep a stable version support table target for responsive behavior.'
);
assert(
  trackedVersionPanel.includes('<style is:global>'),
  'Product detail support-table responsive styles must apply outside the tracked-version component scope.'
);
assert(
  trackedVersionPanel.includes('#version-support-table tbody tr:not([hidden])'),
  'Visible version support rows must collapse into mobile grid rows without changing the expansion behavior.'
);
assert(
  trackedVersionPanel.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 38%)'),
  'Version support rows must use the bounded two-column mobile layout.'
);
assert(
  trackedVersionPanel.includes("content: 'EOL / セキュリティ終了'"),
  'Version support mobile rows must retain an explicit EOL label after hiding the table header.'
);
assert(
  trackedVersionPanel.includes('.table-wrap:has(> #version-support-table)::before'),
  'Version support mobile layout must suppress the obsolete horizontal-scroll hint.'
);
assert(
  productDetail.includes('class="subsection release-highlights-wide" id="release-highlights"'),
  'Release highlights must use the full-width layout class.'
);
assert(
  productDetail.includes('.release-highlights-wide { grid-column:1 / -1; width:100%;'),
  'Release highlights must span both desktop product-detail columns.'
);

const asidePosition = productDetail.indexOf('class="panel product-detail-aside"');
const highlightsPosition = productDetail.indexOf('class="subsection release-highlights-wide"');
assert(asidePosition >= 0 && highlightsPosition > asidePosition, 'Release highlights must be a direct full-width sibling after the primary detail columns.');

assert(denseTable.includes("variant: 'product' | 'deadline' | 'change' | 'my-eol'"), 'DenseTable must define the supported shared table variants.');
assert(denseTable.includes('<table class:list={[\'dense-table\''), 'DenseTable must render a semantic table.');
assert(denseTable.includes('<th scope="col"'), 'DenseTable headers must expose column scope.');
assert(productTable.includes('variant="product"'), 'ProductTable must use the shared product table variant.');
assert(!productTable.includes('getProductSummary'), 'ProductTable must omit repetitive product summary copy to keep rows compact.');
assert(deadlineTable.includes('variant="deadline"'), 'DeadlineTable must use the shared deadline table variant.');
assert(deadlineTable.includes('relativeEol(release.eolFrom)'), 'DeadlineTable must retain relative EOL information.');

assert(productIndex.includes('<ProductTable'), 'Product index must default to ProductTable instead of product cards.');
assert(productIndex.includes('createProductRow'), 'Product search/group filtering must render table rows dynamically.');
assert(!productIndex.includes('createProductCard'), 'Product index dynamic filtering must not recreate the legacy card layout.');
assert(!productIndex.includes('item.summary'), 'Dynamic product rows must omit repetitive product summary copy.');
assert(categoryPage.includes('<ProductTable'), 'Category pages must use the same ProductTable as the product index.');
assert(upcomingPage.includes('<DeadlineTable'), 'One-year upcoming page must use the shared deadline table.');
assert(upcomingPage.includes('supported-eol-body'), 'Lazy supported EOL rows must render into the shared table structure.');
assert(upcomingWindow.includes('<DeadlineTable'), '30/90/180-day upcoming pages must use the shared deadline table.');
assert(changesPage.includes('variant="change"'), 'Change history must use the shared dense table foundation.');
assert(myEolPage.includes('variant="my-eol"'), 'My EOL tracked versions must use the shared dense table foundation.');
assert(myEolPage.includes('row.dataset.myEolRow'), 'My EOL client rendering must create table rows.');
assert(myEolPage.includes('history-list reminder-list'), 'Action-oriented reminder cards must remain separate from the dense tracked-version table.');

assert(denseTableCss.includes('@media (max-width: 700px)'), 'Dense tables must define a mobile transformation breakpoint.');
assert(denseTableCss.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 38%)'), 'Dense tables must collapse into bounded mobile grid rows.');
assert(denseTableCss.includes('.dense-table thead'), 'Dense table headings must be visually hidden rather than forcing horizontal scrolling on mobile.');
assert(denseTableCss.includes('white-space: normal'), 'Dense table mobile cells must allow wrapping to prevent horizontal overflow.');

console.log('UX layout improvement tests passed.');
