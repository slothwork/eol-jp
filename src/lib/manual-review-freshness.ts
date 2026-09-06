const DAY_MS = 24 * 60 * 60 * 1000;

export const MANUAL_REVIEW_WARNING_DAYS = 180;
export const MANUAL_REVIEW_FAILURE_DAYS = 365;
export const MANUAL_REVIEW_MAX_FUTURE_DAYS = 1;

export type ManualReviewFreshnessStatus = 'fresh' | 'warning' | 'overdue' | 'invalid';

export type ManualReviewRecord = {
  id: string;
  group: string;
  label: string;
  checkedAt: string | null | undefined;
};

export type ManualReviewFreshness = {
  record: ManualReviewRecord;
  status: ManualReviewFreshnessStatus;
  ageDays: number | null;
  reason?: string;
};

function parseDateOnly(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const parsed = new Date(utc);
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return null;
  return utc;
}

function utcDay(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function evaluateManualReviewDate(
  record: ManualReviewRecord,
  now: Date = new Date()
): ManualReviewFreshness {
  const value = typeof record.checkedAt === 'string' ? record.checkedAt : '';
  const checkedAtMs = parseDateOnly(value);
  if (checkedAtMs === null) {
    return { record, status: 'invalid', ageDays: null, reason: 'checkedAt must be a valid YYYY-MM-DD date' };
  }

  const ageDays = Math.floor((utcDay(now) - checkedAtMs) / DAY_MS);
  if (ageDays < -MANUAL_REVIEW_MAX_FUTURE_DAYS) {
    return { record, status: 'invalid', ageDays, reason: 'checkedAt is too far in the future' };
  }
  if (ageDays >= MANUAL_REVIEW_FAILURE_DAYS) {
    return { record, status: 'overdue', ageDays, reason: `review is ${ageDays} days old` };
  }
  if (ageDays >= MANUAL_REVIEW_WARNING_DAYS) {
    return { record, status: 'warning', ageDays, reason: `review is ${ageDays} days old` };
  }
  return { record, status: 'fresh', ageDays: Math.max(ageDays, 0) };
}

export function evaluateManualReviewRecords(
  records: ManualReviewRecord[],
  now: Date = new Date()
) {
  const results = records.map((record) => evaluateManualReviewDate(record, now));
  return {
    results,
    fresh: results.filter((result) => result.status === 'fresh'),
    warnings: results.filter((result) => result.status === 'warning'),
    failures: results.filter((result) => result.status === 'overdue' || result.status === 'invalid')
  };
}
