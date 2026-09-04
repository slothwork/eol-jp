export const EOL_REMINDER_STORAGE_KEY = 'eol-jp:reminders:v1';

export type ReminderThreshold = 30 | 90 | 180;

export type EolReminderState = {
  schemaVersion: 1;
  thresholds: ReminderThreshold[];
  acknowledged: Record<string, string>;
};

const ALLOWED_THRESHOLDS: ReminderThreshold[] = [30, 90, 180];

export function defaultEolReminderState(): EolReminderState {
  return {
    schemaVersion: 1,
    thresholds: [30, 90, 180],
    acknowledged: {}
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeThresholds(value: unknown): ReminderThreshold[] {
  if (!Array.isArray(value)) return defaultEolReminderState().thresholds;

  const thresholds = ALLOWED_THRESHOLDS.filter((threshold) => value.includes(threshold));
  return thresholds;
}

export function parseEolReminderState(raw: string | null): EolReminderState {
  if (!raw) return defaultEolReminderState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || parsed.schemaVersion !== 1) {
      return defaultEolReminderState();
    }

    const acknowledged: Record<string, string> = {};
    if (isPlainObject(parsed.acknowledged)) {
      for (const [key, value] of Object.entries(parsed.acknowledged)) {
        if (!key || typeof value !== 'string' || Number.isNaN(Date.parse(value))) continue;
        acknowledged[key] = value;
      }
    }

    return {
      schemaVersion: 1,
      thresholds: normalizeThresholds(parsed.thresholds),
      acknowledged
    };
  } catch {
    return defaultEolReminderState();
  }
}

export function serializeEolReminderState(state: EolReminderState): string {
  return JSON.stringify(state);
}

export function setReminderThresholdEnabled(
  state: EolReminderState,
  threshold: ReminderThreshold,
  enabled: boolean
): EolReminderState {
  const next = new Set(state.thresholds);
  if (enabled) next.add(threshold);
  else next.delete(threshold);

  return {
    ...state,
    thresholds: ALLOWED_THRESHOLDS.filter((value) => next.has(value))
  };
}

export function reminderThresholdForDays(
  daysUntilEol: number | null,
  thresholds: ReminderThreshold[]
): ReminderThreshold | null {
  if (daysUntilEol === null || daysUntilEol < 0) return null;

  const reached = thresholds
    .filter((threshold) => daysUntilEol <= threshold)
    .sort((a, b) => a - b);

  return reached[0] ?? null;
}

export function reminderAcknowledgementKey(
  slug: string,
  version: string,
  eolFrom: string,
  threshold: ReminderThreshold
): string {
  return `${encodeURIComponent(slug)}|${encodeURIComponent(version)}|${eolFrom}|${threshold}`;
}

export function acknowledgeReminder(
  state: EolReminderState,
  key: string,
  acknowledgedAt = new Date().toISOString()
): EolReminderState {
  return {
    ...state,
    acknowledged: {
      ...state.acknowledged,
      [key]: acknowledgedAt
    }
  };
}

export function isReminderAcknowledged(state: EolReminderState, key: string): boolean {
  return Boolean(state.acknowledged[key]);
}
