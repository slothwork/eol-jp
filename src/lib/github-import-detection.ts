import type { GitHubDetection, GitHubRepositoryRef } from './github-import-types.ts';

const TOOL_VERSION_MAPPINGS: Record<string, string> = {
  nodejs: 'nodejs',
  node: 'nodejs',
  python: 'python',
  ruby: 'ruby',
  golang: 'go',
  go: 'go',
  java: 'java'
};

const SBOM_PURL_MAPPINGS = [
  { prefix: 'pkg:npm/next@', slug: 'nextjs' },
  { prefix: 'pkg:pypi/django@', slug: 'django' },
  { prefix: 'pkg:composer/laravel/framework@', slug: 'laravel' }
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function trimEvidence(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function normalizeDetectedVersion(value: string): string | null {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  const match = /^v?(\d+(?:\.\d+){0,3})(?:[-+][0-9A-Za-z._+-]+)?$/.exec(trimmed);
  return match?.[1] ?? null;
}

function leadingNumericVersion(value: string): string | null {
  const match = /^v?(\d+(?:\.\d+){0,3})(?:\b|[-_+])/i.exec(value.trim());
  return match?.[1] ?? null;
}

function detection(
  slug: string,
  version: string | null,
  source: string,
  evidence: string,
  sourceType: 'sbom' | 'manifest' = 'manifest'
): GitHubDetection[] {
  if (!version) return [];
  return [{
    slug,
    detectedVersion: version,
    sourceType,
    source,
    evidence: trimEvidence(evidence)
  }];
}

export function parseGitHubRepositoryUrl(input: string): GitHubRepositoryRef | null {
  const raw = input.trim();
  if (!raw) return null;

  let owner = '';
  let repo = '';

  if (/^[^/\s]+\/[^/\s]+$/.test(raw) && !raw.includes('://')) {
    [owner, repo] = raw.split('/');
  } else {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.search || url.hash) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 2) return null;
    [owner, repo] = parts;
  }

  repo = repo.replace(/\.git$/i, '');
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) && !/^[A-Za-z0-9]$/.test(owner)) return null;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return null;
  return { owner, repo };
}

function parseDockerfile(content: string, path: string): GitHubDetection[] {
  const results: GitHubDetection[] = [];
  const imageMappings: Array<{ test: (image: string) => boolean; slug: string; windows?: boolean }> = [
    { test: (image) => /(^|\/)node$/.test(image), slug: 'nodejs' },
    { test: (image) => /(^|\/)python$/.test(image), slug: 'python' },
    { test: (image) => /(^|\/)php$/.test(image), slug: 'php' },
    { test: (image) => /(^|\/)ruby$/.test(image), slug: 'ruby' },
    { test: (image) => /(^|\/)(golang|go)$/.test(image), slug: 'go' },
    { test: (image) => /(^|\/)(openjdk|eclipse-temurin|amazoncorretto)$/.test(image), slug: 'java' },
    { test: (image) => /(^|\/)ubuntu$/.test(image), slug: 'ubuntu' },
    { test: (image) => /(^|\/)postgres$/.test(image), slug: 'postgresql' },
    { test: (image) => /(^|\/)mysql$/.test(image), slug: 'mysql' },
    { test: (image) => /(^|\/)redis$/.test(image), slug: 'redis' },
    { test: (image) => /(^|\/)(mongo|mongodb)$/.test(image), slug: 'mongodb' },
    { test: (image) => /(^|\/)nginx$/.test(image), slug: 'nginx' },
    { test: (image) => image.includes('/dotnet/sdk'), slug: 'dotnet' },
    { test: (image) => /(^|\/)(kube-apiserver|kube-controller-manager|kube-scheduler)$/.test(image), slug: 'kubernetes' },
    { test: (image) => image.includes('/windows/servercore') || image.includes('/windows/nanoserver'), slug: 'windows-server', windows: true }
  ];

  for (const line of content.split(/\r?\n/)) {
    const from = /^\s*FROM\s+(?:--platform=\S+\s+)?([^\s]+)(?:\s+AS\s+\S+)?\s*$/i.exec(line);
    if (!from) continue;
    const ref = from[1];
    if (ref.includes('$')) continue;
    const withoutDigest = ref.split('@')[0];
    const slash = withoutDigest.lastIndexOf('/');
    const colon = withoutDigest.lastIndexOf(':');
    if (colon <= slash) continue;
    const image = withoutDigest.slice(0, colon).toLowerCase();
    const tag = withoutDigest.slice(colon + 1);
    if (!tag || /^(latest|stable|lts)$/i.test(tag)) continue;

    const mapping = imageMappings.find((item) => item.test(image));
    if (!mapping) continue;
    const version = mapping.windows
      ? /(?:ltsc)?(20\d{2})/i.exec(tag)?.[1] ?? null
      : leadingNumericVersion(tag);
    results.push(...detection(mapping.slug, version, path, line));
  }
  return results;
}

export function detectManifestCandidates(path: string, content: string): GitHubDetection[] {
  const name = path.split('/').pop() ?? path;
  const lower = name.toLowerCase();

  if (lower === '.nvmrc' || lower === '.node-version') {
    return detection('nodejs', normalizeDetectedVersion(content.trim().split(/\s+/)[0] ?? ''), path, content);
  }
  if (lower === '.python-version') {
    return detection('python', normalizeDetectedVersion(content.trim().split(/\s+/)[0] ?? ''), path, content);
  }
  if (lower === '.ruby-version') {
    return detection('ruby', normalizeDetectedVersion(content.trim().split(/\s+/)[0] ?? ''), path, content);
  }
  if (lower === '.java-version') {
    const token = content.trim().split(/\s+/)[0] ?? '';
    return detection('java', normalizeDetectedVersion(token) ?? leadingNumericVersion(token.replace(/^[A-Za-z_-]+-/, '')), path, content);
  }
  if (lower === '.tool-versions') {
    const results: GitHubDetection[] = [];
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [tool, rawVersion] = trimmed.split(/\s+/, 2);
      const slug = TOOL_VERSION_MAPPINGS[tool.toLowerCase()];
      if (!slug || !rawVersion) continue;
      const version = slug === 'java'
        ? normalizeDetectedVersion(rawVersion) ?? leadingNumericVersion(rawVersion.replace(/^[A-Za-z_-]+-/, ''))
        : normalizeDetectedVersion(rawVersion);
      results.push(...detection(slug, version, path, line));
    }
    return results;
  }
  if (lower === 'go.mod') {
    const match = /^go\s+(\d+(?:\.\d+){1,2})\s*$/m.exec(content);
    return detection('go', match?.[1] ?? null, path, match?.[0] ?? content);
  }
  if (lower === 'global.json') {
    try {
      const parsed = JSON.parse(content) as { sdk?: { version?: unknown } };
      const raw = typeof parsed.sdk?.version === 'string' ? parsed.sdk.version : '';
      return detection('dotnet', normalizeDetectedVersion(raw), path, raw);
    } catch {
      return [];
    }
  }
  if (lower === 'package.json') {
    try {
      const parsed = JSON.parse(content) as { engines?: { node?: unknown } };
      const raw = typeof parsed.engines?.node === 'string' ? parsed.engines.node : '';
      return detection('nodejs', normalizeDetectedVersion(raw), path, `engines.node=${raw}`);
    } catch {
      return [];
    }
  }
  if (lower === 'composer.json') {
    try {
      const parsed = JSON.parse(content) as { require?: Record<string, unknown> };
      const raw = typeof parsed.require?.php === 'string' ? parsed.require.php : '';
      return detection('php', normalizeDetectedVersion(raw), path, `require.php=${raw}`);
    } catch {
      return [];
    }
  }
  if (lower === 'gemfile') {
    const match = /^\s*ruby\s+['"](v?\d+(?:\.\d+){0,3})['"]/m.exec(content);
    return detection('ruby', normalizeDetectedVersion(match?.[1] ?? ''), path, match?.[0] ?? content);
  }
  if (lower === 'runtime.txt') {
    const match = /^\s*(nodejs|node|python|ruby|php)-(v?\d+(?:\.\d+){0,3})\s*$/im.exec(content);
    if (!match) return [];
    const slug = TOOL_VERSION_MAPPINGS[match[1].toLowerCase()] ?? match[1].toLowerCase();
    return detection(slug, normalizeDetectedVersion(match[2]), path, match[0]);
  }
  if (lower === 'dockerfile') return parseDockerfile(content, path);
  return [];
}

export function detectSbomCandidates(payload: unknown): GitHubDetection[] {
  const root = isPlainObject(payload) && isPlainObject(payload.sbom) ? payload.sbom : payload;
  if (!isPlainObject(root) || !Array.isArray(root.packages)) return [];
  const results: GitHubDetection[] = [];

  for (const pkg of root.packages) {
    if (!isPlainObject(pkg)) continue;
    const refs = Array.isArray(pkg.externalRefs) ? pkg.externalRefs : [];
    for (const ref of refs) {
      if (!isPlainObject(ref) || typeof ref.referenceLocator !== 'string') continue;
      const purl = ref.referenceLocator.trim();
      const lower = purl.toLowerCase();
      const mapping = SBOM_PURL_MAPPINGS.find((item) => lower.startsWith(item.prefix));
      if (!mapping) continue;
      const at = purl.lastIndexOf('@');
      if (at < 0) continue;
      const rawVersion = purl.slice(at + 1).split(/[?#]/, 1)[0];
      let decoded = rawVersion;
      try { decoded = decodeURIComponent(rawVersion); } catch { /* keep raw */ }
      const version = normalizeDetectedVersion(decoded);
      results.push(...detection(mapping.slug, version, `SBOM (${mapping.prefix.slice(4, -1)})`, purl, 'sbom'));
    }
  }
  return dedupeDetections(results);
}

export function dedupeDetections(items: GitHubDetection[]): GitHubDetection[] {
  const seen = new Set<string>();
  const result: GitHubDetection[] = [];
  for (const item of items) {
    const key = `${item.slug}\u0000${item.detectedVersion}\u0000${item.sourceType}\u0000${item.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
