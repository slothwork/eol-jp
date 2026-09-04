const DAY = 86_400_000;
const JST_OFFSET = 9 * 60 * 60 * 1000;

export function parseDateOnly(value?: string | null): Date | null {
  if (!value || typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function todayUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function todayJapan(now = new Date()): Date {
  const shifted = new Date(now.getTime() + JST_OFFSET);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

export function daysUntil(value?: string | null, now = new Date()): number | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  const today = todayJapan(now);
  return Math.round((date.getTime() - today.getTime()) / DAY);
}

export function formatJaDate(value?: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return '未定';
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export function relativeEol(value?: string | null, now = new Date()): string {
  const days = daysUntil(value, now);
  if (days === null) return '期限未定';
  if (days < 0) return `${Math.abs(days).toLocaleString('ja-JP')}日前にEOL`;
  if (days === 0) return '本日EOL';
  return `EOLまであと${days.toLocaleString('ja-JP')}日`;
}
