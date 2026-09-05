import assert from 'node:assert/strict';
import { japanCommercialSupportByProduct } from '../src/data/japan-commercial-support.ts';
import { productOverviews } from '../src/data/product-content.ts';
import { productReleaseHighlights } from '../src/data/release-highlights.ts';
import { featuredSlugs } from '../src/data/product-meta.ts';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const requiredReleaseHighlightSlugs = [
  'nodejs',
  'python',
  'php',
  'postgresql',
  'dotnet',
  'ubuntu',
  'kubernetes',
  'go',
  'django',
  'redis',
  'mongodb',
  'java',
  'ruby',
  'laravel',
  'nextjs',
  'mysql',
  'windows',
  'windows-server',
  'docker-engine',
  'nginx'
];
const requiredJapanCommercialSupportSlugs = [
  'ubuntu',
  'mysql',
  'java',
  'windows',
  'windows-server',
  'nginx'
];

for (const slug of featuredSlugs) {
  const overview = productOverviews[slug];
  assert.equal(typeof overview, 'string', `Missing overview for ${slug}`);
  assert.ok(overview.length >= 60, `Overview is too short for ${slug}`);
}

assert.equal(Object.keys(productOverviews).length, featuredSlugs.length, 'Product overview set should match featured products');
assert.equal(Object.keys(productReleaseHighlights).length, featuredSlugs.length, 'Release highlight set should match featured products');

for (const slug of requiredReleaseHighlightSlugs) {
  const releases = productReleaseHighlights[slug];
  assert.ok(Array.isArray(releases) && releases.length > 0, `Missing release highlights for ${slug}`);
  for (const release of releases) {
    assert.ok(release.version.length > 0, `Missing release version for ${slug}`);
    assert.match(release.releaseDate, datePattern, `Invalid release date for ${slug}`);
    assert.ok(release.summary.length >= 40, `Release summary is too short for ${slug}`);
    assert.ok(release.highlights.length >= 3, `Not enough release highlights for ${slug}`);
    assert.ok(release.highlights.every((item) => item.length >= 15), `Release highlight is too short for ${slug}`);
    assert.ok(release.sourceUrl.startsWith('https://'), `Release source must use HTTPS for ${slug}`);
    assert.match(release.checkedAt, datePattern, `Invalid checkedAt for ${slug}`);
  }
}

assert.equal(
  Object.keys(japanCommercialSupportByProduct).length,
  requiredJapanCommercialSupportSlugs.length,
  'Japan commercial support data should contain only explicitly reviewed products'
);

for (const slug of requiredJapanCommercialSupportSlugs) {
  assert.ok(featuredSlugs.includes(slug), `Japan commercial support product must be featured: ${slug}`);
  const support = japanCommercialSupportByProduct[slug];
  assert.ok(support, `Missing Japan commercial support for ${slug}`);
  assert.ok(support.provider.length > 0, `Missing commercial support provider for ${slug}`);
  assert.ok(support.service.length > 0, `Missing commercial support service for ${slug}`);
  assert.ok(support.summary.length >= 40, `Commercial support summary is too short for ${slug}`);
  assert.ok(support.details.length >= 3, `Not enough commercial support details for ${slug}`);
  assert.ok(support.details.every((item) => item.length >= 15), `Commercial support detail is too short for ${slug}`);
  assert.ok(support.sources.length >= 1, `Missing commercial support source for ${slug}`);
  assert.ok(support.sources.every((source) => source.url.startsWith('https://')), `Commercial support sources must use HTTPS for ${slug}`);
  assert.ok(support.sources.every((source) => source.label.length > 0), `Commercial support source label is missing for ${slug}`);
  assert.match(support.checkedAt, datePattern, `Invalid commercial support checkedAt for ${slug}`);
}

console.log('Product content tests passed.');
