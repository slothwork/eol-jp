import assert from 'node:assert/strict';
import {
  buildBadgeSvg,
  buildProductIndex,
  buildProductPayload,
  daysUntilEol,
  statusForDays
} from '../worker/public-api.ts';

const catalog = {
  schemaVersion: 1,
  generatedAt: '2026-09-04T00:00:00.000Z',
  sourceUrl: 'https://endoflife.date/api/v1/products',
  products: [
    {
      slug: 'nodejs',
      label: 'Node.js',
      category: 'runtime',
      links: { html: 'https://endoflife.date/nodejs' },
      releases: [
        { name: '22', releaseDate: '2024-04-24', eolFrom: '2026-09-05', isLts: true },
        { name: '18', releaseDate: '2022-04-19', eolFrom: '2025-04-30', isLts: true },
        { name: 'next', releaseDate: null, eolFrom: null, isLts: false }
      ]
    },
    {
      slug: 'a-and-b',
      label: 'A&B',
      category: 'test',
      releases: [{ name: '1', releaseDate: '2026-01-01', eolFrom: '2027-01-01', isLts: false }]
    }
  ]
};

assert.equal(daysUntilEol('2026-09-05', new Date('2026-09-04T14:59:59Z')), 1, '23:59 JST should still be Sep 4');
assert.equal(daysUntilEol('2026-09-05', new Date('2026-09-04T15:00:00Z')), 0, '00:00 JST should become Sep 5');
assert.equal(daysUntilEol(null, new Date()), null);

assert.equal(statusForDays(-1), 'ended');
assert.equal(statusForDays(0), 'critical');
assert.equal(statusForDays(30), 'critical');
assert.equal(statusForDays(31), 'warning');
assert.equal(statusForDays(90), 'warning');
assert.equal(statusForDays(91), 'planning');
assert.equal(statusForDays(180), 'planning');
assert.equal(statusForDays(181), 'supported');
assert.equal(statusForDays(null), 'unknown');

const index = buildProductIndex(catalog);
assert.equal(index.products.length, 2);
assert.equal(index.products[0].apiUrl, '/api/v1/products/nodejs');

const allNode = buildProductPayload(catalog, 'nodejs', null, new Date('2026-09-04T12:00:00Z'));
assert.ok(allNode);
assert.equal(allNode.product.releases.length, 3);
assert.equal(allNode.product.releases[0].daysUntilEol, 1);
assert.equal(allNode.product.releases[1].status, 'ended');
assert.equal(allNode.product.releases[2].status, 'unknown');

const node22 = buildProductPayload(catalog, 'nodejs', '22', new Date('2026-09-04T15:00:00Z'));
assert.ok(node22);
assert.equal(node22.product.releases.length, 1);
assert.equal(node22.product.releases[0].daysUntilEol, 0);
assert.equal(buildProductPayload(catalog, 'nodejs', '999', new Date()), null);
assert.equal(buildProductPayload(catalog, 'missing', null, new Date()), null);

const badge = buildBadgeSvg(catalog, 'nodejs', '22', new Date('2026-09-04T12:00:00Z'));
assert.equal(badge.found, true);
assert.match(badge.svg, /Node\.js 22/);
assert.match(badge.svg, /EOL 1d/);

const missingVersion = buildBadgeSvg(catalog, 'nodejs', null, new Date());
assert.equal(missingVersion.found, false);
assert.match(missingVersion.svg, /version指定必須/);

const escaped = buildBadgeSvg(catalog, 'a-and-b', '1', new Date('2026-09-04T12:00:00Z'));
assert.match(escaped.svg, /A&amp;B 1/);
assert.doesNotMatch(escaped.svg, />A&B 1</);

console.log('Public API tests passed.');
