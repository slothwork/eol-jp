import { formatJaDate, relativeEol } from '@/lib/date';
import { getCategoryLabel, products } from '@/lib/eol';
import { collectLatestReleaseEntries } from '@/lib/latest-releases';

export const prerender = true;

function externalLatestLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const entries = collectLatestReleaseEntries(products)
    .filter((entry) => entry.ageDays <= 365)
    .map((entry) => ({
      productSlug: entry.productSlug,
      productLabel: entry.productLabel,
      category: entry.category,
      categoryLabel: getCategoryLabel(entry.category),
      cycle: entry.cycle,
      isLts: entry.isLts,
      eolFrom: entry.eolFrom,
      eolDisplay: formatJaDate(entry.eolFrom),
      relativeEol: relativeEol(entry.eolFrom),
      latestName: entry.latestName,
      latestDate: entry.latestDate,
      latestDateDisplay: formatJaDate(entry.latestDate),
      latestLink: externalLatestLink(entry.latestLink),
      ageDays: entry.ageDays
    }));

  return new Response(JSON.stringify({
    schemaVersion: 2,
    maxAgeDays: 365,
    entries
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
