import { readFile } from 'node:fs/promises';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [productIndex, recentHistory, productDetail] = await Promise.all([
  readFile(new URL('../src/pages/eol/index.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/RecentViewedProducts.astro', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/eol/[slug].astro', import.meta.url), 'utf8')
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
  recentHistory.includes('sidebarLayout?.classList.toggle(\'has-recent-history\', hasItems)'),
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

console.log('UX layout improvement tests passed.');
