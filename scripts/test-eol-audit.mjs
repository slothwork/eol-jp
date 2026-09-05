import assert from 'node:assert/strict';
import {
  appendAuditEntry,
  createAuditEntry,
  emptyAuditLog,
  hashProducts,
  normalizeAuditLog
} from './eol-audit.mjs';

const productsA = [
  {
    slug: 'beta',
    label: 'Beta',
    releases: [
      { name: '2', eolFrom: '2027-01-01' },
      { name: '1', eolFrom: '2026-01-01' }
    ]
  },
  {
    slug: 'alpha',
    label: 'Alpha',
    releases: [{ name: '1', eolFrom: '2026-06-01' }]
  }
];

const productsSameDifferentOrder = [
  {
    label: 'Alpha',
    releases: [{ eolFrom: '2026-06-01', name: '1' }],
    slug: 'alpha'
  },
  {
    releases: [
      { eolFrom: '2026-01-01', name: '1' },
      { eolFrom: '2027-01-01', name: '2' }
    ],
    label: 'Beta',
    slug: 'beta'
  }
];

assert.equal(
  hashProducts(productsA),
  hashProducts(productsSameDifferentOrder),
  'Hash should ignore product/release ordering and object key ordering'
);

const productsChanged = structuredClone(productsA);
productsChanged[1].releases[0].eolFrom = '2026-07-01';

const entry = createAuditEntry({
  previous: { products: productsA },
  next: { products: productsChanged },
  changes: [
    {
      type: 'eol-changed',
      product: 'alpha',
      label: 'Alpha',
      release: '1',
      from: '2026-06-01',
      to: '2026-07-01'
    }
  ],
  syncedAt: '2026-09-05T13:30:00.000Z',
  sourceGeneratedAt: '2026-09-05T13:29:00.000Z',
  sourceUrl: 'https://endoflife.date/api/v1/products/full'
});

assert.ok(entry, 'Changed products should create an audit entry');
assert.notEqual(entry.beforeSha256, entry.afterSha256);
assert.equal(entry.changes.total, 1);
assert.equal(entry.changes.eolChanged, 1);
assert.deepEqual(entry.affectedProducts, [{ slug: 'alpha', label: 'Alpha' }]);
assert.equal(entry.productCount, 2);
assert.equal(entry.releaseCount, 3);

assert.equal(
  createAuditEntry({
    previous: { products: productsA },
    next: { products: productsSameDifferentOrder },
    changes: [],
    syncedAt: '2026-09-05T13:30:00.000Z',
    sourceGeneratedAt: '2026-09-05T13:29:00.000Z',
    sourceUrl: 'https://endoflife.date/api/v1/products/full'
  }),
  null,
  'Equivalent product data should not create an audit entry'
);

const appended = appendAuditEntry(emptyAuditLog(), entry);
assert.equal(appended.entries.length, 1);
assert.equal(appended.updatedAt, entry.syncedAt);
assert.equal(appendAuditEntry(appended, entry).entries.length, 1, 'Duplicate IDs should not be appended');
assert.deepEqual(normalizeAuditLog(null), emptyAuditLog());

console.log('EOL audit log tests passed.');
