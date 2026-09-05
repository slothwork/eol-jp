import { createHash } from 'node:crypto';

const DEFAULT_STARTED_AT = '2026-09-05';

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])])
    );
  }
  return value;
}

function canonicalProducts(products) {
  return (Array.isArray(products) ? products : [])
    .map((product) => ({
      ...product,
      releases: [...(product.releases ?? [])].sort((a, b) => String(a.name).localeCompare(String(b.name)))
    }))
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
}

export function hashProducts(products) {
  const canonical = JSON.stringify(stableValue(canonicalProducts(products)));
  return createHash('sha256').update(canonical).digest('hex');
}

export function emptyAuditLog() {
  return {
    schemaVersion: '1',
    startedAt: DEFAULT_STARTED_AT,
    updatedAt: null,
    entries: []
  };
}

export function normalizeAuditLog(value) {
  if (!value || !Array.isArray(value.entries)) return emptyAuditLog();
  return {
    schemaVersion: '1',
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : DEFAULT_STARTED_AT,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    entries: value.entries
  };
}

export function summarizeChanges(changes) {
  const summary = {
    total: 0,
    releaseAdded: 0,
    eolChanged: 0,
    supportChanged: 0,
    latestChanged: 0
  };
  const affectedProducts = new Map();

  for (const change of changes ?? []) {
    summary.total += 1;
    if (change.type === 'release-added') summary.releaseAdded += 1;
    if (change.type === 'eol-changed') summary.eolChanged += 1;
    if (change.type === 'support-changed') summary.supportChanged += 1;
    if (change.type === 'latest-changed') summary.latestChanged += 1;
    if (change.product) affectedProducts.set(change.product, change.label ?? change.product);
  }

  return {
    summary,
    affectedProducts: [...affectedProducts.entries()]
      .map(([slug, label]) => ({ slug, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ja'))
  };
}

export function createAuditEntry({ previous, next, changes, syncedAt, sourceGeneratedAt, sourceUrl }) {
  if (!previous?.products || !next?.products) return null;

  const beforeSha256 = hashProducts(previous.products);
  const afterSha256 = hashProducts(next.products);
  if (beforeSha256 === afterSha256) return null;

  const { summary, affectedProducts } = summarizeChanges(changes);
  const releaseCount = next.products.reduce((total, product) => total + (product.releases?.length ?? 0), 0);

  return {
    id: `${syncedAt}-${afterSha256.slice(0, 12)}`,
    syncedAt,
    sourceGeneratedAt,
    sourceUrl,
    beforeSha256,
    afterSha256,
    productCount: next.products.length,
    releaseCount,
    changes: summary,
    affectedProducts
  };
}

export function appendAuditEntry(log, entry) {
  const normalized = normalizeAuditLog(log);
  if (!entry || normalized.entries.some((item) => item.id === entry.id)) return normalized;
  return {
    ...normalized,
    updatedAt: entry.syncedAt,
    entries: [...normalized.entries, entry]
  };
}
