export type PublicStatus = 'ended' | 'critical' | 'warning' | 'planning' | 'supported' | 'unknown';

export type PublicCatalog = {
  schemaVersion?: number;
  generatedAt?: string;
  sourceUrl?: string;
  products?: PublicCatalogProduct[];
};

export type PublicCatalogProduct = {
  slug: string;
  label: string;
  category?: string;
  versionCommand?: string | null;
  links?: {
    html?: string | null;
    releasePolicy?: string | null;
  };
  releases: PublicCatalogRelease[];
};

export type PublicCatalogRelease = {
  name: string;
  label?: string | null;
  codename?: string | null;
  releaseDate?: string | null;
  isLts?: boolean;
  ltsFrom?: string | null;
  eoasFrom?: string | null;
  eolFrom?: string | null;
  isEol?: boolean;
  isMaintained?: boolean;
  latest?: {
    name?: string | null;
    date?: string | null;
    link?: string | null;
  };
};

const DAY = 86_400_000;
const JST_OFFSET = 9 * 60 * 60 * 1000;

function parseDateOnly(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function tokyoDateEpoch(now = new Date()): number {
  const shifted = new Date(now.getTime() + JST_OFFSET);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

export function daysUntilEol(value: string | null | undefined, now = new Date()): number | null {
  const target = parseDateOnly(value);
  if (target === null) return null;
  return Math.round((target - tokyoDateEpoch(now)) / DAY);
}

export function statusForDays(days: number | null): PublicStatus {
  if (days === null) return 'unknown';
  if (days < 0) return 'ended';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'warning';
  if (days <= 180) return 'planning';
  return 'supported';
}

export function buildProductIndex(catalog: PublicCatalog) {
  return {
    schemaVersion: 1,
    generatedAt: catalog.generatedAt ?? null,
    sourceUrl: catalog.sourceUrl ?? null,
    products: (catalog.products ?? []).map((product) => ({
      slug: product.slug,
      label: product.label,
      category: product.category ?? null,
      apiUrl: `/api/v1/products/${encodeURIComponent(product.slug)}`,
      pageUrl: `/eol/${encodeURIComponent(product.slug)}/`
    }))
  };
}

export function buildProductPayload(
  catalog: PublicCatalog,
  slug: string,
  version: string | null,
  now = new Date()
) {
  const product = (catalog.products ?? []).find((item) => item.slug === slug);
  if (!product) return null;

  const releases = product.releases
    .filter((release) => version === null || release.name === version)
    .map((release) => {
      const days = daysUntilEol(release.eolFrom, now);
      return {
        ...release,
        eolFrom: release.eolFrom ?? null,
        eoasFrom: release.eoasFrom ?? null,
        releaseDate: release.releaseDate ?? null,
        isLts: Boolean(release.isLts),
        status: statusForDays(days),
        daysUntilEol: days
      };
    });

  if (version !== null && releases.length === 0) return null;

  return {
    schemaVersion: 1,
    generatedAt: catalog.generatedAt ?? null,
    sourceUrl: catalog.sourceUrl ?? null,
    product: {
      slug: product.slug,
      label: product.label,
      category: product.category ?? null,
      versionCommand: product.versionCommand ?? null,
      links: product.links ?? {},
      pageUrl: `/eol/${encodeURIComponent(product.slug)}/`,
      releases
    }
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function textWidth(value: string): number {
  const width = Array.from(value).reduce((sum, char) => sum + (char.codePointAt(0)! > 0xff ? 14 : 7), 0);
  return Math.max(42, Math.min(360, width + 18));
}

function badgeState(status: PublicStatus, days: number | null): { text: string; color: string } {
  if (status === 'unknown') return { text: 'EOL 未定', color: '#6e7781' };
  if (status === 'ended') return { text: 'EOL済み', color: '#6e7781' };
  if (days === 0) return { text: '本日EOL', color: '#d1242f' };
  if (status === 'critical') return { text: `EOL ${days}d`, color: '#d1242f' };
  if (status === 'warning') return { text: `EOL ${days}d`, color: '#b26a00' };
  if (status === 'planning') return { text: `EOL ${days}d`, color: '#8250df' };
  return { text: `EOL ${days}d`, color: '#1a7f37' };
}

export function buildBadgeSvg(
  catalog: PublicCatalog,
  slug: string,
  version: string | null,
  now = new Date()
): { svg: string; found: boolean } {
  const product = (catalog.products ?? []).find((item) => item.slug === slug);
  const release = product && version !== null
    ? product.releases.find((item) => item.name === version) ?? null
    : null;

  const leftText = product
    ? `${product.label}${version ? ` ${version}` : ''}`
    : slug || 'EOL';

  const days = release ? daysUntilEol(release.eolFrom, now) : null;
  const status = release ? statusForDays(days) : 'unknown';
  const right = release
    ? badgeState(status, days)
    : { text: version ? 'version不明' : 'version指定必須', color: '#6e7781' };

  const leftWidth = textWidth(leftText);
  const rightWidth = textWidth(right.text);
  const totalWidth = leftWidth + rightWidth;
  const title = release
    ? `${leftText}: ${right.text}`
    : `${leftText}: ${right.text}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-color="#aaa" stop-opacity=".1"/><stop offset=".9" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
<clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)"><rect width="${leftWidth}" height="20" fill="#555"/><rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${right.color}"/><rect width="${totalWidth}" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11"><text x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(leftText)}</text><text x="${leftWidth / 2}" y="14">${escapeXml(leftText)}</text><text x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(right.text)}</text><text x="${leftWidth + rightWidth / 2}" y="14">${escapeXml(right.text)}</text></g>
</svg>`;

  return { svg, found: Boolean(release) };
}
