import assert from 'node:assert/strict';
import {
  EMAIL_DAILY_SEND_LIMIT,
  EMAIL_VERIFY_COOLDOWN_SECONDS,
  EMAIL_VERIFY_DAILY_PER_ADDRESS,
  EMAIL_VERIFY_MAX_ATTEMPTS,
  EMAIL_VERIFY_TTL_SECONDS,
  buildReminderEmailText,
  buildVerificationEmailText,
  emailDailyQuotaKey,
  emailPendingKey,
  emailSubscriptionKey,
  emailVerificationCooldownKey,
  emailVerificationRateKey,
  isVerificationCode,
  maskEmail,
  normalizeEmail,
  reminderEmailSubject
} from '../worker/email-notification.ts';
import { daysUntilDate } from '../worker/notification-core.ts';
import { handleEmailApi } from '../worker/email-runtime.ts';

assert.equal(EMAIL_DAILY_SEND_LIMIT, 80);
assert.equal(EMAIL_VERIFY_TTL_SECONDS, 900);
assert.equal(EMAIL_VERIFY_COOLDOWN_SECONDS, 600);
assert.equal(EMAIL_VERIFY_DAILY_PER_ADDRESS, 3);
assert.equal(EMAIL_VERIFY_MAX_ATTEMPTS, 5);

assert.equal(normalizeEmail(' User@Example.COM '), 'user@example.com');
assert.equal(normalizeEmail('invalid'), null);
assert.equal(normalizeEmail('a@b'), null);
assert.equal(maskEmail('user@example.com'), 'us**@example.com');
assert.equal(maskEmail('a@example.com'), 'a***@example.com');
assert.equal(isVerificationCode('123456'), true);
assert.equal(isVerificationCode('12345'), false);
assert.equal(isVerificationCode('abcdef'), false);

assert.equal(emailSubscriptionKey('abc'), 'email-subscription:abc');
assert.equal(emailPendingKey('abc'), 'email-pending:abc');
assert.equal(emailVerificationCooldownKey('hash'), 'email-verify-cooldown:hash');
assert.equal(
  emailDailyQuotaKey(new Date('2026-09-04T23:59:59Z')),
  'email-quota:2026-09-04'
);
assert.equal(
  emailVerificationRateKey('hash', new Date('2026-09-04T23:59:59Z')),
  'email-verify-rate:2026-09-04:hash'
);

const verifyText = buildVerificationEmailText('123456');
assert.match(verifyText, /123456/);
assert.match(verifyText, /15分間/);

const due = [{
  slug: 'nodejs',
  label: 'Node.js',
  version: '22',
  eolFrom: '2026-10-01',
  days: 27,
  threshold: 30,
  deliveryKey: 'nodejs:22:2026-10-01:30'
}];
assert.match(reminderEmailSubject(due), /Node\.js 22/);
const reminderText = buildReminderEmailText(due, 'https://eol.slothwright.com/email-unsubscribe/?id=x&token=y');
assert.match(reminderText, /EOLまであと27日/);
assert.match(reminderText, /email-unsubscribe/);

// JST 2026-09-04 23:59:59 -> target 9/5 is 1 day away.
assert.equal(daysUntilDate('2026-09-05', new Date('2026-09-04T14:59:59Z')), 1);
// JST midnight has passed -> target 9/5 is today.
assert.equal(daysUntilDate('2026-09-05', new Date('2026-09-04T15:00:00Z')), 0);

const configResponse = await handleEmailApi(
  new Request('https://eol.slothwright.com/api/notifications/email/config'),
  {}
);
assert.equal(configResponse.status, 200);
assert.deepEqual(await configResponse.json(), {
  enabled: false,
  turnstileSiteKey: null,
  dailySendLimit: 80
});

console.log('Email notification tests passed.');
