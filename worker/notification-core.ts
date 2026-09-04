export type NotificationChannel = 'slack' | 'discord';
export type NotificationThreshold = 30 | 90 | 180;

export type NotificationTrackedItem = {
  slug: string;
  version: string;
};

export type ScheduledNotificationSubscription = {
  items: NotificationTrackedItem[];
  thresholds: NotificationThreshold[];
  sent: Record<string, string>;
  disabledAt?: string;
};

export type NotificationSubscription = ScheduledNotificationSubscription & {
  schemaVersion: 1;
  id: string;
  channel: NotificationChannel;
  webhookUrl: string;
  tokenHash: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
};

export type NotificationCatalog = {
  products?: Array<{
    slug: string;
    label: string;
    releases: Array<{
      name: string;
      eolFrom: string | null;
      isLts: boolean;
    }>;
  }>;
};

export type DueNotification = {
  slug: string;
  label: string;
  version: string;
  eolFrom: string;
  days: number;
  threshold: NotificationThreshold;
  deliveryKey: string;
};

const DAY = 86_400_000;
const JST_OFFSET = 9 * 60 * 60 * 1000;
const ALLOWED_THRESHOLDS: NotificationThreshold[] = [180, 90, 30];

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function tokyoDateEpoch(now = new Date()): number {
  const shifted = new Date(now.getTime() + JST_OFFSET);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

export function daysUntilDate(value: string | null | undefined, now = new Date()): number | null {
  if (!value) return null;
  const date = parseDateOnly(value);
  if (!date) return null;
  return Math.round((date.getTime() - tokyoDateEpoch(now)) / DAY);
}

export function normalizeThresholds(value: unknown): NotificationThreshold[] {
  if (!Array.isArray(value)) return [...ALLOWED_THRESHOLDS];
  const selected = new Set(value.filter((item): item is NotificationThreshold => item === 30 || item === 90 || item === 180));
  return ALLOWED_THRESHOLDS.filter((threshold) => selected.has(threshold));
}

export function normalizeTrackedItems(value: unknown, maxItems = 25): NotificationTrackedItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: NotificationTrackedItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const slug = typeof (item as { slug?: unknown }).slug === 'string' ? (item as { slug: string }).slug.trim() : '';
    const version = typeof (item as { version?: unknown }).version === 'string' ? (item as { version: string }).version.trim() : '';
    if (!slug || !version) continue;
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(slug)) continue;
    const key = `${slug}\u0000${version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ slug, version });
    if (items.length >= maxItems) break;
  }

  return items;
}

export function isAllowedWebhookUrl(channel: NotificationChannel, rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;

    if (channel === 'slack') {
      if (url.hostname !== 'hooks.slack.com' && url.hostname !== 'hooks.slack-gov.com') return false;
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.length === 4 && parts[0] === 'services' && parts.slice(1).every(Boolean);
    }

    if (url.hostname !== 'discord.com' && url.hostname !== 'discordapp.com') return false;
    return /^\/api(?:\/v\d+)?\/webhooks\/[^/]+\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

export function thresholdForDays(days: number | null, thresholds: NotificationThreshold[]): NotificationThreshold | null {
  if (days === null || days < 0) return null;
  const enabled = new Set(thresholds);
  if (days <= 30 && enabled.has(30)) return 30;
  if (days <= 90 && enabled.has(90)) return 90;
  if (days <= 180 && enabled.has(180)) return 180;
  return null;
}

export function notificationDeliveryKey(slug: string, version: string, eolFrom: string, threshold: NotificationThreshold): string {
  return `${slug}:${version}:${eolFrom}:${threshold}`;
}

export function collectDueNotifications(
  subscription: ScheduledNotificationSubscription,
  catalog: NotificationCatalog,
  now = new Date()
): DueNotification[] {
  if (subscription.disabledAt) return [];
  const products = new Map((catalog.products ?? []).map((product) => [product.slug, product]));
  const due: DueNotification[] = [];

  for (const tracked of subscription.items) {
    const product = products.get(tracked.slug);
    const release = product?.releases.find((item) => item.name === tracked.version);
    if (!product || !release?.eolFrom) continue;

    const days = daysUntilDate(release.eolFrom, now);
    const threshold = thresholdForDays(days, subscription.thresholds);
    if (days === null || threshold === null) continue;

    const deliveryKey = notificationDeliveryKey(tracked.slug, tracked.version, release.eolFrom, threshold);
    if (subscription.sent[deliveryKey]) continue;

    due.push({
      slug: tracked.slug,
      label: product.label,
      version: tracked.version,
      eolFrom: release.eolFrom,
      days,
      threshold,
      deliveryKey
    });
  }

  return due.sort((a, b) => a.days - b.days || a.label.localeCompare(b.label, 'ja'));
}

function formatJapaneseDate(value: string): string {
  const date = parseDateOnly(value);
  if (!date) return value;
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export function buildNotificationText(items: DueNotification[], siteOrigin = 'https://eol.slothwright.com'): string {
  const lines = ['EOL情報.jp — 利用中バージョンのEOLリマインダー', ''];
  for (const item of items) {
    const remaining = item.days === 0 ? '本日EOL' : `EOLまであと${item.days}日`;
    lines.push(`• ${item.label} ${item.version} — ${remaining}（${formatJapaneseDate(item.eolFrom)}）`);
    lines.push(`  ${siteOrigin}/eol/${encodeURIComponent(item.slug)}/`);
  }
  lines.push('', '移行前に公式ドキュメント、互換性、依存関係を確認してください。');
  return lines.join('\n');
}

export function webhookPayload(channel: NotificationChannel, text: string): Record<string, unknown> {
  if (channel === 'discord') {
    return { content: text, allowed_mentions: { parse: [] } };
  }
  return { text };
}
