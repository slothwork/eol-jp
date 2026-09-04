import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const siteOrigin = 'https://eol.slothwright.com';
const failures = [];

function fail(message) {
  failures.push(message);
}

async function read(relativePath) {
  try {
    return await fs.readFile(path.join(distDir, relativePath), 'utf8');
  } catch {
    fail(`Missing build output: ${relativePath}`);
    return '';
  }
}

function extractJsonLd(html, label) {
  const blocks = [];
  const pattern = /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (error) {
      fail(`${label}: invalid JSON-LD (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  return blocks;
}

function flattenStructuredData(blocks) {
  return blocks.flatMap((block) => Array.isArray(block?.['@graph']) ? block['@graph'] : [block]);
}

function canonicalFrom(html) {
  const tag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
}

function validateBreadcrumb(node, label) {
  const items = node?.itemListElement;
  if (!Array.isArray(items) || items.length < 2) {
    fail(`${label}: BreadcrumbList must contain at least two ListItem entries`);
    return;
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item?.['@type'] !== 'ListItem') fail(`${label}: breadcrumb item ${index + 1} is not ListItem`);
    if (item?.position !== index + 1) fail(`${label}: breadcrumb positions are not sequential`);
    if (typeof item?.name !== 'string' || item.name.length === 0) fail(`${label}: breadcrumb item ${index + 1} has no name`);
  }
}

async function validateProductPages() {
  const eolDir = path.join(distDir, 'eol');
  let entries = [];
  try {
    entries = await fs.readdir(eolDir, { withFileTypes: true });
  } catch {
    fail('Missing dist/eol directory');
    return [];
  }

  const productDirs = entries.filter((entry) => entry.isDirectory());
  if (productDirs.length < 100) fail(`Unexpectedly few product pages: ${productDirs.length}`);

  const canonicals = [];
  for (const entry of productDirs) {
    const relativePath = path.join('eol', entry.name, 'index.html');
    const html = await read(relativePath);
    if (!html) continue;

    const label = `/eol/${entry.name}/`;
    const expectedCanonical = `${siteOrigin}${label}`;
    const canonical = canonicalFrom(html);
    if (canonical !== expectedCanonical) fail(`${label}: canonical mismatch (${canonical ?? 'missing'})`);
    else canonicals.push(canonical);

    if (/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html)) {
      fail(`${label}: product page must not be noindex`);
    }

    if (!html.includes('aria-label="パンくずリスト"')) fail(`${label}: visible breadcrumb is missing`);
    if (!html.includes('EOLに関するよくある質問')) fail(`${label}: visible FAQ section is missing`);

    const nodes = flattenStructuredData(extractJsonLd(html, label));
    const webPage = nodes.find((node) => node?.['@type'] === 'WebPage');
    const breadcrumb = nodes.find((node) => node?.['@type'] === 'BreadcrumbList');

    if (!webPage) {
      fail(`${label}: WebPage structured data is missing`);
    } else {
      if (webPage.url !== expectedCanonical) fail(`${label}: WebPage.url must match canonical`);
      if (webPage.inLanguage !== 'ja-JP') fail(`${label}: WebPage.inLanguage must be ja-JP`);
      if (typeof webPage.name !== 'string' || !webPage.name.includes('EOL')) fail(`${label}: WebPage.name is invalid`);
      if (typeof webPage.description !== 'string' || webPage.description.length < 20) fail(`${label}: WebPage.description is too short`);
      if (typeof webPage.dateModified !== 'string' || Number.isNaN(Date.parse(webPage.dateModified))) fail(`${label}: WebPage.dateModified is invalid`);
    }

    if (!breadcrumb) fail(`${label}: BreadcrumbList structured data is missing`);
    else validateBreadcrumb(breadcrumb, label);

    for (const unsuitableType of ['FAQPage', 'TechArticle']) {
      if (nodes.some((node) => node?.['@type'] === unsuitableType)) {
        fail(`${label}: deprecated or unsuitable ${unsuitableType} structured data remains`);
      }
    }
  }

  return canonicals;
}

async function validateSiteOutputs(productCanonicals) {
  const home = await read('index.html');
  if (home && canonicalFrom(home) !== `${siteOrigin}/`) fail('/: canonical mismatch');

  const changes = await read(path.join('changes', 'index.html'));
  if (changes && canonicalFrom(changes) !== `${siteOrigin}/changes/`) fail('/changes/: canonical mismatch');

  const sitemap = await read('sitemap.xml');
  const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  if (!sitemapUrls.has(`${siteOrigin}/changes/`)) fail('sitemap.xml: /changes/ is missing');
  for (const canonical of productCanonicals) {
    if (!sitemapUrls.has(canonical)) fail(`sitemap.xml: ${canonical} is missing`);
  }

  const robots = await read('robots.txt');
  if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) fail('robots.txt: production sitemap URL is missing');
}

const productCanonicals = await validateProductPages();
await validateSiteOutputs(productCanonicals);

if (failures.length > 0) {
  console.error(`SEO validation failed with ${failures.length} issue(s):`);
  for (const issue of failures) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${productCanonicals.length} product pages.`);
