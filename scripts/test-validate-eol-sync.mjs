import assert from 'node:assert/strict';
import { validateEolSnapshot } from './validate-eol-sync.mjs';

const SOURCE = 'https://endoflife.date/api/v1/products/full';
const NOW = new Date('2026-11-21T00:00:00Z');

function snapshot({ products = 50, generatedAt = '2026-11-20T00:00:00Z', schemaVersion = '1.2.1' } = {}) {
  return {
    schemaVersion,
    generatedAt,
    sourceUrl: SOURCE,
    products: Array.from({ length: products }, (_, i) => ({
      slug: 'product-' + i,
      releases: Array.from({ length: 3 }, (_, j) => ({
        name: String(j),
        eolFrom: '2027-01-01',
        eoasFrom: '2026-12-01'
      }))
    }))
  };
}

const baseline = snapshot({ generatedAt: '2026-11-15T00:00:00Z' });
const updated = snapshot();
assert.equal(validateEolSnapshot(baseline, updated, NOW).ok, true, '通常の更新は通す');

const a = snapshot({ products: 20 });
assert.equal(validateEolSnapshot(baseline, a, NOW).ok, false, '大量削除は止める');

const b = snapshot();
b.products[1].slug = b.products[0].slug;
assert.equal(validateEolSnapshot(baseline, b, NOW).ok, false, '重複製品は止める');

const c = snapshot();
c.products[0].releases[1].name = c.products[0].releases[0].name;
assert.equal(validateEolSnapshot(baseline, c, NOW).ok, false, '重複リリースは止める');

assert.equal(validateEolSnapshot(baseline, snapshot({ generatedAt: '2026-11-14T00:00:00Z' }), NOW).ok, false, '古い生成日時は止める');
assert.equal(validateEolSnapshot(baseline, snapshot({ generatedAt: '2026-11-23T00:00:00Z' }), NOW).ok, false, '未来の生成日時は止める');
assert.equal(validateEolSnapshot(baseline, snapshot({ schemaVersion: '2.0.0' }), NOW).ok, false, '未確認スキーマ変更は止める');

const d = snapshot();
for (const product of d.products) {
  for (const release of product.releases) release.eolFrom = '2029-01-01';
}
assert.equal(validateEolSnapshot(baseline, d, NOW).ok, false, 'EOL日の一括書換えは止める');

const e = snapshot();
e.products[0].releases[0].eolFrom = '2027-05-01';
assert.equal(validateEolSnapshot(baseline, e, NOW).ok, true, '少数の正規更新は通す');

console.log('EOL同期データ安全性テスト: PASS');
