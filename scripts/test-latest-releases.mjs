import assert from 'node:assert/strict';
import {
  collectLatestReleaseEntries,
  countLatestReleasesWithin
} from '../src/lib/latest-releases.ts';

const now = new Date('2026-09-07T03:00:00.000Z');

const products = [
  {
    slug: 'alpha',
    label: 'Alpha',
    category: 'lang',
    releases: [
      {
        name: '3',
        releaseDate: '2026-01-01',
        isLts: true,
        eolFrom: '2027-01-01',
        isEol: false,
        isMaintained: true,
        latest: { name: '3.4.0', date: '2026-09-06', link: 'https://example.com/alpha-3.4.0' }
      },
      {
        name: '2',
        releaseDate: '2025-01-01',
        isLts: false,
        eolFrom: '2026-09-06',
        isEol: false,
        isMaintained: false,
        latest: { name: '2.9.0', date: '2026-08-20', link: null }
      },
      {
        name: '4-preview',
        releaseDate: '2026-09-01',
        isLts: false,
        eolFrom: '2027-09-01',
        isEol: false,
        isMaintained: true,
        latest: { name: '4.0.0', date: '2026-09-08', link: null }
      }
    ]
  },
  {
    slug: 'beta',
    label: 'Beta',
    category: 'database',
    releases: [
      {
        name: '10',
        releaseDate: '2025-10-01',
        isLts: false,
        eolFrom: null,
        isEol: false,
        isMaintained: true,
        latest: { name: '10.2', date: '2026-08-10', link: null }
      },
      {
        name: '9',
        releaseDate: '2024-10-01',
        isLts: false,
        eolFrom: null,
        isEol: false,
        isMaintained: false,
        latest: { name: '9.9', date: '2026-09-05', link: null }
      }
    ]
  },
  {
    slug: 'gamma',
    label: 'Gamma',
    category: 'app',
    releases: [
      {
        name: '1',
        releaseDate: '2026-05-01',
        isLts: false,
        eolFrom: '2027-05-01',
        isEol: false,
        isMaintained: true,
        latest: { name: null, date: '2026-09-07', link: null }
      }
    ]
  },
  {
    slug: 'delta',
    label: 'Delta',
    category: 'app',
    releases: [
      {
        name: '5',
        releaseDate: '2026-01-01',
        isLts: false,
        eolFrom: '2027-01-01',
        isEol: false,
        isMaintained: true,
        latest: { name: '5.1', date: '2026-09-06', link: null }
      }
    ]
  }
];

const entries = collectLatestReleaseEntries(products, now);

assert.deepEqual(
  entries.map((entry) => `${entry.productSlug}:${entry.cycle}:${entry.latestName}`),
  ['alpha:3:3.4.0', 'delta:5:5.1', 'beta:10:10.2'],
  'supported releases should be sorted by latest date, then product label'
);
assert.equal(entries[0].ageDays, 1, 'latest release age should use JST date boundaries');
assert.equal(entries[0].isLts, true, 'LTS metadata should be preserved');
assert.equal(entries[0].latestLink, 'https://example.com/alpha-3.4.0', 'latest link should be preserved');
assert.equal(entries.some((entry) => entry.cycle === '2'), false, 'ended cycles must be excluded');
assert.equal(entries.some((entry) => entry.cycle === '4-preview'), false, 'future latest releases must be excluded');
assert.equal(entries.some((entry) => entry.cycle === '9'), false, 'unknown and non-maintained cycles must be excluded');
assert.equal(entries.some((entry) => entry.productSlug === 'gamma'), false, 'entries without latest version name must be excluded');

assert.equal(countLatestReleasesWithin(entries, 7), 2, '7-day window should include two recent releases');
assert.equal(countLatestReleasesWithin(entries, 30), 2, '30-day window should exclude the older Beta release');
assert.equal(countLatestReleasesWithin(entries, 90), 3, '90-day window should include all collected releases');
assert.throws(() => countLatestReleasesWithin(entries, -1), /non-negative/, 'negative windows must be rejected');

console.log('Latest release tests passed.');
