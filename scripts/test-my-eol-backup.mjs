import assert from 'node:assert/strict';
import {
  MAX_MY_EOL_BACKUP_FILE_BYTES,
  MY_EOL_BACKUP_FORMAT,
  createMyEolBackup,
  parseMyEolBackup,
  serializeMyEolBackup
} from '../src/lib/my-eol-backup.ts';

const trackedProducts = {
  schemaVersion: 1,
  products: {
    nodejs: {
      version: '22',
      savedAt: '2026-09-06T00:00:00.000Z'
    },
    python: {
      version: '3.13',
      savedAt: '2026-09-06T00:01:00.000Z'
    }
  }
};

const reminders = {
  schemaVersion: 1,
  thresholds: [30, 90, 180],
  acknowledged: {
    'nodejs|22|2027-04-30|180': '2026-09-06T00:02:00.000Z'
  }
};

const backup = createMyEolBackup(
  trackedProducts,
  reminders,
  '2026-09-06T00:03:00.000Z'
);
assert.equal(backup.format, MY_EOL_BACKUP_FORMAT);
assert.notEqual(backup.trackedProducts.products, trackedProducts.products);
assert.notEqual(backup.reminders.acknowledged, reminders.acknowledged);

const roundTrip = parseMyEolBackup(serializeMyEolBackup(backup));
assert.equal(roundTrip.ok, true);
if (roundTrip.ok) {
  assert.deepEqual(roundTrip.value, backup);
  assert.deepEqual(roundTrip.value.reminders.thresholds, [30, 90, 180]);
  assert.equal(Object.keys(roundTrip.value.trackedProducts.products).length, 2);
}

const withUnknownSensitiveFields = JSON.stringify({
  ...backup,
  notificationToken: 'must-not-survive',
  trackedProducts: {
    ...backup.trackedProducts,
    externalNotification: { token: 'must-not-survive' }
  },
  reminders: {
    ...backup.reminders,
    email: 'user@example.com'
  }
});
const sanitized = parseMyEolBackup(withUnknownSensitiveFields);
assert.equal(sanitized.ok, true);
if (sanitized.ok) {
  const serialized = serializeMyEolBackup(sanitized.value);
  assert.equal(serialized.includes('must-not-survive'), false);
  assert.equal(serialized.includes('user@example.com'), false);
  assert.equal(Object.hasOwn(sanitized.value, 'notificationToken'), false);
}

for (const raw of [
  '{',
  '[]',
  JSON.stringify({ ...backup, format: 'other-format' }),
  JSON.stringify({ ...backup, schemaVersion: 2 }),
  JSON.stringify({ ...backup, exportedAt: 'not-a-date' }),
  JSON.stringify({
    ...backup,
    trackedProducts: {
      schemaVersion: 1,
      products: { nodejs: { version: '', savedAt: '2026-09-06T00:00:00.000Z' } }
    }
  }),
  JSON.stringify({
    ...backup,
    trackedProducts: {
      schemaVersion: 1,
      products: { nodejs: { version: '22', savedAt: 'not-a-date' } }
    }
  }),
  JSON.stringify({
    ...backup,
    reminders: { schemaVersion: 1, thresholds: [30, 45], acknowledged: {} }
  }),
  JSON.stringify({
    ...backup,
    reminders: { schemaVersion: 1, thresholds: [30, 30], acknowledged: {} }
  }),
  JSON.stringify({
    ...backup,
    reminders: { schemaVersion: 1, thresholds: [30], acknowledged: { key: 'not-a-date' } }
  })
]) {
  assert.equal(parseMyEolBackup(raw).ok, false, `Expected invalid backup: ${raw.slice(0, 80)}`);
}

const oversized = 'x'.repeat(MAX_MY_EOL_BACKUP_FILE_BYTES + 1);
const oversizedResult = parseMyEolBackup(oversized);
assert.equal(oversizedResult.ok, false);
if (!oversizedResult.ok) assert.match(oversizedResult.error, /大きすぎ/);

const emptyBackup = createMyEolBackup(
  { schemaVersion: 1, products: {} },
  { schemaVersion: 1, thresholds: [], acknowledged: {} },
  '2026-09-06T00:03:00.000Z'
);
const emptyRoundTrip = parseMyEolBackup(serializeMyEolBackup(emptyBackup));
assert.equal(emptyRoundTrip.ok, true);

console.log('My EOL backup tests passed.');
