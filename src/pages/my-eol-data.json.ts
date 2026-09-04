import { generatedAt, products, sourceUrl } from '@/lib/eol';

export const prerender = true;

export async function GET() {
  const catalog = products.map((product) => ({
    slug: product.slug,
    label: product.label,
    category: product.category,
    versionCommand: product.versionCommand ?? null,
    links: product.links,
    releases: product.releases.map((release) => ({
      name: release.name,
      label: release.label ?? null,
      codename: release.codename ?? null,
      releaseDate: release.releaseDate,
      isLts: release.isLts,
      ltsFrom: release.ltsFrom ?? null,
      eoasFrom: release.eoasFrom,
      eolFrom: release.eolFrom,
      isEol: release.isEol,
      isMaintained: release.isMaintained,
      latest: release.latest
    }))
  }));

  return new Response(JSON.stringify({
    schemaVersion: 1,
    generatedAt,
    sourceUrl,
    products: catalog
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
