import assert from 'node:assert/strict';
import {
  buildEmailNotificationPayload,
  clearEmailNotificationSubscription,
  emailNotificationNeedsSync,
  emptyEmailNotificationState,
  markEmailNotificationSynced,
  parseEmailNotificationState,
  serializeEmailNotificationState,
  setEmailNotificationSubscription
} from '../src/lib/email-notifications.ts';

const tracked = {
  schemaVersion: 1,
  products: {
    python: { version: '3.13', savedAt: '2026-09-04T00:00:00.000Z' },
    nodejs: { version: '24', savedAt: '2026-09-04T00:00:00.000Z' }
  }
};
const reminders = { schemaVersion: 1, thresholds: [30, 180], acknowledged: {} };
const payload = buildEmailNotificationPayload(tracked, reminders);
assert.deepEqual(payload, {
  items: [
    { slug: 'nodejs', version: '24' },
    { slug: 'python', version: '3.13' }
  ],
  thresholds: [180, 30]
});

assert.deepEqual(parseEmailNotificationState(null), emptyEmailNotificationState());
assert.deepEqual(parseEmailNotificationState('{bad'), emptyEmailNotificationState());
assert.deepEqual(
  parseEmailNotificationState(JSON.stringify({ schemaVersion: 1, subscription: { id: 'x' } })),
  emptyEmailNotificationState()
);

let state = setEmailNotificationSubscription(
  emptyEmailNotificationState(),
  { id: 'subscription-id', token: 'secret-token', emailMasked: 'us***@example.com' },
  payload,
  '2026-09-04T01:00:00.000Z'
);
assert.equal(emailNotificationNeedsSync(state, payload), false);
assert.equal(
  emailNotificationNeedsSync(state, { ...payload, items: [...payload.items, { slug: 'php', version: '8.4' }] }),
  true
);
state = markEmailNotificationSynced(state, { ...payload, thresholds: [90] }, '2026-09-04T02:00:00.000Z');
assert.equal(emailNotificationNeedsSync(state, { ...payload, thresholds: [90] }), false);
assert.equal(parseEmailNotificationState(serializeEmailNotificationState(state)).subscription?.emailMasked, 'us***@example.com');
assert.deepEqual(clearEmailNotificationSubscription(), emptyEmailNotificationState());

console.log('Email notification client state tests passed.');
