import assert from 'node:assert/strict';
import worker from '../worker/index.ts';

const catalog = {
  schemaVersion: 1,
  generatedAt: '2026-09-06T00:00:00Z',
  sourceUrl: 'https://endoflife.date/',
  products: [
    {
      slug: 'nodejs',
      label: 'Node.js',
      category: 'lang',
      releases: [
        {
          name: '22',
          eolFrom: '2027-04-30',
          isLts: true
        }
      ]
    }
  ]
};

const emptyKv = {
  async get() { return null; },
  async put() {},
  async delete() {},
  async list() { return { keys: [], list_complete: true }; }
};

const env = {
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === '/my-eol-data.json') return Response.json(catalog);
      return new Response(`asset:${url.pathname}`, { status: 200 });
    }
  },
  NOTIFICATION_SUBSCRIPTIONS: emptyKv
};

const externalConfig = await worker.fetch(
  new Request('https://eol.slothwright.com/api/notifications/config'),
  env
);
assert.equal(externalConfig.status, 200);
assert.deepEqual(await externalConfig.json(), {
  enabled: false,
  turnstileSiteKey: null,
  hourlyPerIpLimit: 5,
  dailyRegistrationLimit: 100
});

const emailConfig = await worker.fetch(
  new Request('https://eol.slothwright.com/api/notifications/email/config'),
  env
);
assert.equal(emailConfig.status, 200);
const emailConfigBody = await emailConfig.json();
assert.equal(emailConfigBody.enabled, false);
assert.equal(emailConfigBody.turnstileSiteKey, null);

const products = await worker.fetch(
  new Request('https://eol.slothwright.com/api/v1/products'),
  env
);
assert.equal(products.status, 200);
assert.equal(products.headers.get('Access-Control-Allow-Origin'), '*');
const productIndex = await products.json();
assert.deepEqual(productIndex.products.map(({ slug, label }) => ({ slug, label })), [
  { slug: 'nodejs', label: 'Node.js' }
]);

const methodNotAllowed = await worker.fetch(
  new Request('https://eol.slothwright.com/api/v1/products', { method: 'POST' }),
  env
);
assert.equal(methodNotAllowed.status, 405);

const badge = await worker.fetch(
  new Request('https://eol.slothwright.com/badge/nodejs.svg?version=22'),
  env
);
assert.equal(badge.status, 200);
assert.equal(badge.headers.get('Content-Type'), 'image/svg+xml; charset=utf-8');
assert.equal(badge.headers.get('X-EOL-Badge-Found'), '1');
assert.match(await badge.text(), /Node\.js 22/);

const staticAsset = await worker.fetch(
  new Request('https://eol.slothwright.com/about/'),
  env
);
assert.equal(staticAsset.status, 200);
assert.equal(await staticAsset.text(), 'asset:/about/');

await worker.scheduled({ scheduledTime: Date.parse('2026-09-06T01:15:00Z') }, env);

console.log('Worker runtime routing tests passed.');
