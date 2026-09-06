export const SNAPSHOT_FRESHNESS_WARNING_HOURS = 72;
export const SNAPSHOT_FRESHNESS_CRITICAL_HOURS = 168;
export const SNAPSHOT_FRESHNESS_MAX_FUTURE_SKEW_HOURS = 6;

export type SnapshotFreshnessStatus = 'fresh' | 'warning' | 'critical' | 'invalid';

export type SnapshotFreshness = {
  status: SnapshotFreshnessStatus;
  ageHours: number | null;
  generatedAt: string;
  warningHours: number;
  criticalHours: number;
};

function validateThresholds(warningHours: number, criticalHours: number): void {
  if (!Number.isFinite(warningHours) || warningHours < 0) {
    throw new Error('warningHours must be a non-negative finite number');
  }
  if (!Number.isFinite(criticalHours) || criticalHours <= warningHours) {
    throw new Error('criticalHours must be a finite number greater than warningHours');
  }
}

export function snapshotAgeHours(generatedAt: string, now = new Date()): number | null {
  const generatedAtMs = Date.parse(generatedAt);
  const nowMs = now.getTime();
  if (!Number.isFinite(generatedAtMs) || !Number.isFinite(nowMs)) return null;

  const ageHours = (nowMs - generatedAtMs) / 3_600_000;
  if (ageHours < -SNAPSHOT_FRESHNESS_MAX_FUTURE_SKEW_HOURS) return null;
  return Math.max(0, ageHours);
}

export function getSnapshotFreshness(
  generatedAt: string,
  now = new Date(),
  warningHours = SNAPSHOT_FRESHNESS_WARNING_HOURS,
  criticalHours = SNAPSHOT_FRESHNESS_CRITICAL_HOURS
): SnapshotFreshness {
  validateThresholds(warningHours, criticalHours);
  const ageHours = snapshotAgeHours(generatedAt, now);

  if (ageHours === null) {
    return {
      status: 'invalid',
      ageHours: null,
      generatedAt,
      warningHours,
      criticalHours
    };
  }

  const status: SnapshotFreshnessStatus = ageHours >= criticalHours
    ? 'critical'
    : ageHours >= warningHours
      ? 'warning'
      : 'fresh';

  return {
    status,
    ageHours,
    generatedAt,
    warningHours,
    criticalHours
  };
}

export function snapshotFreshnessMessage(freshness: SnapshotFreshness): string {
  if (freshness.status === 'invalid' || freshness.ageHours === null) {
    return 'EOLデータの更新時刻を確認できません。表示内容は公式のサポート情報でも確認してください。';
  }

  const days = Math.max(1, Math.floor(freshness.ageHours / 24));
  if (freshness.status === 'critical') {
    return `EOLデータの更新時刻から約${days}日経過しています。表示内容が古い可能性があるため、重要な判断では公式情報も確認してください。`;
  }
  if (freshness.status === 'warning') {
    return `EOLデータの更新時刻から約${days}日経過しています。最新情報が必要な場合は公式情報も確認してください。`;
  }
  return 'EOLデータは所定の鮮度範囲内です。';
}
