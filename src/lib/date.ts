const DAY = 86_400_000;

export function parseDateOnly(value?: string | null): Date | null {
  if (!value || typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function daysUntil(value?: string | null, now = todayUtc()): number | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  return Math.round((date.getTime() - now.getTime()) / DAY);
}

export function formatJaDate(value?: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return '未定';
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export function relativeEol(value?: string | null): string {
  const days = daysUntil(value);
  if (days === null) return '期限未定';
  if (days < 0) return `${Math.abs(days).toLocaleString('ja-JP')}日前にEOL`;
  if (days === 0) return '本日EOL';
  return `EOLまであと${days.toLocaleString('ja-JP')}日`;
}
