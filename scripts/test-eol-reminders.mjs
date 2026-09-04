import assert from 'node:assert/strict';
import {
  acknowledgeReminder,
  defaultEolReminderState,
  isReminderAcknowledged,
  parseEolReminderState,
  reminderAcknowledgementKey,
  reminderThresholdForDays,
  setReminderThresholdEnabled
} from '../src/lib/eol-reminders.ts';

const defaults = defaultEolReminderState();
assert.deepEqual(defaults.thresholds, [30, 90, 180]);
assert.deepEqual(parseEolReminderState(null), defaults);
assert.deepEqual(parseEolReminderState('{broken'), defaults);

const parsed = parseEolReminderState(JSON.stringify({
  schemaVersion: 1,
  thresholds: [180, 30, 999],
  acknowledged: {
    valid: '2026-09-04T00:00:00.000Z',
    invalid: 'not-a-date'
  }
}));
assert.deepEqual(parsed.thresholds, [30, 180]);
assert.deepEqual(parsed.acknowledged, { valid: '2026-09-04T00:00:00.000Z' });

assert.equal(reminderThresholdForDays(181, [30, 90, 180]), null);
assert.equal(reminderThresholdForDays(180, [30, 90, 180]), 180);
assert.equal(reminderThresholdForDays(100, [30, 90, 180]), 180);
assert.equal(reminderThresholdForDays(90, [30, 90, 180]), 90);
assert.equal(reminderThresholdForDays(45, [30, 90, 180]), 90);
assert.equal(reminderThresholdForDays(30, [30, 90, 180]), 30);
assert.equal(reminderThresholdForDays(0, [30, 90, 180]), 30);
assert.equal(reminderThresholdForDays(-1, [30, 90, 180]), null);
assert.equal(reminderThresholdForDays(20, [90, 180]), 90);
assert.equal(reminderThresholdForDays(20, []), null);

const disabled30 = setReminderThresholdEnabled(defaults, 30, false);
assert.deepEqual(disabled30.thresholds, [90, 180]);
assert.deepEqual(setReminderThresholdEnabled(disabled30, 30, true).thresholds, [30, 90, 180]);

const key180 = reminderAcknowledgementKey('nodejs', '22', '2027-04-30', 180);
const key90 = reminderAcknowledgementKey('nodejs', '22', '2027-04-30', 90);
assert.notEqual(key180, key90);

const acknowledged = acknowledgeReminder(defaults, key180, '2026-09-04T00:00:00.000Z');
assert.equal(isReminderAcknowledged(acknowledged, key180), true);
assert.equal(isReminderAcknowledged(acknowledged, key90), false);

console.log('EOL reminder tests passed.');
