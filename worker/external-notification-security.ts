export const EXTERNAL_NOTIFICATION_TURNSTILE_ACTION = 'external_notification';
export const EXTERNAL_NOTIFICATION_IP_HOURLY_LIMIT = 5;
export const EXTERNAL_NOTIFICATION_DAILY_LIMIT = 100;

export type RateLimitKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

export type ExternalRegistrationRateResult =
  | { allowed: true }
  | { allowed: false; error: 'client_ip_unavailable' | 'external_notification_rate_limited' | 'external_notification_daily_limit_reached' };

function utcDay(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function utcHour(now: Date): string {
  return `${utcDay(now)}T${String(now.getUTCHours()).padStart(2, '0')}`;
}

export function externalRegistrationIpKey(ipHash: string, now = new Date()): string {
  return `external-registration:ip:${utcHour(now)}:${ipHash}`;
}

export function externalRegistrationDailyKey(now = new Date()): string {
  return `external-registration:daily:${utcDay(now)}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function reserveCounter(kv: RateLimitKv, key: string, limit: number, expirationTtl: number): Promise<boolean> {
  const raw = await kv.get(key);
  const count = Number.parseInt(raw ?? '0', 10);
  const safeCount = Number.isFinite(count) && count >= 0 ? count : 0;
  if (safeCount >= limit) return false;
  await kv.put(key, String(safeCount + 1), { expirationTtl });
  return true;
}

export async function reserveExternalRegistration(
  kv: RateLimitKv,
  request: Request,
  now = new Date()
): Promise<ExternalRegistrationRateResult> {
  const clientIp = request.headers.get('CF-Connecting-IP')?.trim();
  if (!clientIp) return { allowed: false, error: 'client_ip_unavailable' };

  const ipHash = await sha256(clientIp);
  const ipAllowed = await reserveCounter(
    kv,
    externalRegistrationIpKey(ipHash, now),
    EXTERNAL_NOTIFICATION_IP_HOURLY_LIMIT,
    2 * 60 * 60
  );
  if (!ipAllowed) return { allowed: false, error: 'external_notification_rate_limited' };

  const dailyAllowed = await reserveCounter(
    kv,
    externalRegistrationDailyKey(now),
    EXTERNAL_NOTIFICATION_DAILY_LIMIT,
    2 * 24 * 60 * 60
  );
  if (!dailyAllowed) return { allowed: false, error: 'external_notification_daily_limit_reached' };

  return { allowed: true };
}

export async function validateExternalNotificationTurnstile(
  request: Request,
  secretKey: string | undefined,
  token: unknown
): Promise<boolean> {
  if (!secretKey || typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;

  const remoteip = request.headers.get('CF-Connecting-IP') ?? undefined;
  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
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
    result.action === EXTERNAL_NOTIFICATION_TURNSTILE_ACTION &&
    result.hostname === new URL(request.url).hostname
  );
}
