import { resolvedOfficialSourceReviews } from '../src/data/official-date-evidence.ts';
import { japanCommercialSupportByProduct } from '../src/data/japan-commercial-support.ts';
import { productReleaseHighlights } from '../src/data/release-highlights.ts';
import {
  evaluateManualReviewRecords,
  MANUAL_REVIEW_FAILURE_DAYS,
  MANUAL_REVIEW_WARNING_DAYS
} from '../src/lib/manual-review-freshness.ts';

function collectRecords() {
  const records = [];

  for (const [slug, review] of Object.entries(resolvedOfficialSourceReviews)) {
    records.push({
      id: `official-source:${slug}`,
      group: 'official-source',
      label: `${slug} official source`,
      checkedAt: review.sourceCheckedAt
    });

    if (review.comparisonStatus !== 'pending') {
      records.push({
        id: `official-comparison:${slug}`,
        group: 'official-comparison',
        label: `${slug} official date comparison`,
        checkedAt: review.comparisonCheckedAt
      });
    }
  }

  for (const [slug, support] of Object.entries(japanCommercialSupportByProduct)) {
    records.push({
      id: `commercial-support:${slug}`,
      group: 'commercial-support',
      label: `${slug} Japan commercial support`,
      checkedAt: support.checkedAt
    });
  }

  for (const [slug, highlights] of Object.entries(productReleaseHighlights)) {
    for (const highlight of highlights) {
      records.push({
        id: `release-highlight:${slug}:${highlight.version}`,
        group: 'release-highlight',
        label: `${slug} ${highlight.version} release highlight`,
        checkedAt: highlight.checkedAt
      });
    }
  }

  return records;
}

function annotation(kind, result) {
  const checkedAt = result.record.checkedAt ?? 'missing';
  const age = result.ageDays === null ? 'unknown' : `${result.ageDays}d`;
  return `::${kind} title=Manual review freshness::${result.record.id} checkedAt=${checkedAt} age=${age} ${result.reason ?? ''}`;
}

const records = collectRecords();
const evaluated = evaluateManualReviewRecords(records);

console.log(`Manual review freshness policy: warning >= ${MANUAL_REVIEW_WARNING_DAYS} days, fail >= ${MANUAL_REVIEW_FAILURE_DAYS} days.`);
console.log(`Checked ${records.length} records: fresh=${evaluated.fresh.length}, warning=${evaluated.warnings.length}, failure=${evaluated.failures.length}.`);

for (const result of evaluated.warnings) console.log(annotation('warning', result));
for (const result of evaluated.failures) console.log(annotation('error', result));

if (evaluated.failures.length > 0) {
  console.error('Manual review freshness check failed. Re-check the referenced primary sources and update the corresponding checkedAt fields.');
  process.exit(1);
}
