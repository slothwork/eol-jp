import fs from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');
const SITE_ORIGIN = 'https://eol.slothwright.com';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonicalFrom(html) {
  const tag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
}

function robotsDirectives(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find((candidate) => /\bname=["']robots["']/i.test(candidate));
  const content = tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? '';
  return content.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
}

async function collectHtmlFiles(directory, files = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectHtmlFiles(absolute, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(absolute);
    }
  }
  return files;
}

const [sitemap, robots, htmlFiles] = await Promise.all([
  fs.readFile(path.join(DIST_DIR, 'sitemap.xml'), 'utf8'),
  fs.readFile(path.join(DIST_DIR, 'robots.txt'), 'utf8'),
  collectHtmlFiles(DIST_DIR)
]);

assert(
  sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'),
  'sitemap.xml must use the sitemap 0.9 urlset namespace.'
);
assert(
  robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`),
  'robots.txt must advertise the production sitemap URL.'
);

const sitemapUrlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapUrls = new Set(sitemapUrlList);
assert(sitemapUrlList.length === sitemapUrls.size, 'sitemap.xml must not contain duplicate URLs.');
assert(sitemapUrls.has(`${SITE_ORIGIN}/`), 'sitemap.xml must contain the homepage.');
assert(sitemapUrls.has(`${SITE_ORIGIN}/releases/`), 'sitemap.xml must contain /releases/.');

for (const url of sitemapUrls) {
  assert(url.startsWith(`${SITE_ORIGIN}/`), `sitemap.xml contains an unexpected origin: ${url}`);
}

const indexableCanonicals = new Set();
const noindexCanonicals = new Set();

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const canonical = canonicalFrom(html);
  if (!canonical) continue;

  const directives = robotsDirectives(html);
  if (directives.includes('noindex')) {
    noindexCanonicals.add(canonical);
  } else {
    indexableCanonicals.add(canonical);
  }
}

assert(indexableCanonicals.size > 400, `Unexpectedly few indexable HTML pages: ${indexableCanonicals.size}`);

for (const canonical of indexableCanonicals) {
  assert(sitemapUrls.has(canonical), `Indexable canonical is missing from sitemap.xml: ${canonical}`);
}

for (const canonical of noindexCanonicals) {
  assert(!sitemapUrls.has(canonical), `noindex canonical must be excluded from sitemap.xml: ${canonical}`);
}

for (const url of sitemapUrls) {
  assert(indexableCanonicals.has(url), `sitemap.xml contains a URL without an indexable HTML canonical: ${url}`);
}

console.log(
  `Sitemap validation passed: ${sitemapUrls.size} sitemap URLs, ${indexableCanonicals.size} indexable HTML pages, ${noindexCanonicals.size} noindex HTML pages.`
);
