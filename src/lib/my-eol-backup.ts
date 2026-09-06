import type { EolReminderState, ReminderThreshold } from './eol-reminders.ts';
import type { TrackedProductsState } from './tracked-products.ts';

export const MY_EOL_BACKUP_FORMAT = 'eol-jp-my-eol-backup';
export const MY_EOL_BACKUP_SCHEMA_VERSION = 1;
export const MAX_MY_EOL_BACKUP_FILE_BYTES = 256 * 1024;
export const MAX_MY_EOL_BACKUP_PRODUCTS = 1000;
export const MAX_MY_EOL_BACKUP_ACKNOWLEDGEMENTS = 5000;

const ALLOWED_THRESHOLDS: ReminderThreshold[] = [30, 90, 180];

export type MyEolBackup = {
  format: typeof MY_EOL_BACKUP_FORMAT;
  schemaVersion: typeof MY_EOL_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  trackedProducts: TrackedProductsState;
  reminders: EolReminderState;
};

export type MyEolBackupParseResult =
  | { ok: true; value: MyEolBackup }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function parseTrackedProducts(value: unknown): TrackedProductsState | null {
  if (!isPlainObject(value) || value.schemaVersion !== 1 || !isPlainObject(value.products)) return null;

  const entries = Object.entries(value.products);
  if (entries.length > MAX_MY_EOL_BACKUP_PRODUCTS) return null;

  const products: TrackedProductsState['products'] = {};
  for (const [slug, entry] of entries) {
    if (!slug || slug !== slug.trim() || slug.length > 200 || !isPlainObject(entry)) return null;

    const version = typeof entry.version === 'string' ? entry.version.trim() : '';
    if (!version || version.length > 200 || !isValidDate(entry.savedAt)) return null;

    products[slug] = {
      version,
      savedAt: entry.savedAt
    };
  }

  return { schemaVersion: 1, products };
}

function parseReminders(value: unknown): EolReminderState | null {
  if (!isPlainObject(value) || value.schemaVersion !== 1 || !Array.isArray(value.thresholds) || !isPlainObject(value.acknowledged)) {
    return null;
  }

  const thresholdSet = new Set<ReminderThreshold>();
  for (const raw of value.thresholds) {
    if (raw !== 30 && raw !== 90 && raw !== 180) return null;
    if (thresholdSet.has(raw)) return null;
    thresholdSet.add(raw);
  }

  const acknowledgementEntries = Object.entries(value.acknowledged);
  if (acknowledgementEntries.length > MAX_MY_EOL_BACKUP_ACKNOWLEDGEMENTS) return null;

  const acknowledged: Record<string, string> = {};
  for (const [key, acknowledgedAt] of acknowledgementEntries) {
    if (!key || key.length > 500 || !isValidDate(acknowledgedAt)) return null;
    acknowledged[key] = acknowledgedAt;
  }

  return {
    schemaVersion: 1,
    thresholds: ALLOWED_THRESHOLDS.filter((threshold) => thresholdSet.has(threshold)),
    acknowledged
  };
}

export function createMyEolBackup(
  trackedProducts: TrackedProductsState,
  reminders: EolReminderState,
  exportedAt = new Date().toISOString()
): MyEolBackup {
  return {
    format: MY_EOL_BACKUP_FORMAT,
    schemaVersion: MY_EOL_BACKUP_SCHEMA_VERSION,
    exportedAt,
    trackedProducts: {
      schemaVersion: 1,
      products: Object.fromEntries(
        Object.entries(trackedProducts.products).map(([slug, entry]) => [slug, { ...entry }])
      )
    },
    reminders: {
      schemaVersion: 1,
      thresholds: [...reminders.thresholds],
      acknowledged: { ...reminders.acknowledged }
    }
  };
}

export function serializeMyEolBackup(backup: MyEolBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function parseMyEolBackup(raw: string): MyEolBackupParseResult {
  if (new TextEncoder().encode(raw).byteLength > MAX_MY_EOL_BACKUP_FILE_BYTES) {
    return { ok: false, error: 'バックアップファイルが大きすぎます。' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'JSONとして読み込めないバックアップファイルです。' };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'バックアップファイルの形式が正しくありません。' };
  }

  if (parsed.format !== MY_EOL_BACKUP_FORMAT || parsed.schemaVersion !== MY_EOL_BACKUP_SCHEMA_VERSION) {
    return { ok: false, error: 'このバージョンでは対応していないバックアップ形式です。' };
  }

  if (!isValidDate(parsed.exportedAt)) {
    return { ok: false, error: 'バックアップ作成日時が正しくありません。' };
  }

  const trackedProducts = parseTrackedProducts(parsed.trackedProducts);
  if (!trackedProducts) {
    return { ok: false, error: '利用中製品データが正しくありません。' };
  }

  const reminders = parseReminders(parsed.reminders);
  if (!reminders) {
    return { ok: false, error: 'リマインダー設定が正しくありません。' };
  }

  return {
    ok: true,
    value: {
      format: MY_EOL_BACKUP_FORMAT,
      schemaVersion: MY_EOL_BACKUP_SCHEMA_VERSION,
      exportedAt: parsed.exportedAt,
      trackedProducts,
      reminders
    }
  };
}
