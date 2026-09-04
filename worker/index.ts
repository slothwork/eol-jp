import {
  buildNotificationText,
  collectDueNotifications,
  isAllowedWebhookUrl,
  normalizeThresholds,
  normalizeTrackedItems,
  webhookPayload,
  type NotificationCatalog,
  type NotificationChannel,
  type NotificationSubscription
} from './notification-core';
import {
  buildBadgeSvg,
  buildProductIndex,
  buildProductPayload,
  type PublicCatalog
} from './public-api';

type KvListResult = {
  keys: Array<{ name: string }>;
  list_complete: boolean;
  cursor?: string;
};

type KvNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<KvListResult>;
};

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  NOTIFICATION_SUBSCRIPTIONS?: KvNamespace;
};

const PREFIX = 'subscription:';
const MAX_BODY_BYTES = 32_768;
const SITE_ORIGIN = 'https://eol.slothwright.com';
const PUBLIC_CACHE_CONTROL = 'public, max-age=300, s-maxage=3600';

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function publicJson(data: unknown, status = 200, head = false): Response {
  const body = head ? null : JSON.stringify(data);
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? PUBLIC_CACHE_CONTROL : 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function parseJsonBody(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) throw new Error('payload_too_large');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('payload_too_large');
  return JSON.parse(text);
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function authorize(request: Request, subscription: NotificationSubscription): Promise<boolean> {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return false;
  return (await sha256(token)) === subscription.tokenHash;
}

function subscriptionKey(id: string): string {
  return `${PREFIX}${id}`;
}

async function loadSubscription(kv: KvNamespace, id: string): Promise<NotificationSubscription | null> {
  const raw = await kv.get(subscriptionKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NotificationSubscription;
    if (parsed?.schemaVersion !== 1 || parsed.id !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function sendWebhook(channel: NotificationChannel, webhookUrl: string, text: string): Promise<Response> {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload(channel, text)),
    redirect: 'error'
  });
}

async function createSubscription(request: Request, env: Env): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'invalid_json' }, 400);
  }

  if (!body || typeof body !== 'object') return json({ error: 'invalid_request' }, 400);
  const candidate = body as Record<string, unknown>;
  const channel = candidate.channel === 'slack' || candidate.channel === 'discord' ? candidate.channel : null;
  const webhookUrl = typeof candidate.webhookUrl === 'string' ? candidate.webhookUrl.trim() : '';
  const items = normalizeTrackedItems(candidate.items);
  const thresholds = normalizeThresholds(candidate.thresholds);

  if (!channel) return json({ error: 'unsupported_channel' }, 400);
  if (!isAllowedWebhookUrl(channel, webhookUrl)) return json({ error: 'invalid_webhook_url' }, 400);
  if (items.length === 0) return json({ error: 'tracked_items_required' }, 400);
  if (thresholds.length === 0) return json({ error: 'threshold_required' }, 400);

  const testText = `EOL情報.jp — ${channel === 'slack' ? 'Slack' : 'Discord'}通知のテストです。\n通知先の登録に成功しました。`;
  let testResponse: Response;
  try {
    testResponse = await sendWebhook(channel, webhookUrl, testText);
  } catch {
    return json({ error: 'webhook_test_failed' }, 400);
  }
  if (!testResponse.ok) return json({ error: 'webhook_test_failed', status: testResponse.status }, 400);

  const id = crypto.randomUUID();
  const token = randomToken();
  const now = new Date().toISOString();
  const subscription: NotificationSubscription = {
    schemaVersion: 1,
    id,
    channel,
    webhookUrl,
    items,
    thresholds,
    tokenHash: await sha256(token),
    createdAt: now,
    updatedAt: now,
    sent: {}
  };
  await kv.put(subscriptionKey(id), JSON.stringify(subscription));

  return json({ id, token, channel, itemCount: items.length, thresholds }, 201);
}

async function getSubscription(request: Request, env: Env, id: string): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  const subscription = await loadSubscription(kv, id);
  if (!subscription) return json({ error: 'not_found' }, 404);
  if (!(await authorize(request, subscription))) return json({ error: 'unauthorized' }, 401);

  return json({
    id: subscription.id,
    channel: subscription.channel,
    itemCount: subscription.items.length,
    thresholds: subscription.thresholds,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    disabled: Boolean(subscription.disabledAt),
    lastError: subscription.lastError ?? null
  });
}

async function updateSubscription(request: Request, env: Env, id: string): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);
  const subscription = await loadSubscription(kv, id);
  if (!subscription) return json({ error: 'not_found' }, 404);
  if (!(await authorize(request, subscription))) return json({ error: 'unauthorized' }, 401);

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'invalid_request' }, 400);
  const candidate = body as Record<string, unknown>;
  const items = normalizeTrackedItems(candidate.items);
  const thresholds = normalizeThresholds(candidate.thresholds);
  if (items.length === 0) return json({ error: 'tracked_items_required' }, 400);
  if (thresholds.length === 0) return json({ error: 'threshold_required' }, 400);

  subscription.items = items;
  subscription.thresholds = thresholds;
  subscription.updatedAt = new Date().toISOString();
  subscription.disabledAt = undefined;
  subscription.lastError = undefined;
  await kv.put(subscriptionKey(id), JSON.stringify(subscription));
  return json({ id, channel: subscription.channel, itemCount: items.length, thresholds });
}

async function deleteSubscription(request: Request, env: Env, id: string): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);
  const subscription = await loadSubscription(kv, id);
  if (!subscription) return new Response(null, { status: 204 });
  if (!(await authorize(request, subscription))) return json({ error: 'unauthorized' }, 401);
  await kv.delete(subscriptionKey(id));
  return new Response(null, { status: 204 });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/notifications/subscriptions' && request.method === 'POST') {
    return createSubscription(request, env);
  }

  const match = /^\/api\/notifications\/subscriptions\/([0-9a-f-]+)$/.exec(url.pathname);
  if (!match) return json({ error: 'not_found' }, 404);
  const id = match[1];
  if (request.method === 'GET') return getSubscription(request, env, id);
  if (request.method === 'PUT') return updateSubscription(request, env, id);
  if (request.method === 'DELETE') return deleteSubscription(request, env, id);
  return json({ error: 'method_not_allowed' }, 405);
}

async function loadCatalog(env: Env): Promise<NotificationCatalog & PublicCatalog> {
  const response = await env.ASSETS.fetch(new Request('https://assets.local/my-eol-data.json'));
  if (!response.ok) throw new Error(`catalog_fetch_${response.status}`);
  return response.json() as Promise<NotificationCatalog & PublicCatalog>;
}

async function handlePublicApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return publicJson({ error: 'method_not_allowed' }, 405, request.method === 'HEAD');
  }

  const catalog = await loadCatalog(env);
  const head = request.method === 'HEAD';
  if (url.pathname === '/api/v1/products' || url.pathname === '/api/v1/products/') {
    return publicJson(buildProductIndex(catalog), 200, head);
  }

  const match = /^\/api\/v1\/products\/([a-z0-9._-]+)\/?$/i.exec(url.pathname);
  if (!match) return publicJson({ error: 'not_found' }, 404, head);
  const version = url.searchParams.get('version')?.trim() || null;
  const payload = buildProductPayload(catalog, match[1], version, new Date());
  if (!payload) return publicJson({ error: version ? 'version_not_found' : 'product_not_found' }, 404, head);
  return publicJson(payload, 200, head);
}

async function handleBadge(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const match = /^\/badge\/([a-z0-9._-]+)\.svg$/i.exec(url.pathname);
  if (!match) return new Response(null, { status: 404 });

  const catalog = await loadCatalog(env);
  const version = url.searchParams.get('version')?.trim() || null;
  const badge = buildBadgeSvg(catalog, match[1], version, new Date());
  return new Response(request.method === 'HEAD' ? null : badge.svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': PUBLIC_CACHE_CONTROL,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'X-EOL-Badge-Found': badge.found ? '1' : '0'
    }
  });
}

async function processSubscription(kv: KvNamespace, subscription: NotificationSubscription, catalog: NotificationCatalog, now: Date): Promise<void> {
  const due = collectDueNotifications(subscription, catalog, now);
  if (due.length === 0) return;

  const text = buildNotificationText(due, SITE_ORIGIN);
  let response: Response;
  try {
    response = await sendWebhook(subscription.channel, subscription.webhookUrl, text);
  } catch {
    subscription.lastError = 'webhook_request_failed';
    subscription.updatedAt = now.toISOString();
    await kv.put(subscriptionKey(subscription.id), JSON.stringify(subscription));
    return;
  }

  if (!response.ok) {
    subscription.lastError = `webhook_http_${response.status}`;
    if (response.status === 404 || response.status === 410) subscription.disabledAt = now.toISOString();
    subscription.updatedAt = now.toISOString();
    await kv.put(subscriptionKey(subscription.id), JSON.stringify(subscription));
    return;
  }

  for (const item of due) subscription.sent[item.deliveryKey] = now.toISOString();
  subscription.lastError = undefined;
  subscription.updatedAt = now.toISOString();
  await kv.put(subscriptionKey(subscription.id), JSON.stringify(subscription));
}

async function runScheduled(env: Env, scheduledTime: number): Promise<void> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return;
  const catalog = await loadCatalog(env);
  const now = new Date(scheduledTime);
  let cursor: string | undefined;

  do {
    const page = await kv.list({ prefix: PREFIX, cursor, limit: 100 });
    for (const key of page.keys) {
      const id = key.name.slice(PREFIX.length);
      const subscription = await loadSubscription(kv, id);
      if (!subscription) continue;
      await processSubscription(kv, subscription, catalog, now);
    }
    cursor = page.list_complete ? undefined : page.cursor;
    if (page.list_complete) break;
  } while (cursor);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/notifications/')) return handleApi(request, env);
    if (url.pathname.startsWith('/api/v1/')) return handlePublicApi(request, env);
    if (url.pathname.startsWith('/badge/')) return handleBadge(request, env);
    return env.ASSETS.fetch(request);
  },

  async scheduled(controller: { scheduledTime: number }, env: Env): Promise<void> {
    await runScheduled(env, controller.scheduledTime);
  }
};
