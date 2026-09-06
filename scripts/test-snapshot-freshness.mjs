import assert from 'node:assert/strict';
import {
  SNAPSHOT_FRESHNESS_CRITICAL_HOURS,
  SNAPSHOT_FRESHNESS_WARNING_HOURS,
  getSnapshotFreshness,
  snapshotAgeHours,
  snapshotFreshnessMessage
} from '../src/lib/snapshot-freshness.ts';

const now = new Date('2026-09-06T00:00:00.000Z');

assert.equal(snapshotAgeHours('2026-09-05T00:00:00.000Z', now), 24);
assert.equal(snapshotAgeHours('not-a-date', now), null);
assert.equal(snapshotAgeHours('2026-09-06T03:00:00.000Z', now), 0);
assert.equal(snapshotAgeHours('2026-09-07T00:00:00.000Z', now), null);

assert.equal(
  getSnapshotFreshness('2026-09-03T00:00:01.000Z', now).status,
  'fresh'
);
assert.equal(
  getSnapshotFreshness('2026-09-03T00:00:00.000Z', now).status,
  'warning'
);
assert.equal(
  getSnapshotFreshness('2026-08-30T00:00:00.000Z', now).status,
  'critical'
);
assert.equal(getSnapshotFreshness('', now).status, 'invalid');

const custom = getSnapshotFreshness('2026-09-05T00:00:00.000Z', now, 12, 48);
assert.equal(custom.status, 'warning');
assert.equal(custom.warningHours, 12);
assert.equal(custom.criticalHours, 48);

assert.throws(
  () => getSnapshotFreshness('2026-09-05T00:00:00.000Z', now, 48, 48),
  /criticalHours/
);

assert.match(
  snapshotFreshnessMessage(getSnapshotFreshness('2026-08-30T00:00:00.000Z', now)),
  /約7日/
);
assert.match(snapshotFreshnessMessage(getSnapshotFreshness('', now)), /更新時刻を確認できません/);

assert.equal(SNAPSHOT_FRESHNESS_WARNING_HOURS, 72);
assert.equal(SNAPSHOT_FRESHNESS_CRITICAL_HOURS, 168);

console.log('Snapshot freshness tests passed.');
