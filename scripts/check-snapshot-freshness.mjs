import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  SNAPSHOT_FRESHNESS_CRITICAL_HOURS,
  SNAPSHOT_FRESHNESS_WARNING_HOURS,
  getSnapshotFreshness,
  snapshotFreshnessMessage
} from '../src/lib/snapshot-freshness.ts';

const snapshotPath = path.resolve('src/data/eol-snapshot.json');

function envHours(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
  return value;
}

async function main() {
  const warningHours = envHours('SNAPSHOT_FRESHNESS_WARNING_HOURS', SNAPSHOT_FRESHNESS_WARNING_HOURS);
  const criticalHours = envHours('SNAPSHOT_FRESHNESS_CRITICAL_HOURS', SNAPSHOT_FRESHNESS_CRITICAL_HOURS);
  const raw = await fs.readFile(snapshotPath, 'utf8');
  const snapshot = JSON.parse(raw);
  const generatedAt = typeof snapshot.generatedAt === 'string' ? snapshot.generatedAt : '';
  const freshness = getSnapshotFreshness(generatedAt, new Date(), warningHours, criticalHours);
  const ageLabel = freshness.ageHours === null ? 'unknown' : `${freshness.ageHours.toFixed(1)}h`;

  console.log(`Snapshot generatedAt: ${generatedAt || '(missing)'}`);
  console.log(`Snapshot age: ${ageLabel}`);
  console.log(`Freshness thresholds: warning=${warningHours}h critical=${criticalHours}h`);

  if (freshness.status === 'warning') {
    console.log(`::warning title=EOL snapshot freshness::${snapshotFreshnessMessage(freshness)}`);
    return;
  }

  if (freshness.status === 'critical' || freshness.status === 'invalid') {
    console.error(`::error title=EOL snapshot freshness::${snapshotFreshnessMessage(freshness)}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
