import snapshot from '@/data/eol-snapshot.json';
import { categoryLabels, featuredSlugs, productSummaries } from '@/data/product-meta';
import { daysUntil } from '@/lib/date';

export type LatestRelease = {
  name: string | null;
  date: string | null;
  link: string | null;
};

export type Release = {
  name: string;
  label?: string | null;
  codename?: string | null;
  releaseDate: string | null;
  isLts: boolean;
  ltsFrom?: string | null;
  eoasFrom: string | null;
  eolFrom: string | null;
  isEol: boolean;
  isMaintained: boolean;
  latest: LatestRelease;
};

export type Product = {
  slug: string;
  label: string;
  category: string;
  versionCommand?: string | null;
  links: {
    html?: string | null;
    releasePolicy?: string | null;
  };
  releases: Release[];
};

export type EolStatus = 'ended' | 'critical' | 'warning' | 'planning' | 'supported' | 'unknown';

export const products = (snapshot.products as Product[]).slice().sort((a, b) => a.label.localeCompare(b.label, 'ja'));
export const generatedAt = snapshot.generatedAt;
export const sourceUrl = snapshot.sourceUrl;

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] ?? category;
}

export function getProductSummary(product: Product): string {
  return productSummaries[product.slug]
    ?? `${product.label} のバージョン別サポート期限、EOL（End of Life）、最新リリースを日本語で確認できます。`;
}

export function statusFor(release: Release): EolStatus {
  const days = daysUntil(release.eolFrom);
  if (release.isEol || (days !== null && days < 0)) return 'ended';
  if (days === null) return release.isMaintained ? 'supported' : 'unknown';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'warning';
  if (days <= 180) return 'planning';
  return 'supported';
}

export function statusLabel(status: EolStatus): string {
  return {
    ended: 'EOL済み',
    critical: '30日以内',
    warning: '90日以内',
    planning: '180日以内',
    supported: 'サポート中',
    unknown: '期限未定'
  }[status];
}

export function upcomingReleases(maxDays = 365) {
  return products.flatMap((product) => product.releases.map((release) => ({ product, release, days: daysUntil(release.eolFrom) })))
    .filter((item) => item.days !== null && item.days >= 0 && item.days <= maxDays)
    .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity));
}

export function recentlyEnded(daysBack = 180) {
  return products.flatMap((product) => product.releases.map((release) => ({ product, release, days: daysUntil(release.eolFrom) })))
    .filter((item) => item.days !== null && item.days < 0 && item.days >= -daysBack)
    .sort((a, b) => (b.days ?? -Infinity) - (a.days ?? -Infinity));
}

export function featuredProducts() {
  const weight = new Map(featuredSlugs.map((slug, index) => [slug, index]));
  return products
    .filter((product) => weight.has(product.slug))
    .sort((a, b) => (weight.get(a.slug) ?? 999) - (weight.get(b.slug) ?? 999));
}

export function recommendedTarget(product: Product, release: Release): Release | null {
  const candidates = product.releases
    .filter((candidate) => candidate.name !== release.name && statusFor(candidate) !== 'ended')
    .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
  return candidates[0] ?? null;
}
