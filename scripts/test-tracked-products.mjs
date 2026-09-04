import assert from 'node:assert/strict';
import {
  emptyTrackedProductsState,
  parseTrackedProducts,
  removeTrackedProduct,
  serializeTrackedProducts,
  setTrackedProduct
} from '../src/lib/tracked-products.ts';

const empty = emptyTrackedProductsState();
assert.deepEqual(empty, { schemaVersion: 1, products: {} });
assert.deepEqual(parseTrackedProducts(null), empty);
assert.deepEqual(parseTrackedProducts('not-json'), empty);
assert.deepEqual(parseTrackedProducts(JSON.stringify({ schemaVersion: 2, products: {} })), empty);

const sanitized = parseTrackedProducts(JSON.stringify({
  schemaVersion: 1,
  products: {
    nodejs: { version: ' 22 ', savedAt: '2026-09-04T00:00:00.000Z' },
    invalid: { version: '', savedAt: '2026-09-04T00:00:00.000Z' },
    broken: null
  }
}));
assert.deepEqual(sanitized, {
  schemaVersion: 1,
  products: {
    nodejs: { version: '22', savedAt: '2026-09-04T00:00:00.000Z' }
  }
});

const withNode = setTrackedProduct(empty, 'nodejs', '22', '2026-09-04T01:00:00.000Z');
const withPython = setTrackedProduct(withNode, 'python', '3.13', '2026-09-04T02:00:00.000Z');
assert.deepEqual(withPython.products.nodejs, { version: '22', savedAt: '2026-09-04T01:00:00.000Z' });
assert.deepEqual(withPython.products.python, { version: '3.13', savedAt: '2026-09-04T02:00:00.000Z' });

const updatedNode = setTrackedProduct(withPython, 'nodejs', '24', '2026-09-04T03:00:00.000Z');
assert.equal(updatedNode.products.nodejs.version, '24');
assert.equal(updatedNode.products.python.version, '3.13');

const removed = removeTrackedProduct(updatedNode, 'nodejs');
assert.equal(removed.products.nodejs, undefined);
assert.equal(removed.products.python.version, '3.13');

assert.deepEqual(parseTrackedProducts(serializeTrackedProducts(removed)), removed);

console.log('Tracked product storage tests passed.');
