import {
  collectDueNotifications,
  normalizeThresholds,
  normalizeTrackedItems,
  type NotificationCatalog
} from './notification-core.ts';
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
  reminderEmailSubject,
  type EmailNotificationSubscription,
  type PendingEmailVerification
} from './email-notification.ts';

type KvListResult = {
  keys: Array<{ name: string }>;
  list_complete: boolean;
  cursor?: string;
};

export type EmailKvNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<KvListResult>;
};

export type EmailRuntimeEnv = {
  NOTIFICATION_SUBSCRIPTIONS?: EmailKvNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

const SITE_ORIGIN = 'https://eol.slothwright.com';
const EMAIL_PREFIX = 'email-subscription:';
const MAX_ITEMS = 25;
const MAX_BODY_BYTES = 32_768;

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function emailConfigured(env: EmailRuntimeEnv): boolean {
  return Boolean(
    env.NOTIFICATION_SUBSCRIPTIONS &&
    env.RESEND_API_KEY &&
    env.EMAIL_FROM &&
    env.TURNSTILE_SITE_KEY &&
    env.TURNSTILE_SECRET_KEY
  );
}

function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('Origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}

async function parseJsonBody(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) throw new Error('payload_too_large');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('payload_too_large');
  return JSON.parse(text);
}

function randomToken(bytesLength = 32): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function verificationCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, '0');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{20,64}$/i.test(value);
}

function hasTooManyItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > MAX_ITEMS;
}

async function validateTurnstile(request: Request, env: EmailRuntimeEnv, token: unknown): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
  const remoteip = request.headers.get('CF-Connecting-IP') ?? undefined;
  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip,
        idempotency_key: crypto.randomUUID()
      })
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
  return Boolean(
    result.success &&
    result.action === 'email_notification' &&
    result.hostname === new URL(request.url).hostname
  );
}

async function reserveDailySend(kv: EmailKvNamespace, now = new Date()): Promise<boolean> {
  const key = emailDailyQuotaKey(now);
  const raw = await kv.get(key);
  const count = Number.parseInt(raw ?? '0', 10);
  const safeCount = Number.isFinite(count) && count >= 0 ? count : 0;
  if (safeCount >= EMAIL_DAILY_SEND_LIMIT) return false;
  await kv.put(key, String(safeCount + 1), { expirationTtl: 2 * 24 * 60 * 60 });
  return true;
}

async function reserveVerificationRequest(kv: EmailKvNamespace, email: string, now = new Date()): Promise<boolean> {
  const emailHash = await sha256(email);
  const cooldownKey = emailVerificationCooldownKey(emailHash);
  if (await kv.get(cooldownKey)) return false;

  const rateKey = emailVerificationRateKey(emailHash, now);
  const raw = await kv.get(rateKey);
  const count = Number.parseInt(raw ?? '0', 10);
  const safeCount = Number.isFinite(count) && count >= 0 ? count : 0;
  if (safeCount >= EMAIL_VERIFY_DAILY_PER_ADDRESS) return false;

  await kv.put(cooldownKey, '1', { expirationTtl: EMAIL_VERIFY_COOLDOWN_SECONDS });
  await kv.put(rateKey, String(safeCount + 1), { expirationTtl: 2 * 24 * 60 * 60 });
  return true;
}

async function sendResend(
  env: EmailRuntimeEnv,
  to: string,
  subject: string,
  text: string,
  idempotencyKey: string
): Promise<Response> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return new Response(null, { status: 503 });
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'eol-jp/1.0',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      text
    })
  });
}

async function loadPending(kv: EmailKvNamespace, id: string): Promise<PendingEmailVerification | null> {
  const raw = await kv.get(emailPendingKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingEmailVerification;
    if (parsed.schemaVersion !== 1 || parsed.id !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function loadEmailSubscription(kv: EmailKvNamespace, id: string): Promise<EmailNotificationSubscription | null> {
  const raw = await kv.get(emailSubscriptionKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EmailNotificationSubscription;
    if (parsed.schemaVersion !== 1 || parsed.id !== id || parsed.channel !== 'email') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function authorize(request: Request, subscription: EmailNotificationSubscription): Promise<boolean> {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return false;
  return (await sha256(token)) === subscription.tokenHash;
}

async function requestVerification(request: Request, env: EmailRuntimeEnv): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!emailConfigured(env) || !kv) return json({ error: 'email_notifications_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'invalid_request' }, 400);
  const candidate = body as Record<string, unknown>;
  const email = normalizeEmail(candidate.email);
  if (!email) return json({ error: 'invalid_email' }, 400);
  if (hasTooManyItems(candidate.items)) return json({ error: 'too_many_tracked_items', max: MAX_ITEMS }, 400);
  const items = normalizeTrackedItems(candidate.items, MAX_ITEMS);
  const thresholds = normalizeThresholds(candidate.thresholds);
  if (items.length === 0) return json({ error: 'tracked_items_required' }, 400);
  if (thresholds.length === 0) return json({ error: 'threshold_required' }, 400);

  const turnstileOk = await validateTurnstile(request, env, candidate.turnstileToken);
  if (!turnstileOk) return json({ error: 'turnstile_failed' }, 400);
  if (!(await reserveVerificationRequest(kv, email))) return json({ error: 'verification_rate_limited' }, 429);
  if (!(await reserveDailySend(kv))) return json({ error: 'email_daily_limit_reached' }, 429);

  const id = crypto.randomUUID();
  const code = verificationCode();
  const now = new Date();
  const pending: PendingEmailVerification = {
    schemaVersion: 1,
    id,
    email,
    codeHash: await sha256(code),
    attempts: 0,
    items,
    thresholds,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + EMAIL_VERIFY_TTL_SECONDS * 1000).toISOString()
  };
  await kv.put(emailPendingKey(id), JSON.stringify(pending), { expirationTtl: EMAIL_VERIFY_TTL_SECONDS });

  let response: Response;
  try {
    response = await sendResend(
      env,
      email,
      '【EOL情報.jp】メール通知の確認コード',
      buildVerificationEmailText(code),
      `verify-${id}`
    );
  } catch {
    await kv.delete(emailPendingKey(id));
    return json({ error: 'email_send_failed' }, 502);
  }
  if (!response.ok) {
    await kv.delete(emailPendingKey(id));
    return json({ error: 'email_send_failed', status: response.status }, 502);
  }

  return json({ challengeId: id, emailMasked: maskEmail(email), expiresIn: EMAIL_VERIFY_TTL_SECONDS }, 201);
}

async function verifyEmail(request: Request, env: EmailRuntimeEnv): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!emailConfigured(env) || !kv) return json({ error: 'email_notifications_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'invalid_request' }, 400);
  const candidate = body as Record<string, unknown>;
  if (!validId(candidate.challengeId) || !isVerificationCode(candidate.code)) return json({ error: 'invalid_verification' }, 400);

  const pending = await loadPending(kv, candidate.challengeId);
  if (!pending) return json({ error: 'verification_not_found' }, 404);
  const now = new Date();
  if (Date.parse(pending.expiresAt) <= now.getTime()) {
    await kv.delete(emailPendingKey(pending.id));
    return json({ error: 'verification_expired' }, 410);
  }

  if ((await sha256(candidate.code.trim())) !== pending.codeHash) {
    pending.attempts += 1;
    if (pending.attempts >= EMAIL_VERIFY_MAX_ATTEMPTS) {
      await kv.delete(emailPendingKey(pending.id));
      return json({ error: 'verification_locked' }, 429);
    }
    const remaining = Math.max(1, Math.floor((Date.parse(pending.expiresAt) - now.getTime()) / 1000));
    await kv.put(emailPendingKey(pending.id), JSON.stringify(pending), { expirationTtl: remaining });
    return json({ error: 'verification_code_mismatch', attemptsRemaining: EMAIL_VERIFY_MAX_ATTEMPTS - pending.attempts }, 400);
  }

  const id = crypto.randomUUID();
  const token = randomToken();
  const subscription: EmailNotificationSubscription = {
    schemaVersion: 1,
    id,
    channel: 'email',
    email: pending.email,
    items: pending.items,
    thresholds: pending.thresholds,
    tokenHash: await sha256(token),
    unsubscribeToken: randomToken(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    sent: {}
  };
  await kv.put(emailSubscriptionKey(id), JSON.stringify(subscription));
  await kv.delete(emailPendingKey(pending.id));

  return json({
    id,
    token,
    channel: 'email',
    emailMasked: maskEmail(subscription.email),
    itemCount: subscription.items.length,
    thresholds: subscription.thresholds
  }, 201);
}

async function getEmailSubscription(request: Request, env: EmailRuntimeEnv, id: string): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  const subscription = await loadEmailSubscription(kv, id);
  if (!subscription) return json({ error: 'not_found' }, 404);
  if (!(await authorize(request, subscription))) return json({ error: 'unauthorized' }, 401);
  return json({
    id,
    channel: 'email',
    emailMasked: maskEmail(subscription.email),
    itemCount: subscription.items.length,
    thresholds: subscription.thresholds,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    disabled: Boolean(subscription.disabledAt),
    lastError: subscription.lastError ?? null
  });
}

async function updateEmailSubscription(request: Request, env: EmailRuntimeEnv, id: string): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);
  const subscription = await loadEmailSubscription(kv, id);
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
  if (hasTooManyItems(candidate.items)) return json({ error: 'too_many_tracked_items', max: MAX_ITEMS }, 400);
  const items = normalizeTrackedItems(candidate.items, MAX_ITEMS);
  const thresholds = normalizeThresholds(candidate.thresholds);
  if (items.length === 0) return json({ error: 'tracked_items_required' }, 400);
  if (thresholds.length === 0) return json({ error: 'threshold_required' }, 400);

  subscription.items = items;
  subscription.thresholds = thresholds;
  subscription.updatedAt = new Date().toISOString();
  subscription.disabledAt = undefined;
  subscription.lastError = undefined;
  await kv.put(emailSubscriptionKey(id), JSON.stringify(subscription));
  return json({ id, channel: 'email', emailMasked: maskEmail(subscription.email), itemCount: items.length, thresholds });
}

async function deleteEmailSubscription(request: Request, env: EmailRuntimeEnv, id: string): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);
  const subscription = await loadEmailSubscription(kv, id);
  if (!subscription) return new Response(null, { status: 204 });
  if (!(await authorize(request, subscription))) return json({ error: 'unauthorized' }, 401);
  await kv.delete(emailSubscriptionKey(id));
  return new Response(null, { status: 204 });
}

async function unsubscribeEmail(request: Request, env: EmailRuntimeEnv): Promise<Response> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!kv) return json({ error: 'notification_storage_unconfigured' }, 503);
  if (!sameOriginRequest(request)) return json({ error: 'forbidden_origin' }, 403);

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'invalid_request' }, 400);
  const candidate = body as Record<string, unknown>;
  if (!validId(candidate.id) || typeof candidate.token !== 'string' || candidate.token.length < 32) {
    return json({ error: 'invalid_unsubscribe_request' }, 400);
  }
  const subscription = await loadEmailSubscription(kv, candidate.id);
  if (!subscription) return new Response(null, { status: 204 });
  if (candidate.token !== subscription.unsubscribeToken) return json({ error: 'unauthorized' }, 401);
  await kv.delete(emailSubscriptionKey(subscription.id));
  return new Response(null, { status: 204 });
}

export async function handleEmailApi(request: Request, env: EmailRuntimeEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/notifications/email/config' && request.method === 'GET') {
    return json({
      enabled: emailConfigured(env),
      turnstileSiteKey: emailConfigured(env) ? env.TURNSTILE_SITE_KEY : null,
      dailySendLimit: EMAIL_DAILY_SEND_LIMIT
    });
  }
  if (url.pathname === '/api/notifications/email/request' && request.method === 'POST') return requestVerification(request, env);
  if (url.pathname === '/api/notifications/email/verify' && request.method === 'POST') return verifyEmail(request, env);
  if (url.pathname === '/api/notifications/email/unsubscribe' && request.method === 'POST') return unsubscribeEmail(request, env);

  const match = /^\/api\/notifications\/email\/subscriptions\/([0-9a-f-]+)$/.exec(url.pathname);
  if (!match) return json({ error: 'not_found' }, 404);
  const id = match[1];
  if (request.method === 'GET') return getEmailSubscription(request, env, id);
  if (request.method === 'PUT') return updateEmailSubscription(request, env, id);
  if (request.method === 'DELETE') return deleteEmailSubscription(request, env, id);
  return json({ error: 'method_not_allowed' }, 405);
}

async function processEmailSubscription(
  kv: EmailKvNamespace,
  subscription: EmailNotificationSubscription,
  catalog: NotificationCatalog,
  env: EmailRuntimeEnv,
  now: Date
): Promise<void> {
  const due = collectDueNotifications(subscription, catalog, now);
  if (due.length === 0) return;
  if (!(await reserveDailySend(kv, now))) {
    subscription.lastError = 'email_daily_limit_reached';
    subscription.updatedAt = now.toISOString();
    await kv.put(emailSubscriptionKey(subscription.id), JSON.stringify(subscription));
    return;
  }

  const unsubscribeUrl = `${SITE_ORIGIN}/email-unsubscribe/?id=${encodeURIComponent(subscription.id)}&token=${encodeURIComponent(subscription.unsubscribeToken)}`;
  const digest = (await sha256(due.map((item) => item.deliveryKey).join('|'))).slice(0, 32);
  let response: Response;
  try {
    response = await sendResend(
      env,
      subscription.email,
      reminderEmailSubject(due),
      buildReminderEmailText(due, unsubscribeUrl, SITE_ORIGIN),
      `reminder-${subscription.id}-${digest}`
    );
  } catch {
    subscription.lastError = 'email_request_failed';
    subscription.updatedAt = now.toISOString();
    await kv.put(emailSubscriptionKey(subscription.id), JSON.stringify(subscription));
    return;
  }

  if (!response.ok) {
    subscription.lastError = `email_http_${response.status}`;
    subscription.updatedAt = now.toISOString();
    await kv.put(emailSubscriptionKey(subscription.id), JSON.stringify(subscription));
    return;
  }

  for (const item of due) subscription.sent[item.deliveryKey] = now.toISOString();
  subscription.lastError = undefined;
  subscription.updatedAt = now.toISOString();
  await kv.put(emailSubscriptionKey(subscription.id), JSON.stringify(subscription));
}

export async function runEmailNotifications(env: EmailRuntimeEnv, catalog: NotificationCatalog, now: Date): Promise<void> {
  const kv = env.NOTIFICATION_SUBSCRIPTIONS;
  if (!emailConfigured(env) || !kv) return;
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: EMAIL_PREFIX, cursor, limit: 100 });
    for (const key of page.keys) {
      const id = key.name.slice(EMAIL_PREFIX.length);
      const subscription = await loadEmailSubscription(kv, id);
      if (!subscription) continue;
      await processEmailSubscription(kv, subscription, catalog, env, now);
    }
    cursor = page.list_complete ? undefined : page.cursor;
    if (page.list_complete) break;
  } while (cursor);
}
