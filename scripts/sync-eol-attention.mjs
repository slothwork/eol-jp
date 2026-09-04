import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const API_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const HOSTNAME = 'eol.slothwright.com';
const WINDOW_DAYS = 30;
const SCOPE_DAYS = 180;
const TOP_N = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!apiToken || !accountId) {
  throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required.');
}

const snapshotPath = resolve('src/data/eol-snapshot.json');
const outputPath = resolve('src/data/eol-attention-ranking.json');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));

const now = new Date();
const periodEnd = now.toISOString();
const periodStart = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString();
const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

function daysUntil(date) {
  if (!date) return null;
  const target = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(target)) return null;
  return Math.ceil((target - todayUtc) / DAY_MS);
}

const eligibleSlugs = new Set(
  snapshot.products
    .filter((product) => product.releases.some((release) => {
      const days = daysUntil(release.eolFrom);
      return days !== null && days >= 0 && days <= SCOPE_DAYS;
    }))
    .map((product) => product.slug)
);

const query = `
query AttentionRanking($accountTag: string, $start: Time, $end: Time) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      pages: rumPageloadEventsAdaptiveGroups(
        limit: 1000
        orderBy: [count_DESC]
        filter: {
          datetime_geq: $start
          datetime_leq: $end
          requestHost: "${HOSTNAME}"
          requestPath_like: "/eol/%"
        }
      ) {
        count
        dimensions {
          requestPath
        }
      }
    }
  }
}`;

const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query,
    variables: {
      accountTag: accountId,
      start: periodStart,
      end: periodEnd
    }
  })
});

if (!response.ok) {
  throw new Error(`Cloudflare GraphQL request failed: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
if (payload.errors?.length) {
  throw new Error(`Cloudflare GraphQL error: ${payload.errors.map((error) => error.message).join('; ')}`);
}

const groups = payload.data?.viewer?.accounts?.flatMap((account) => account.pages ?? []) ?? [];
const viewsBySlug = new Map();

for (const group of groups) {
  const path = group.dimensions?.requestPath;
  const match = typeof path === 'string' ? path.match(/^\/eol\/([^/]+)\/?$/) : null;
  if (!match) continue;

  const slug = match[1];
  if (!eligibleSlugs.has(slug)) continue;

  const count = Number(group.count ?? 0);
  if (!Number.isFinite(count) || count <= 0) continue;
  viewsBySlug.set(slug, (viewsBySlug.get(slug) ?? 0) + count);
}

const items = [...viewsBySlug.entries()]
  .map(([slug, pageViews]) => ({ slug, pageViews }))
  .sort((a, b) => b.pageViews - a.pageViews || a.slug.localeCompare(b.slug))
  .slice(0, TOP_N);

const output = {
  generatedAt: periodEnd,
  periodStart,
  periodEnd,
  windowDays: WINDOW_DAYS,
  scopeDays: SCOPE_DAYS,
  source: 'cloudflare-web-analytics',
  items
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${items.length} attention ranking items to ${outputPath}`);
