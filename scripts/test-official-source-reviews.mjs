import assert from 'node:assert/strict';
import { featuredSlugs } from '../src/data/product-meta.ts';
import {
  officialSourceReviews,
  officialSourceCoverageLabels,
  officialComparisonStatusLabels
} from '../src/data/official-source-reviews.ts';

const slugs = Object.keys(officialSourceReviews).sort();
assert.deepEqual(slugs, [...featuredSlugs].sort(), '主要20製品と公式ソース台帳を1:1に保つ');

const validDate = /^\d{4}-\d{2}-\d{2}$/;
const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

for (const slug of featuredSlugs) {
  const review = officialSourceReviews[slug];
  assert.ok(review, `${slug}: review required`);
  assert.ok(review.sourceLabel.trim(), `${slug}: sourceLabel required`);

  const url = new URL(review.sourceUrl);
  assert.equal(url.protocol, 'https:', `${slug}: official source must use HTTPS`);
  assert.notEqual(url.hostname, 'endoflife.date', `${slug}: double-check source must be independent from endoflife.date`);
  assert.notEqual(url.hostname, 'www.endoflife.date', `${slug}: double-check source must be independent from endoflife.date`);

  assert.ok(review.coverage in officialSourceCoverageLabels, `${slug}: unsupported coverage`);
  assert.ok(review.comparisonStatus in officialComparisonStatusLabels, `${slug}: unsupported comparison status`);
  assert.match(review.sourceCheckedAt, validDate, `${slug}: sourceCheckedAt must be YYYY-MM-DD`);
  assert.ok(review.sourceCheckedAt <= today, `${slug}: sourceCheckedAt cannot be in the future`);

  if (review.comparisonStatus === 'matched' || review.comparisonStatus === 'partial' || review.comparisonStatus === 'not-comparable') {
    assert.ok(review.comparisonCheckedAt, `${slug}: completed comparison state requires comparisonCheckedAt`);
    assert.match(review.comparisonCheckedAt, validDate, `${slug}: comparisonCheckedAt must be YYYY-MM-DD`);
    assert.ok(review.comparisonCheckedAt <= today, `${slug}: comparisonCheckedAt cannot be in the future`);
    assert.ok(review.note?.trim(), `${slug}: completed comparison state requires a review note`);
  }

  if (review.comparisonStatus === 'pending') {
    assert.equal(review.comparisonCheckedAt, undefined, `${slug}: pending review must not have comparisonCheckedAt`);
  }
}

console.log(`Official source review tests passed for ${featuredSlugs.length} products.`);
