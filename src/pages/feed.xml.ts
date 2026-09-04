import { upcomingReleases } from '@/lib/eol';
import { formatJaDate } from '@/lib/date';
export const prerender = true;
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c] ?? c));
export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL('https://eol.slothwright.com');
  const items = upcomingReleases(365).slice(0, 50).map(({ product, release }) => {
    const link = new URL(`/eol/${product.slug}/`, base).toString();
    const title = `${product.label} ${release.name} - ${formatJaDate(release.eolFrom)}にEOL`;
    return `<item><title>${esc(title)}</title><link>${esc(link)}</link><guid>${esc(`${link}#${release.name}`)}</guid><description>${esc(`${product.label} ${release.name} のEOL予定日は ${formatJaDate(release.eolFrom)} です。`)}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>EOL情報.jp - まもなくEOL</title><link>${esc(base.toString())}</link><description>今後1年のEOL予定</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
