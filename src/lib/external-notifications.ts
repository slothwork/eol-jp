import type { EolReminderState, ReminderThreshold } from './eol-reminders';
import type { TrackedProductsState } from './tracked-products';

export const EXTERNAL_NOTIFICATION_STORAGE_KEY = 'eol-jp:external-notifications:v1';
export const MAX_EXTERNAL_NOTIFICATION_ITEMS = 25;

export type ExternalNotificationChannel = 'slack' | 'discord';

export type ExternalNotificationPayload = {
  items: Array<{ slug: string; version: string }>;
  thresholds: ReminderThreshold[];
};

export type ExternalNotificationSubscription = {
  id: string;
  token: string;
  channel: ExternalNotificationChannel;
  syncedFingerprint: string;
  syncedAt: string;
};

export type ExternalNotificationState = {
  schemaVersion: 1;
  subscription: ExternalNotificationSubscription | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function emptyExternalNotificationState(): ExternalNotificationState {
  return { schemaVersion: 1, subscription: null };
}

export function parseExternalNotificationState(raw: string | null): ExternalNotificationState {
  if (!raw) return emptyExternalNotificationState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || parsed.schemaVersion !== 1) return emptyExternalNotificationState();
    if (parsed.subscription === null) return emptyExternalNotificationState();
    if (!isPlainObject(parsed.subscription)) return emptyExternalNotificationState();

    const { id, token, channel, syncedFingerprint, syncedAt } = parsed.subscription;
    if (
      typeof id !== 'string' || !id ||
      typeof token !== 'string' || !token ||
      (channel !== 'slack' && channel !== 'discord') ||
      typeof syncedFingerprint !== 'string' || !syncedFingerprint ||
      typeof syncedAt !== 'string' || Number.isNaN(Date.parse(syncedAt))
    ) {
      return emptyExternalNotificationState();
    }

    return {
      schemaVersion: 1,
      subscription: { id, token, channel, syncedFingerprint, syncedAt }
    };
  } catch {
    return emptyExternalNotificationState();
  }
}

export function serializeExternalNotificationState(state: ExternalNotificationState): string {
  return JSON.stringify(state);
}

export function buildExternalNotificationPayload(
  tracked: TrackedProductsState,
  reminders: EolReminderState
): ExternalNotificationPayload {
  const items = Object.entries(tracked.products)
    .map(([slug, value]) => ({ slug, version: value.version }))
    .sort((a, b) => a.slug.localeCompare(b.slug) || a.version.localeCompare(b.version));

  const thresholds = ([180, 90, 30] as ReminderThreshold[])
    .filter((threshold) => reminders.thresholds.includes(threshold));

  return { items, thresholds };
}

export function externalNotificationPayloadFingerprint(payload: ExternalNotificationPayload): string {
  return JSON.stringify(payload);
}

export function setExternalNotificationSubscription(
  state: ExternalNotificationState,
  subscription: Omit<ExternalNotificationSubscription, 'syncedFingerprint' | 'syncedAt'>,
  payload: ExternalNotificationPayload,
  syncedAt = new Date().toISOString()
): ExternalNotificationState {
  return {
    ...state,
    subscription: {
      ...subscription,
      syncedFingerprint: externalNotificationPayloadFingerprint(payload),
      syncedAt
    }
  };
}

export function markExternalNotificationSynced(
  state: ExternalNotificationState,
  payload: ExternalNotificationPayload,
  syncedAt = new Date().toISOString()
): ExternalNotificationState {
  if (!state.subscription) return state;
  return {
    ...state,
    subscription: {
      ...state.subscription,
      syncedFingerprint: externalNotificationPayloadFingerprint(payload),
      syncedAt
    }
  };
}

export function clearExternalNotificationSubscription(): ExternalNotificationState {
  return emptyExternalNotificationState();
}

export function externalNotificationNeedsSync(
  state: ExternalNotificationState,
  payload: ExternalNotificationPayload
): boolean {
  if (!state.subscription) return false;
  return state.subscription.syncedFingerprint !== externalNotificationPayloadFingerprint(payload);
}
