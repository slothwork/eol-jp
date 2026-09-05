import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { featuredSlugs } from '../src/data/product-meta.ts';
import { resolvedOfficialSourceReviews } from '../src/data/official-date-evidence.ts';
import {
  officialSourceCoverageLabels,
  officialComparisonStatusLabels
} from '../src/data/official-source-reviews.ts';

const snapshot = JSON.parse(await fs.readFile(new URL('../src/data/eol-snapshot.json', import.meta.url), 'utf8'));
const productMap = new Map((snapshot.products ?? []).map((product) => [product.slug, product]));
const slugs = Object.keys(resolvedOfficialSourceReviews).sort();
assert.deepEqual(slugs, [...featuredSlugs].sort(), '主要20製品と公式ソース台帳を1:1に保つ');

const validDate = /^\d{4}-\d{2}-\d{2}$/;
const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
let evidenceCount = 0;
let pendingCount = 0;

for (const slug of featuredSlugs) {
  const review = resolvedOfficialSourceReviews[slug];
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
    pendingCount += 1;
    assert.equal(review.comparisonCheckedAt, undefined, `${slug}: pending review must not have comparisonCheckedAt`);
  }

  for (const evidence of review.evidence ?? []) {
    evidenceCount += 1;
    assert.match(evidence.officialEol, validDate, `${slug}/${evidence.release}: officialEol must be YYYY-MM-DD`);
    assert.ok(evidence.precision === 'day' || evidence.precision === 'month', `${slug}/${evidence.release}: unsupported precision`);

    const evidenceUrl = new URL(evidence.sourceUrl);
    assert.equal(evidenceUrl.protocol, 'https:', `${slug}/${evidence.release}: evidence source must use HTTPS`);
    assert.notEqual(evidenceUrl.hostname, 'endoflife.date', `${slug}/${evidence.release}: evidence source must be independent from endoflife.date`);
    assert.notEqual(evidenceUrl.hostname, 'www.endoflife.date', `${slug}/${evidence.release}: evidence source must be independent from endoflife.date`);

    const product = productMap.get(slug);
    assert.ok(product, `${slug}: snapshot product required for evidence verification`);
    const release = product.releases?.find((item) => item.name === evidence.release);
    assert.ok(release, `${slug}/${evidence.release}: release must exist in committed snapshot`);
    assert.ok(release.eolFrom, `${slug}/${evidence.release}: committed snapshot must have eolFrom`);

    if (evidence.precision === 'day') {
      assert.equal(
        release.eolFrom,
        evidence.officialEol,
        `${slug}/${evidence.release}: committed snapshot EOL must match official evidence`
      );
    } else {
      assert.equal(
        release.eolFrom.slice(0, 7),
        evidence.officialEol.slice(0, 7),
        `${slug}/${evidence.release}: committed snapshot EOL month must match official evidence`
      );
    }
  }
}

assert.equal(pendingCount, 0, '主要20製品の公式ソースレビューをpendingなしで維持する');
assert.ok(evidenceCount >= 30, '主要製品の構造化された公式日付証跡を30件以上保持する');
console.log(`Official source review tests passed for ${featuredSlugs.length} products with ${evidenceCount} date evidence rows and no pending reviews.`);
