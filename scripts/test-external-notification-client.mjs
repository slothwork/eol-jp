import assert from 'node:assert/strict';
import {
  buildExternalNotificationPayload,
  clearExternalNotificationSubscription,
  emptyExternalNotificationState,
  externalNotificationNeedsSync,
  markExternalNotificationSynced,
  parseExternalNotificationState,
  serializeExternalNotificationState,
  setExternalNotificationSubscription
} from '../src/lib/external-notifications.ts';

const tracked = {
  schemaVersion: 1,
  products: {
    python: { version: '3.13', savedAt: '2026-09-04T00:00:00.000Z' },
    nodejs: { version: '24', savedAt: '2026-09-04T00:00:00.000Z' }
  }
};
const reminders = { schemaVersion: 1, thresholds: [30, 180], acknowledged: {} };
const payload = buildExternalNotificationPayload(tracked, reminders);
assert.deepEqual(payload, {
  items: [
    { slug: 'nodejs', version: '24' },
    { slug: 'python', version: '3.13' }
  ],
  thresholds: [180, 30]
});

assert.deepEqual(parseExternalNotificationState(null), emptyExternalNotificationState());
assert.deepEqual(parseExternalNotificationState('{bad'), emptyExternalNotificationState());
assert.deepEqual(parseExternalNotificationState(JSON.stringify({ schemaVersion: 1, subscription: { id: 'x' } })), emptyExternalNotificationState());

let state = setExternalNotificationSubscription(
  emptyExternalNotificationState(),
  { id: 'subscription-id', token: 'secret-token', channel: 'slack' },
  payload,
  '2026-09-04T01:00:00.000Z'
);
assert.equal(externalNotificationNeedsSync(state, payload), false);
assert.equal(
  externalNotificationNeedsSync(state, { ...payload, items: [...payload.items, { slug: 'php', version: '8.4' }] }),
  true
);

state = markExternalNotificationSynced(
  state,
  { ...payload, thresholds: [90] },
  '2026-09-04T02:00:00.000Z'
);
assert.equal(externalNotificationNeedsSync(state, { ...payload, thresholds: [90] }), false);
assert.equal(parseExternalNotificationState(serializeExternalNotificationState(state)).subscription?.channel, 'slack');
assert.deepEqual(clearExternalNotificationSubscription(), emptyExternalNotificationState());

console.log('External notification client state tests passed.');
