import { products } from '@/lib/eol';

export const prerender = true;

export async function GET() {
  const catalog = products.map((product) => ({
    slug: product.slug,
    label: product.label,
    releases: product.releases.map((release) => ({
      name: release.name,
      releaseDate: release.releaseDate,
      eolFrom: release.eolFrom,
      isLts: release.isLts,
      isEol: release.isEol,
      isMaintained: release.isMaintained
    }))
  }));

  return new Response(JSON.stringify({ products: catalog }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
