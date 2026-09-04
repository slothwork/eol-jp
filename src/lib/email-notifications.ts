import type { EolReminderState, ReminderThreshold } from './eol-reminders.ts';
import type { TrackedProductsState } from './tracked-products.ts';

export const EMAIL_NOTIFICATION_STORAGE_KEY = 'eol-jp:email-notifications:v1';
export const MAX_EMAIL_NOTIFICATION_ITEMS = 25;

export type EmailNotificationPayload = {
  items: Array<{ slug: string; version: string }>;
  thresholds: ReminderThreshold[];
};

export type EmailNotificationSubscription = {
  id: string;
  token: string;
  emailMasked: string;
  syncedFingerprint: string;
  syncedAt: string;
};

export type EmailNotificationState = {
  schemaVersion: 1;
  subscription: EmailNotificationSubscription | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function emptyEmailNotificationState(): EmailNotificationState {
  return { schemaVersion: 1, subscription: null };
}

export function parseEmailNotificationState(raw: string | null): EmailNotificationState {
  if (!raw) return emptyEmailNotificationState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || parsed.schemaVersion !== 1) return emptyEmailNotificationState();
    if (parsed.subscription === null) return emptyEmailNotificationState();
    if (!isPlainObject(parsed.subscription)) return emptyEmailNotificationState();
    const { id, token, emailMasked, syncedFingerprint, syncedAt } = parsed.subscription;
    if (
      typeof id !== 'string' || !id ||
      typeof token !== 'string' || !token ||
      typeof emailMasked !== 'string' || !emailMasked ||
      typeof syncedFingerprint !== 'string' || !syncedFingerprint ||
      typeof syncedAt !== 'string' || Number.isNaN(Date.parse(syncedAt))
    ) {
      return emptyEmailNotificationState();
    }
    return {
      schemaVersion: 1,
      subscription: { id, token, emailMasked, syncedFingerprint, syncedAt }
    };
  } catch {
    return emptyEmailNotificationState();
  }
}

export function serializeEmailNotificationState(state: EmailNotificationState): string {
  return JSON.stringify(state);
}

export function buildEmailNotificationPayload(
  tracked: TrackedProductsState,
  reminders: EolReminderState
): EmailNotificationPayload {
  const items = Object.entries(tracked.products)
    .map(([slug, value]) => ({ slug, version: value.version }))
    .sort((a, b) => a.slug.localeCompare(b.slug) || a.version.localeCompare(b.version));
  const thresholds = ([180, 90, 30] as ReminderThreshold[])
    .filter((threshold) => reminders.thresholds.includes(threshold));
  return { items, thresholds };
}

export function emailNotificationPayloadFingerprint(payload: EmailNotificationPayload): string {
  return JSON.stringify(payload);
}

export function setEmailNotificationSubscription(
  state: EmailNotificationState,
  subscription: Omit<EmailNotificationSubscription, 'syncedFingerprint' | 'syncedAt'>,
  payload: EmailNotificationPayload,
  syncedAt = new Date().toISOString()
): EmailNotificationState {
  return {
    ...state,
    subscription: {
      ...subscription,
      syncedFingerprint: emailNotificationPayloadFingerprint(payload),
      syncedAt
    }
  };
}

export function markEmailNotificationSynced(
  state: EmailNotificationState,
  payload: EmailNotificationPayload,
  syncedAt = new Date().toISOString()
): EmailNotificationState {
  if (!state.subscription) return state;
  return {
    ...state,
    subscription: {
      ...state.subscription,
      syncedFingerprint: emailNotificationPayloadFingerprint(payload),
      syncedAt
    }
  };
}

export function clearEmailNotificationSubscription(): EmailNotificationState {
  return emptyEmailNotificationState();
}

export function emailNotificationNeedsSync(
  state: EmailNotificationState,
  payload: EmailNotificationPayload
): boolean {
  if (!state.subscription) return false;
  return state.subscription.syncedFingerprint !== emailNotificationPayloadFingerprint(payload);
}
