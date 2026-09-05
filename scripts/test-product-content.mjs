import assert from 'node:assert/strict';
import { productOverviews, productReleaseHighlights } from '../src/data/product-content.ts';
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

for (const slug of featuredSlugs) {
  const overview = productOverviews[slug];
  assert.equal(typeof overview, 'string', `Missing overview for ${slug}`);
  assert.ok(overview.length >= 60, `Overview is too short for ${slug}`);
}

assert.equal(Object.keys(productOverviews).length, featuredSlugs.length, 'Product overview set should match featured products');

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

console.log('Product content tests passed.');
