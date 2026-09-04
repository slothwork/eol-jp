import assert from 'node:assert/strict';
import { hasMeaningfulRankingChange } from './attention-ranking-utils.mjs';

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
