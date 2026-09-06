import assert from 'node:assert/strict';
import {
  evaluateManualReviewDate,
  evaluateManualReviewRecords,
  MANUAL_REVIEW_FAILURE_DAYS,
  MANUAL_REVIEW_WARNING_DAYS
} from '../src/lib/manual-review-freshness.ts';

const now = new Date('2026-09-06T12:00:00Z');
const record = (checkedAt) => ({ id: 'test', group: 'test', label: 'test', checkedAt });
const dateDaysAgo = (days) => {
  const date = new Date(Date.UTC(2026, 8, 6 - days));
  return date.toISOString().slice(0, 10);
};

assert.equal(evaluateManualReviewDate(record(dateDaysAgo(MANUAL_REVIEW_WARNING_DAYS - 1)), now).status, 'fresh');
assert.equal(evaluateManualReviewDate(record(dateDaysAgo(MANUAL_REVIEW_WARNING_DAYS)), now).status, 'warning');
assert.equal(evaluateManualReviewDate(record(dateDaysAgo(MANUAL_REVIEW_FAILURE_DAYS - 1)), now).status, 'warning');
assert.equal(evaluateManualReviewDate(record(dateDaysAgo(MANUAL_REVIEW_FAILURE_DAYS)), now).status, 'overdue');
assert.equal(evaluateManualReviewDate(record('2026-09-07'), now).status, 'fresh');
assert.equal(evaluateManualReviewDate(record('2026-09-08'), now).status, 'invalid');
assert.equal(evaluateManualReviewDate(record('2026-02-30'), now).status, 'invalid');
assert.equal(evaluateManualReviewDate(record('not-a-date'), now).status, 'invalid');
assert.equal(evaluateManualReviewDate(record(undefined), now).status, 'invalid');

const grouped = evaluateManualReviewRecords([
  { id: 'fresh', group: 'test', label: 'fresh', checkedAt: dateDaysAgo(10) },
  { id: 'warning', group: 'test', label: 'warning', checkedAt: dateDaysAgo(200) },
  { id: 'failure', group: 'test', label: 'failure', checkedAt: dateDaysAgo(400) }
], now);
assert.equal(grouped.fresh.length, 1);
assert.equal(grouped.warnings.length, 1);
assert.equal(grouped.failures.length, 1);

console.log('Manual review freshness tests passed.');
