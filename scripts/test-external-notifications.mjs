import assert from 'node:assert/strict';
import {
  buildNotificationText,
  collectDueNotifications,
  isAllowedWebhookUrl,
  normalizeThresholds,
  normalizeTrackedItems,
  notificationDeliveryKey,
  thresholdForDays,
  webhookPayload
} from '../worker/notification-core.ts';

assert.equal(isAllowedWebhookUrl('slack', 'https://hooks.slack.com/services/T1/B2/token'), true);
assert.equal(isAllowedWebhookUrl('slack', 'https://example.com/services/T1/B2/token'), false);
assert.equal(isAllowedWebhookUrl('discord', 'https://discord.com/api/webhooks/123/token'), true);
assert.equal(isAllowedWebhookUrl('discord', 'https://discord.com/channels/123'), false);
assert.equal(isAllowedWebhookUrl('discord', 'http://discord.com/api/webhooks/123/token'), false);

assert.deepEqual(normalizeThresholds([30, 180, 30, 999]), [180, 30]);
assert.deepEqual(normalizeThresholds(null), [180, 90, 30]);
assert.deepEqual(normalizeTrackedItems([
  { slug: 'nodejs', version: '22' },
  { slug: 'nodejs', version: '22' },
  { slug: 'python', version: '3.13' },
  { slug: '', version: '1' }
]), [
  { slug: 'nodejs', version: '22' },
  { slug: 'python', version: '3.13' }
]);

assert.equal(thresholdForDays(181, [180, 90, 30]), null);
assert.equal(thresholdForDays(180, [180, 90, 30]), 180);
assert.equal(thresholdForDays(90, [180, 90, 30]), 90);
assert.equal(thresholdForDays(30, [180, 90, 30]), 30);
assert.equal(thresholdForDays(0, [180, 90, 30]), 30);
assert.equal(thresholdForDays(-1, [180, 90, 30]), null);
assert.equal(thresholdForDays(20, [180, 90]), 90);

const subscription = {
  schemaVersion: 1,
  id: 'sub-1',
  channel: 'slack',
  webhookUrl: 'https://hooks.slack.com/services/T1/B2/token',
  items: [
    { slug: 'nodejs', version: '22' },
    { slug: 'python', version: '3.13' }
  ],
  thresholds: [180, 90, 30],
  tokenHash: 'hash',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sent: {}
};

const catalog = {
  products: [
    {
      slug: 'nodejs',
      label: 'Node.js',
      releases: [{ name: '22', eolFrom: '2026-10-01', isLts: true }]
    },
    {
      slug: 'python',
      label: 'Python',
      releases: [{ name: '3.13', eolFrom: '2027-10-01', isLts: false }]
    }
  ]
};

const now = new Date('2026-09-04T00:00:00.000Z');
const due = collectDueNotifications(subscription, catalog, now);
assert.equal(due.length, 1);
assert.equal(due[0].slug, 'nodejs');
assert.equal(due[0].threshold, 30);
assert.equal(due[0].deliveryKey, notificationDeliveryKey('nodejs', '22', '2026-10-01', 30));

const alreadySent = {
  ...subscription,
  sent: { [due[0].deliveryKey]: '2026-09-01T00:00:00.000Z' }
};
assert.equal(collectDueNotifications(alreadySent, catalog, now).length, 0);

const changedEolCatalog = {
  products: [
    {
      slug: 'nodejs',
      label: 'Node.js',
      releases: [{ name: '22', eolFrom: '2026-10-02', isLts: true }]
    }
  ]
};
assert.equal(collectDueNotifications(alreadySent, changedEolCatalog, now).length, 1);

const text = buildNotificationText(due);
assert.match(text, /Node\.js 22/);
assert.match(text, /EOLまであと27日/);
assert.match(text, /https:\/\/eol\.slothwright\.com\/eol\/nodejs\//);
assert.deepEqual(webhookPayload('slack', 'hello'), { text: 'hello' });
assert.deepEqual(webhookPayload('discord', 'hello'), { content: 'hello', allowed_mentions: { parse: [] } });

console.log('External notification tests passed.');
