import { upcomingReleases } from '@/lib/eol';
export const prerender = true;
const clean = (v: string) => v.replace(/[\\;,\n]/g, ' ');
export async function GET({ site }: { site?: URL }) {
  const base = site ?? new URL('https://eol.slothwright.com');
  const events = upcomingReleases(730).map(({ product, release }) => {
    if (!release.eolFrom) return '';
    const date = release.eolFrom.replaceAll('-', '');
    const link = new URL(`/eol/${product.slug}/`, base).toString();
    return `BEGIN:VEVENT\r\nUID:${clean(product.slug)}-${clean(release.name)}-${date}@eol-jp\r\nDTSTART;VALUE=DATE:${date}\r\nSUMMARY:${clean(product.label)} ${clean(release.name)} EOL\r\nDESCRIPTION:${clean(link)}\r\nURL:${clean(link)}\r\nEND:VEVENT`;
  }).filter(Boolean).join('\r\n');
  const body = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EOL情報.jp//EOL Calendar//JA\r\nCALSCALE:GREGORIAN\r\n${events}\r\nEND:VCALENDAR\r\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
}
