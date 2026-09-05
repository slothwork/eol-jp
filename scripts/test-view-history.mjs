import assert from 'node:assert/strict';
import {
  MAX_VIEW_HISTORY_ITEMS,
  clearViewHistory,
  emptyViewHistoryState,
  parseViewHistory,
  recordViewedProduct,
  removeViewedProduct,
  serializeViewHistory
} from '../src/lib/view-history.ts';

assert.deepEqual(parseViewHistory(null), emptyViewHistoryState());
assert.deepEqual(parseViewHistory('{broken'), emptyViewHistoryState());
assert.deepEqual(parseViewHistory(JSON.stringify({ schemaVersion: 2, items: [] })), emptyViewHistoryState());

let state = recordViewedProduct(emptyViewHistoryState(), 'python', 'Python', '2026-09-05T10:00:00.000Z');
assert.equal(state.items.length, 1);
assert.deepEqual(state.items[0], {
  slug: 'python',
  label: 'Python',
  viewedAt: '2026-09-05T10:00:00.000Z'
});

state = recordViewedProduct(state, 'nodejs', 'Node.js', '2026-09-05T11:00:00.000Z');
state = recordViewedProduct(state, 'python', 'Python', '2026-09-05T12:00:00.000Z');
assert.equal(state.items.length, 2, 'Revisiting a product must not create a duplicate');
assert.equal(state.items[0].slug, 'python', 'Revisited product must move to the front');
assert.equal(state.items[0].viewedAt, '2026-09-05T12:00:00.000Z');

for (let index = 0; index < MAX_VIEW_HISTORY_ITEMS + 5; index += 1) {
  state = recordViewedProduct(state, `product-${index}`, `Product ${index}`, `2026-09-05T13:${String(index).padStart(2, '0')}:00.000Z`);
}
assert.equal(state.items.length, MAX_VIEW_HISTORY_ITEMS, 'History must be capped at 20 products');
assert.equal(state.items[0].slug, `product-${MAX_VIEW_HISTORY_ITEMS + 4}`);

const serialized = serializeViewHistory(state);
assert.deepEqual(parseViewHistory(serialized), state);

const withDuplicates = JSON.stringify({
  schemaVersion: 1,
  items: [
    { slug: 'python', label: 'Python', viewedAt: 'new' },
    { slug: 'python', label: 'Python old', viewedAt: 'old' },
    { slug: '', label: 'Invalid', viewedAt: 'invalid' },
    { slug: 'nodejs', label: 'Node.js', viewedAt: 'node' }
  ]
});
const parsed = parseViewHistory(withDuplicates);
assert.deepEqual(parsed.items.map((item) => item.slug), ['python', 'nodejs']);
assert.equal(parsed.items[0].label, 'Python');

const removed = removeViewedProduct(parsed, 'python');
assert.deepEqual(removed.items.map((item) => item.slug), ['nodejs']);
assert.deepEqual(clearViewHistory(), emptyViewHistoryState());

console.log('View history tests passed.');
