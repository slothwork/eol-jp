import assert from 'node:assert/strict';
import {
  detectManifestCandidates,
  detectSbomCandidates,
  matchDetectedVersion,
  parseGitHubRepositoryUrl,
  resolveImportCandidates
} from '../src/lib/github-import.ts';

assert.deepEqual(parseGitHubRepositoryUrl('https://github.com/octocat/Hello-World'), {
  owner: 'octocat',
  repo: 'Hello-World'
});
assert.deepEqual(parseGitHubRepositoryUrl('octocat/Hello-World.git'), {
  owner: 'octocat',
  repo: 'Hello-World'
});
assert.equal(parseGitHubRepositoryUrl('https://github.com/octocat/Hello-World/issues'), null);
assert.equal(parseGitHubRepositoryUrl('https://example.com/octocat/Hello-World'), null);

assert.deepEqual(
  detectManifestCandidates('.nvmrc', 'v22.18.0\n').map(({ slug, detectedVersion }) => ({ slug, detectedVersion })),
  [{ slug: 'nodejs', detectedVersion: '22.18.0' }]
);
assert.deepEqual(
  detectManifestCandidates('go.mod', 'module example.com/demo\n\ngo 1.25.1\n').map(({ slug, detectedVersion }) => ({ slug, detectedVersion })),
  [{ slug: 'go', detectedVersion: '1.25.1' }]
);
assert.deepEqual(
  detectManifestCandidates('global.json', JSON.stringify({ sdk: { version: '8.0.405' } })).map(({ slug, detectedVersion }) => ({ slug, detectedVersion })),
  [{ slug: 'dotnet', detectedVersion: '8.0.405' }]
);

const dockerDetections = detectManifestCandidates('Dockerfile', [
  'FROM node:22.18.0-alpine AS build',
  'FROM postgres:17-alpine',
  'FROM nginx:latest'
].join('\n'));
assert.deepEqual(
  dockerDetections.map(({ slug, detectedVersion }) => ({ slug, detectedVersion })),
  [
    { slug: 'nodejs', detectedVersion: '22.18.0' },
    { slug: 'postgresql', detectedVersion: '17' }
  ]
);

const sbom = {
  sbom: {
    packages: [
      {
        externalRefs: [
          { referenceLocator: 'pkg:npm/next@16.1.2' }
        ]
      },
      {
        externalRefs: [
          { referenceLocator: 'pkg:pypi/django@5.2.7' }
        ]
      },
      {
        externalRefs: [
          { referenceLocator: 'pkg:composer/laravel/framework@v12.3.0' }
        ]
      },
      {
        externalRefs: [
          { referenceLocator: 'pkg:npm/mysql2@3.14.0' }
        ]
      }
    ]
  }
};
assert.deepEqual(
  detectSbomCandidates(sbom).map(({ slug, detectedVersion }) => ({ slug, detectedVersion })),
  [
    { slug: 'nextjs', detectedVersion: '16.1.2' },
    { slug: 'django', detectedVersion: '5.2.7' },
    { slug: 'laravel', detectedVersion: '12.3.0' }
  ]
);

assert.equal(matchDetectedVersion('22.18.0', ['24', '22', '20']), '22');
assert.equal(matchDetectedVersion('3.13.7', ['3.14', '3.13', '3.12']), '3.13');
assert.equal(matchDetectedVersion('3.10.1', ['3.1', '3.10']), '3.10');
assert.equal(matchDetectedVersion('99.0', ['22', '20']), null);

const catalog = [
  { slug: 'nodejs', label: 'Node.js', releases: [{ name: '24' }, { name: '22' }, { name: '20' }] },
  { slug: 'nextjs', label: 'Next.js', releases: [{ name: '16' }, { name: '15' }] },
  { slug: 'python', label: 'Python', releases: [{ name: '3.14' }, { name: '3.13' }] }
];
const resolution = resolveImportCandidates([
  { slug: 'nodejs', detectedVersion: '22.18.0', sourceType: 'manifest', source: '.nvmrc', evidence: '22.18.0' },
  { slug: 'nodejs', detectedVersion: '22.19.0', sourceType: 'manifest', source: 'Dockerfile', evidence: 'FROM node:22.19.0' },
  { slug: 'nextjs', detectedVersion: '16.1.2', sourceType: 'sbom', source: 'SBOM', evidence: 'pkg:npm/next@16.1.2' },
  { slug: 'python', detectedVersion: '3.15.0', sourceType: 'manifest', source: '.python-version', evidence: '3.15.0' }
], catalog);
assert.deepEqual(resolution.ready.map(({ slug, version }) => ({ slug, version })), [
  { slug: 'nextjs', version: '16' },
  { slug: 'nodejs', version: '22' }
]);
assert.equal(resolution.conflicts.length, 0);
assert.deepEqual(resolution.unmatched.map(({ slug, detectedVersion }) => ({ slug, detectedVersion })), [
  { slug: 'python', detectedVersion: '3.15.0' }
]);

const conflict = resolveImportCandidates([
  { slug: 'nodejs', detectedVersion: '22.18.0', sourceType: 'manifest', source: '.nvmrc', evidence: '22.18.0' },
  { slug: 'nodejs', detectedVersion: '20.19.0', sourceType: 'manifest', source: 'Dockerfile', evidence: 'FROM node:20.19.0' }
], catalog);
assert.equal(conflict.ready.length, 0);
assert.deepEqual(conflict.conflicts[0]?.matchedVersions, ['22', '20']);

console.log('GitHub import tests passed.');
