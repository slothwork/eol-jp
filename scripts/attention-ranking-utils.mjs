export function hasMeaningfulRankingChange(current, next) {
  if (!current) return true;

  if (
    current.windowDays !== next.windowDays ||
    current.scopeDays !== next.scopeDays ||
    current.source !== next.source
  ) {
    return true;
  }

  const currentItems = Array.isArray(current.items) ? current.items : [];
  const nextItems = Array.isArray(next.items) ? next.items : [];

  if (currentItems.length !== nextItems.length) return true;

  return nextItems.some((item, index) => {
    const previous = currentItems[index];
    return !previous || previous.slug !== item.slug || previous.pageViews !== item.pageViews;
  });
}

/**
 * API応答の欠落・集計上限・観測データなしと、正常な対象製品0件を区別する。
 * 生のアクセスパス、アカウント情報等はログに出さない。
 */
export function analyzeAttentionRanking(payload, eligibleSlugs, { limit = 1000, topN = 10 } = {}) {
  if (!payload || !Array.isArray(payload.errors ?? []) || payload.errors?.length) {
    throw new Error('Cloudflare GraphQL returned errors or an invalid response.');
  }
  const accounts = payload.data?.viewer?.accounts;
  if (!Array.isArray(accounts) || accounts.length !== 1 || !Array.isArray(accounts[0]?.pages)) {
    throw new Error('Cloudflare Analytics response is missing the expected account or pages array.');
  }
  const groups = accounts[0].pages;
  if (groups.length >= limit) {
    throw new Error('Cloudflare Analytics group limit reached; ranking completeness is not confirmed.');
  }
  const viewsBySlug = new Map();
  const stats = {
    eligibleProducts: eligibleSlugs.size,
    groups: groups.length,
    totalObservedPageViews: 0,
    productPathGroups: 0,
    eligiblePathGroups: 0,
    eligiblePageViews: 0
  };
  for (const group of groups) {
    const path = group?.dimensions?.requestPath;
    const count = group?.count;
    if (typeof path !== 'string' || !path.startsWith('/') ||
        !Number.isSafeInteger(count) || count < 0) {
      throw new Error('Cloudflare Analytics returned an invalid requestPath or count.');
    }
    stats.totalObservedPageViews += count;
    const match = path.match(/^\/eol\/([^/]+)\/?$/);
    if (!match) continue;
    stats.productPathGroups++;
    if (!eligibleSlugs.has(match[1])) continue;
    stats.eligiblePathGroups++;
    stats.eligiblePageViews += count;
    if (count > 0) viewsBySlug.set(match[1], (viewsBySlug.get(match[1]) ?? 0) + count);
  }
  const items = [...viewsBySlug.entries()]
    .map(([slug, pageViews]) => ({ slug, pageViews }))
    .sort((a, b) => b.pageViews - a.pageViews || a.slug.localeCompare(b.slug))
    .slice(0, topN);
  return { items, stats, observed: stats.totalObservedPageViews > 0 };
}
