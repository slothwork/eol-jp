import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeAttentionRanking, hasMeaningfulRankingChange } from './attention-ranking-utils.mjs';

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
if (!/^[a-f0-9]{32}$/i.test(accountId)) {
  throw new Error('CLOUDFLARE_ACCOUNT_ID must be a 32-character hexadecimal account ID.');
}

const snapshotPath = resolve('src/data/eol-snapshot.json');
const outputPath = resolve('src/data/eol-attention-ranking.json');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));

let currentOutput = null;
try {
  currentOutput = JSON.parse(await readFile(outputPath, 'utf8'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

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
query AttentionRanking($start: Time, $end: Time) {
  viewer {
    accounts(filter: { accountTag: "${accountId}" }) {
      pages: rumPageloadEventsAdaptiveGroups(
        limit: 1000
        orderBy: [count_DESC]
        filter: {
          datetime_geq: $start
          datetime_leq: $end
          requestHost: "${HOSTNAME}"
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

const { items, stats, observed } = analyzeAttentionRanking(payload, eligibleSlugs, { limit: 1000, topN: TOP_N });
console.log('Attention ranking diagnostics: ' + JSON.stringify(stats));
if (!observed) {
  throw new Error('No observed page views for this hostname and period. Cannot distinguish no traffic from unavailable measurement; keeping the previous snapshot.');
}
if (items.length === 0) {
  console.log('Observed page views exist, but no eligible product has positive page views. A zero-item ranking is valid for the returned data.');
}

const output = {
  generatedAt: periodEnd,
  periodStart,
  periodEnd,
  windowDays: WINDOW_DAYS,
  scopeDays: SCOPE_DAYS,
  source: 'cloudflare-web-analytics',
  items
};

if (!hasMeaningfulRankingChange(currentOutput, output)) {
  console.log('Attention ranking is unchanged; keeping the existing snapshot timestamps.');
} else {
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${items.length} attention ranking items to ${outputPath}`);
}
