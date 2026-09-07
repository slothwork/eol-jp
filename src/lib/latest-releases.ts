import { daysUntil } from './date.ts';

export type LatestReleaseCycle = {
  name: string;
  releaseDate: string | null;
  isLts: boolean;
  eoasFrom?: string | null;
  eolFrom: string | null;
  isEol: boolean;
  isMaintained: boolean;
  latest: {
    name: string | null;
    date: string | null;
    link: string | null;
  };
};

export type LatestReleaseProduct = {
  slug: string;
  label: string;
  category: string;
  releases: LatestReleaseCycle[];
};

export type LatestReleaseEntry = {
  productSlug: string;
  productLabel: string;
  category: string;
  cycle: string;
  cycleReleaseDate: string | null;
  isLts: boolean;
  eolFrom: string | null;
  latestName: string;
  latestDate: string;
  latestLink: string | null;
  ageDays: number;
};

function isSupportedCycle(release: LatestReleaseCycle, now: Date): boolean {
  if (release.isEol) return false;

  const eolDays = daysUntil(release.eolFrom, now);
  if (eolDays !== null) return eolDays >= 0;

  return release.isMaintained;
}

export function collectLatestReleaseEntries(
  products: LatestReleaseProduct[],
  now = new Date()
): LatestReleaseEntry[] {
  const entries: LatestReleaseEntry[] = [];

  for (const product of products) {
    for (const release of product.releases) {
      if (!isSupportedCycle(release, now)) continue;
      if (!release.latest?.name || !release.latest.date) continue;

      const latestDays = daysUntil(release.latest.date, now);
      if (latestDays === null || latestDays > 0) continue;

      entries.push({
        productSlug: product.slug,
        productLabel: product.label,
        category: product.category,
        cycle: release.name,
        cycleReleaseDate: release.releaseDate,
        isLts: release.isLts,
        eolFrom: release.eolFrom,
        latestName: release.latest.name,
        latestDate: release.latest.date,
        latestLink: release.latest.link,
        ageDays: Math.abs(latestDays)
      });
    }
  }

  return entries.sort((a, b) => {
    const byLatestDate = b.latestDate.localeCompare(a.latestDate);
    if (byLatestDate !== 0) return byLatestDate;

    const byProduct = a.productLabel.localeCompare(b.productLabel, 'ja');
    if (byProduct !== 0) return byProduct;

    return (b.cycleReleaseDate ?? '').localeCompare(a.cycleReleaseDate ?? '');
  });
}

export function countLatestReleasesWithin(entries: LatestReleaseEntry[], days: number): number {
  if (!Number.isFinite(days) || days < 0) throw new Error('days must be a non-negative number');
  return entries.filter((entry) => entry.ageDays <= days).length;
}
