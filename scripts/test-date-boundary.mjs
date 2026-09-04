import assert from 'node:assert/strict';
import { daysUntil, relativeEol, todayJapan, todayUtc } from '../src/lib/date.ts';

const DAY = 86_400_000;
const baseDateEpoch = Date.UTC(2026, 8, 5);
const dateAtOffset = (days) => new Date(baseDateEpoch + days * DAY).toISOString().slice(0, 10);

{
  const beforeTokyoMidnight = new Date('2026-09-04T14:59:59Z');
  assert.equal(todayUtc(beforeTokyoMidnight).toISOString(), '2026-09-04T00:00:00.000Z');
  assert.equal(todayJapan(beforeTokyoMidnight).toISOString(), '2026-09-04T00:00:00.000Z');
  assert.equal(daysUntil('2026-09-05', beforeTokyoMidnight), 1);
}

{
  const atTokyoMidnight = new Date('2026-09-04T15:00:00Z');
  assert.equal(todayUtc(atTokyoMidnight).toISOString(), '2026-09-04T00:00:00.000Z');
  assert.equal(todayJapan(atTokyoMidnight).toISOString(), '2026-09-05T00:00:00.000Z');
  assert.equal(daysUntil('2026-09-05', atTokyoMidnight), 0);
  assert.equal(daysUntil('2026-09-04', atTokyoMidnight), -1);
  assert.equal(relativeEol('2026-09-05', atTokyoMidnight), '本日EOL');
  assert.equal(relativeEol('2026-09-04', atTokyoMidnight), '1日前にEOL');
}

{
  const now = new Date('2026-09-05T03:00:00Z');
  for (const days of [0, 30, 31, 90, 91, 180, 181]) {
    assert.equal(daysUntil(dateAtOffset(days), now), days);
  }
}

console.log('JST date boundary tests passed.');
