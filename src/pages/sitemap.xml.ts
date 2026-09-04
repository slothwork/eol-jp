import { products } from '@/lib/eol';
export const prerender = true;
export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL('https://eol.slothwright.com');
  const paths = ['/', '/eol/', '/upcoming/', '/calendar/', '/about/', ...products.map((p) => `/eol/${p.slug}/`)];
  const urls = paths.map((path) => `<url><loc>${new URL(path, base).toString()}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
