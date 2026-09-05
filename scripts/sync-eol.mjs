import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { appendAuditEntry, createAuditEntry, normalizeAuditLog } from './eol-audit.mjs';

const API_URL = 'https://endoflife.date/api/v1/products/full';
const snapshotPath = path.resolve('src/data/eol-snapshot.json');
const changeLogPath = path.resolve('src/data/change-log.json');
const auditLogPath = path.resolve('src/data/audit-log.json');

const nullableDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
const nullableString = (value) => typeof value === 'string' && value.length > 0 ? value : null;

function normalizeProduct(product) {
  return {
    slug: product.name,
    label: product.label ?? product.name,
    category: product.category ?? 'app',
    versionCommand: nullableString(product.versionCommand),
    links: {
      html: nullableString(product.links?.html),
      releasePolicy: nullableString(product.links?.releasePolicy)
    },
    releases: Array.isArray(product.releases) ? product.releases.map((release) => ({
      name: String(release.name ?? release.label ?? 'unknown'),
      label: nullableString(release.label),
      codename: nullableString(release.codename),
      releaseDate: nullableDate(release.releaseDate),
      isLts: Boolean(release.isLts),
      ltsFrom: nullableDate(release.ltsFrom),
      eoasFrom: nullableDate(release.eoasFrom),
      eolFrom: nullableDate(release.eolFrom),
      isEol: Boolean(release.isEol),
      isMaintained: Boolean(release.isMaintained),
      latest: {
        name: nullableString(release.latest?.name),
        date: nullableDate(release.latest?.date),
        link: nullableString(release.latest?.link)
      }
    })) : []
  };
}

function releaseKey(product, release) {
  return `${product.slug}@@${release.name}`;
}

function productMetadata(product) {
  return JSON.stringify({
    label: product.label,
    category: product.category,
    versionCommand: product.versionCommand ?? null,
    links: product.links ?? {}
  });
}

function releaseMetadata(release) {
  return JSON.stringify({
    label: release.label ?? null,
    codename: release.codename ?? null,
    releaseDate: release.releaseDate ?? null,
    isLts: Boolean(release.isLts),
    ltsFrom: release.ltsFrom ?? null,
    isEol: Boolean(release.isEol),
    isMaintained: Boolean(release.isMaintained)
  });
}

function detectChanges(previous, next) {
  const oldProducts = new Map((previous?.products ?? []).map((product) => [product.slug, product]));
  const oldMap = new Map();
  for (const product of previous?.products ?? []) {
    for (const release of product.releases ?? []) {
      oldMap.set(releaseKey(product, release), { product, release });
    }
  }

  const newKeys = new Set();
  const changes = [];

  for (const product of next.products) {
    const oldProduct = oldProducts.get(product.slug);
    if (oldProduct && productMetadata(oldProduct) !== productMetadata(product)) {
      changes.push({ type: 'product-metadata-changed', product: product.slug, label: product.label, release: '' });
    }

    for (const release of product.releases) {
      const key = releaseKey(product, release);
      newKeys.add(key);
      const oldRecord = oldMap.get(key);
      if (!oldRecord) {
        changes.push({ type: 'release-added', product: product.slug, label: product.label, release: release.name, eolFrom: release.eolFrom });
        continue;
      }

      const old = oldRecord.release;
      if (old.eolFrom !== release.eolFrom) changes.push({ type: 'eol-changed', product: product.slug, label: product.label, release: release.name, from: old.eolFrom, to: release.eolFrom });
      if (old.eoasFrom !== release.eoasFrom) changes.push({ type: 'support-changed', product: product.slug, label: product.label, release: release.name, from: old.eoasFrom, to: release.eoasFrom });
      if (JSON.stringify(old.latest ?? null) !== JSON.stringify(release.latest ?? null)) changes.push({ type: 'latest-changed', product: product.slug, label: product.label, release: release.name, from: old.latest?.name ?? null, to: release.latest?.name ?? null });
      if (releaseMetadata(old) !== releaseMetadata(release)) changes.push({ type: 'release-metadata-changed', product: product.slug, label: product.label, release: release.name });
    }
  }

  for (const [key, oldRecord] of oldMap) {
    if (!newKeys.has(key)) {
      changes.push({
        type: 'release-removed',
        product: oldRecord.product.slug,
        label: oldRecord.product.label,
        release: oldRecord.release.name,
        eolFrom: oldRecord.release.eolFrom ?? null
      });
    }
  }

  return changes;
}

function emptyHistory() {
  return {
    schemaVersion: '2',
    startedAt: '2026-09-04',
    updatedAt: null,
    events: []
  };
}

function normalizeHistory(value) {
  if (value && Array.isArray(value.events)) {
    return {
      schemaVersion: '2',
      startedAt: typeof value.startedAt === 'string' ? value.startedAt : '2026-09-04',
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
      events: value.events
    };
  }
  return emptyHistory();
}

function toHistoryEvents(changes, detectedAt) {
  return changes
    .filter((change) => ['release-added', 'eol-changed', 'support-changed'].includes(change.type))
    .map((change) => ({ detectedAt, ...change }));
}

async function main() {
  let previous = null;
  try { previous = JSON.parse(await fs.readFile(snapshotPath, 'utf8')); } catch {}

  let history = emptyHistory();
  try { history = normalizeHistory(JSON.parse(await fs.readFile(changeLogPath, 'utf8'))); } catch {}

  let auditLog = normalizeAuditLog(null);
  try { auditLog = normalizeAuditLog(JSON.parse(await fs.readFile(auditLogPath, 'utf8'))); } catch {}

  const response = await fetch(API_URL, { headers: { 'User-Agent': 'eol-jp/0.1 (+https://eol.slothwright.com)' } });
  if (!response.ok) throw new Error(`endoflife.date API returned ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.result)) throw new Error('Unexpected API payload: result is not an array');

  const next = {
    schemaVersion: String(payload.schema_version ?? 'unknown'),
    generatedAt: String(payload.generated_at ?? new Date().toISOString()),
    sourceUrl: API_URL,
    products: payload.result.map(normalizeProduct).filter((product) => product.slug && product.releases.length > 0)
  };

  const changes = detectChanges(previous, next);
  const historyEvents = toHistoryEvents(changes, next.generatedAt);

  if (historyEvents.length > 0) {
    history = {
      ...history,
      updatedAt: next.generatedAt,
      events: [...history.events, ...historyEvents]
    };
  }

  const syncedAt = new Date().toISOString();
  const auditEntry = createAuditEntry({
    previous,
    next,
    changes,
    syncedAt,
    sourceGeneratedAt: next.generatedAt,
    sourceUrl: API_URL
  });
  if (auditEntry) auditLog = appendAuditEntry(auditLog, auditEntry);

  await fs.writeFile(snapshotPath, `${JSON.stringify(next, null, 2)}\n`);
  await fs.writeFile(changeLogPath, `${JSON.stringify(history, null, 2)}\n`);
  await fs.writeFile(auditLogPath, `${JSON.stringify(auditLog, null, 2)}\n`);
  console.log(`Synced ${next.products.length} products. Changes: ${changes.length}. History events added: ${historyEvents.length}. Audit entry added: ${auditEntry ? 'yes' : 'no'}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
