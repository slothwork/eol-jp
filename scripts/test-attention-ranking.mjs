import assert from 'node:assert/strict';
import { analyzeAttentionRanking, hasMeaningfulRankingChange } from './attention-ranking-utils.mjs';

const base = {
  generatedAt: '2026-09-04T00:00:00.000Z',
  periodStart: '2026-08-05T00:00:00.000Z',
  periodEnd: '2026-09-04T00:00:00.000Z',
  windowDays: 30,
  scopeDays: 180,
  source: 'cloudflare-web-analytics',
  items: [
    { slug: 'chrome', pageViews: 10 },
    { slug: 'nodejs', pageViews: 8 }
  ]
};

assert.equal(
  hasMeaningfulRankingChange(base, {
    ...base,
    generatedAt: '2026-09-04T01:00:00.000Z',
    periodStart: '2026-08-05T01:00:00.000Z',
    periodEnd: '2026-09-04T01:00:00.000Z'
  }),
  false,
  'timestamps alone must not create a ranking change'
);

assert.equal(
  hasMeaningfulRankingChange(base, {
    ...base,
    items: [
      { slug: 'chrome', pageViews: 11 },
      { slug: 'nodejs', pageViews: 8 }
    ]
  }),
  true,
  'page view changes must create a ranking change'
);

assert.equal(
  hasMeaningfulRankingChange(base, {
    ...base,
    items: [
      { slug: 'nodejs', pageViews: 10 },
      { slug: 'chrome', pageViews: 8 }
    ]
  }),
  true,
  'ranking order changes must create a ranking change'
);

assert.equal(
  hasMeaningfulRankingChange(base, { ...base, windowDays: 14 }),
  true,
  'ranking configuration changes must create a ranking change'
);

assert.equal(hasMeaningfulRankingChange(null, base), true, 'missing current data must create output');

console.log('Attention ranking change detection passed.');

const eligible = new Set(['nodejs', 'python']);
const response = (pages) => ({ data: { viewer: { accounts: [{ pages }] } } });
const row = (requestPath, count) => ({ dimensions: { requestPath }, count });
const normal = analyzeAttentionRanking(response([
  row('/', 20), row('/eol/nodejs/', 8), row('/eol/nodejs', 2),
  row('/eol/python/', 3), row('/eol/chrome/', 50)
]), eligible);
assert.deepEqual(normal.items, [{ slug: 'nodejs', pageViews: 10 }, { slug: 'python', pageViews: 3 }]);
assert.deepEqual(normal.stats, {
  eligibleProducts: 2, groups: 5, totalObservedPageViews: 83,
  productPathGroups: 4, eligiblePathGroups: 3, eligiblePageViews: 13
});
assert.equal(normal.observed, true);

const zero = analyzeAttentionRanking(response([row('/', 20), row('/eol/chrome/', 3)]), eligible);
assert.equal(zero.observed, true);
assert.deepEqual(zero.items, []);
assert.equal(hasMeaningfulRankingChange(base, { ...base, items: [] }), true);
assert.equal(analyzeAttentionRanking(response([]), eligible).observed, false);
assert.equal(analyzeAttentionRanking(response([row('/', 0)]), eligible).observed, false);
for (const invalid of [null, {}, { data: { viewer: { accounts: [] } } },
  { data: { viewer: { accounts: [{}] } } }, { errors: [{ message: 'error' }] },
  response([row('/eol/nodejs/', -1)]), response([row(null, 1)]),
  response([row('/eol/nodejs/', null)]), response([row('/eol/nodejs/', 0.5)])]) {
  assert.throws(() => analyzeAttentionRanking(invalid, eligible));
}
assert.throws(() => analyzeAttentionRanking(response([row('/', 1)]), eligible, { limit: 1 }));
console.log('Attention ranking response validation and zero-result diagnostics passed.');
