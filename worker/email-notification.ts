import {
  buildNotificationText,
  type DueNotification,
  type NotificationThreshold,
  type NotificationTrackedItem,
  type ScheduledNotificationSubscription
} from './notification-core.ts';

export const EMAIL_DAILY_SEND_LIMIT = 80;
export const EMAIL_VERIFY_TTL_SECONDS = 15 * 60;
export const EMAIL_VERIFY_COOLDOWN_SECONDS = 10 * 60;
export const EMAIL_VERIFY_DAILY_PER_ADDRESS = 3;
export const EMAIL_VERIFY_MAX_ATTEMPTS = 5;

export type EmailNotificationSubscription = ScheduledNotificationSubscription & {
  schemaVersion: 1;
  id: string;
  channel: 'email';
  email: string;
  tokenHash: string;
  unsubscribeToken: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
};

export type PendingEmailVerification = {
  schemaVersion: 1;
  id: string;
  email: string;
  codeHash: string;
  attempts: number;
  items: NotificationTrackedItem[];
  thresholds: NotificationThreshold[];
  createdAt: string;
  expiresAt: string;
};

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export function isVerificationCode(value: unknown): value is string {
  return typeof value === 'string' && /^\d{6}$/.test(value.trim());
}

export function emailSubscriptionKey(id: string): string {
  return `email-subscription:${id}`;
}

export function emailPendingKey(id: string): string {
  return `email-pending:${id}`;
}

export function emailDailyQuotaKey(now = new Date()): string {
  const day = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return `email-quota:${day}`;
}

export function emailVerificationRateKey(emailHash: string, now = new Date()): string {
  const day = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return `email-verify-rate:${day}:${emailHash}`;
}

export function emailVerificationCooldownKey(emailHash: string): string {
  return `email-verify-cooldown:${emailHash}`;
}

export function buildVerificationEmailText(code: string): string {
  return [
    'EOL情報.jp — メール通知の確認コード',
    '',
    `確認コード: ${code}`,
    '',
    'このコードは15分間有効です。',
    'この操作に心当たりがない場合は、このメールを無視してください。'
  ].join('\n');
}

export function reminderEmailSubject(items: DueNotification[]): string {
  if (items.length === 1) {
    return `【EOL情報.jp】${items[0].label} ${items[0].version} のEOL期限のお知らせ`;
  }
  return `【EOL情報.jp】利用中バージョン ${items.length}件のEOL期限のお知らせ`;
}

export function buildReminderEmailText(
  items: DueNotification[],
  unsubscribeUrl: string,
  siteOrigin = 'https://eol.slothwright.com'
): string {
  return [
    buildNotificationText(items, siteOrigin),
    '',
    'メール通知を解除する:',
    unsubscribeUrl
  ].join('\n');
}
