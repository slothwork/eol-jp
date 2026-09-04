import { products } from '@/lib/eol';
import { isIndexableProduct } from '@/lib/index-policy';

export const prerender = true;

export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL('https://eol.slothwright.com');
  const categories = [...new Set(products.map((product) => product.category))];
  const indexableProducts = products.filter(isIndexableProduct);
  const paths = [
    '/',
    '/eol/',
    '/upcoming/',
    '/upcoming/30-days/',
    '/upcoming/90-days/',
    '/upcoming/180-days/',
    '/calendar/',
    '/changes/',
    '/api/',
    '/about/',
    ...categories.map((category) => `/category/${category}/`),
    ...indexableProducts.map((product) => `/eol/${product.slug}/`)
  ];
  const urls = paths.map((path) => `<url><loc>${new URL(path, base).toString()}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
