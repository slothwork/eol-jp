export const GITHUB_IMPORT_MAX_MANIFEST_BYTES = 128 * 1024;
export const GITHUB_IMPORT_MAX_SBOM_BYTES = 5 * 1024 * 1024;
export const GITHUB_IMPORT_MAX_POLLS = 6;

export type GitHubRepositoryRef = {
  owner: string;
  repo: string;
};

export type GitHubDetection = {
  slug: string;
  detectedVersion: string;
  sourceType: 'sbom' | 'manifest';
  source: string;
  evidence: string;
};

export type GitHubImportRepository = GitHubRepositoryRef & {
  defaultBranch: string;
  htmlUrl: string;
};

export type GitHubImportAnalysis = {
  repository: GitHubImportRepository;
  detections: GitHubDetection[];
  warnings: string[];
};

export type ImportCatalogProduct = {
  slug: string;
  label: string;
  releases: Array<{ name: string }>;
};

export type ResolvedImportCandidate = {
  slug: string;
  label: string;
  version: string;
  detectedVersions: string[];
  sources: string[];
};

export type ImportConflict = {
  slug: string;
  label: string;
  detectedVersions: string[];
  matchedVersions: string[];
  sources: string[];
};

export type ImportUnmatched = {
  slug: string;
  label: string;
  detectedVersion: string;
  source: string;
};

export type ImportResolution = {
  ready: ResolvedImportCandidate[];
  conflicts: ImportConflict[];
  unmatched: ImportUnmatched[];
};

export type GitHubImportProgress = 'repository' | 'manifests' | 'sbom' | 'complete';

const API_BASE = 'https://api.github.com';
const ACCEPT_HEADERS = { Accept: 'application/vnd.github+json' };
const ROOT_MANIFEST_NAMES = new Set([
  '.nvmrc',
  '.node-version',
  '.python-version',
  '.ruby-version',
  '.java-version',
  '.tool-versions',
  'go.mod',
  'global.json',
  'package.json',
  'composer.json',
  'Gemfile',
  'runtime.txt',
  'Dockerfile'
].map((name) => name.toLowerCase()));

const SBOM_PURL_MAPPINGS = [
  { prefix: 'pkg:npm/next@', slug: 'nextjs' },
  { prefix: 'pkg:pypi/django@', slug: 'django' },
  { prefix: 'pkg:composer/laravel/framework@', slug: 'laravel' }
] as const;

const TOOL_VERSION_MAPPINGS: Record<string, string> = {
  nodejs: 'nodejs',
  node: 'nodejs',
  python: 'python',
  ruby: 'ruby',
  golang: 'go',
  go: 'go',
  java: 'java'
};

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

function detection(slug: string, version: string | null, source: string, evidence: string, sourceType: 'sbom' | 'manifest' = 'manifest'): GitHubDetection[] {
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

function normalizeForMatch(value: string): string {
  return value.trim().replace(/^v/i, '').toLowerCase();
}

export function matchDetectedVersion(detectedVersion: string, releaseNames: string[]): string | null {
  const detected = normalizeForMatch(detectedVersion);
  const releases = releaseNames
    .map((name) => ({ name, normalized: normalizeForMatch(name) }))
    .sort((a, b) => b.normalized.length - a.normalized.length);

  for (const release of releases) {
    if (detected === release.normalized) return release.name;
    if (detected.startsWith(`${release.normalized}.`) || detected.startsWith(`${release.normalized}-`)) return release.name;
  }
  return null;
}

export function resolveImportCandidates(detections: GitHubDetection[], catalog: ImportCatalogProduct[]): ImportResolution {
  const productMap = new Map(catalog.map((product) => [product.slug, product]));
  const groups = new Map<string, GitHubDetection[]>();
  for (const item of dedupeDetections(detections)) {
    groups.set(item.slug, [...(groups.get(item.slug) ?? []), item]);
  }

  const ready: ResolvedImportCandidate[] = [];
  const conflicts: ImportConflict[] = [];
  const unmatched: ImportUnmatched[] = [];

  for (const [slug, items] of groups) {
    const product = productMap.get(slug);
    const label = product?.label ?? slug;
    if (!product) {
      for (const item of items) unmatched.push({ slug, label, detectedVersion: item.detectedVersion, source: item.source });
      continue;
    }

    const matched = items.map((item) => ({
      item,
      version: matchDetectedVersion(item.detectedVersion, product.releases.map((release) => release.name))
    }));
    const matchedVersions = [...new Set(matched.flatMap((item) => item.version ? [item.version] : []))];
    const unmatchedItems = matched.filter((item) => !item.version);

    if (matchedVersions.length === 1 && unmatchedItems.length === 0) {
      ready.push({
        slug,
        label,
        version: matchedVersions[0],
        detectedVersions: [...new Set(items.map((item) => item.detectedVersion))],
        sources: [...new Set(items.map((item) => item.source))]
      });
      continue;
    }

    if (matchedVersions.length > 0) {
      conflicts.push({
        slug,
        label,
        detectedVersions: [...new Set(items.map((item) => item.detectedVersion))],
        matchedVersions,
        sources: [...new Set(items.map((item) => item.source))]
      });
      continue;
    }

    for (const item of items) unmatched.push({ slug, label, detectedVersion: item.detectedVersion, source: item.source });
  }

  ready.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  conflicts.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  unmatched.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  return { ready, conflicts, unmatched };
}

type GitHubRepoResponse = {
  private?: boolean;
  default_branch?: string;
  html_url?: string;
};

type GitHubContentItem = {
  name?: string;
  path?: string;
  type?: string;
  size?: number;
  url?: string;
};

type GitHubFileResponse = {
  content?: string;
  encoding?: string;
};

function githubUrl(ref: GitHubRepositoryRef, suffix = ''): string {
  return `${API_BASE}/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}${suffix}`;
}

async function githubFetch(url: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { headers: ACCEPT_HEADERS });
  } catch {
    throw new Error('github_request_failed');
  }
  if ((response.status === 403 || response.status === 429) && response.headers.get('X-RateLimit-Remaining') === '0') {
    throw new Error('github_rate_limited');
  }
  return response;
}

async function decodeGitHubFile(item: GitHubContentItem, defaultBranch: string): Promise<string | null> {
  if (!item.url || !item.path || item.type !== 'file') return null;
  if (typeof item.size === 'number' && item.size > GITHUB_IMPORT_MAX_MANIFEST_BYTES) return null;
  const url = new URL(item.url);
  url.searchParams.set('ref', defaultBranch);
  const response = await githubFetch(url.toString());
  if (!response.ok) return null;
  const payload = await response.json() as GitHubFileResponse;
  if (payload.encoding !== 'base64' || typeof payload.content !== 'string') return null;
  try {
    const binary = atob(payload.content.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

async function detectRootManifests(ref: GitHubRepositoryRef, defaultBranch: string): Promise<{ detections: GitHubDetection[]; warnings: string[] }> {
  const rootUrl = new URL(githubUrl(ref, '/contents'));
  rootUrl.searchParams.set('ref', defaultBranch);
  const response = await githubFetch(rootUrl.toString());
  if (!response.ok) return { detections: [], warnings: ['manifest_list_unavailable'] };
  const root = await response.json();
  if (!Array.isArray(root)) return { detections: [], warnings: ['manifest_list_unavailable'] };

  const candidates = (root as GitHubContentItem[])
    .filter((item) => item.type === 'file' && typeof item.name === 'string' && ROOT_MANIFEST_NAMES.has(item.name.toLowerCase()))
    .slice(0, ROOT_MANIFEST_NAMES.size);

  const settled = await Promise.allSettled(candidates.map(async (item) => {
    const content = await decodeGitHubFile(item, defaultBranch);
    return content === null ? [] : detectManifestCandidates(item.path ?? item.name ?? '', content);
  }));

  const detections: GitHubDetection[] = [];
  let failed = false;
  for (const result of settled) {
    if (result.status === 'fulfilled') detections.push(...result.value);
    else failed = true;
  }
  return { detections: dedupeDetections(detections), warnings: failed ? ['manifest_fetch_partial'] : [] };
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function detectSbom(ref: GitHubRepositoryRef): Promise<{ detections: GitHubDetection[]; warnings: string[] }> {
  const generateUrl = githubUrl(ref, '/dependency-graph/sbom/generate-report');
  let generate: Response;
  try {
    generate = await githubFetch(generateUrl);
  } catch (error) {
    return { detections: [], warnings: [error instanceof Error ? error.message : 'sbom_generate_failed'] };
  }
  if (generate.status === 403 || generate.status === 404) return { detections: [], warnings: ['sbom_unavailable'] };
  if (generate.status !== 201) return { detections: [], warnings: ['sbom_generate_failed'] };

  let generatePayload: unknown;
  try { generatePayload = await generate.json(); } catch { return { detections: [], warnings: ['sbom_generate_failed'] }; }
  if (!isPlainObject(generatePayload) || typeof generatePayload.sbom_url !== 'string') {
    return { detections: [], warnings: ['sbom_generate_failed'] };
  }
  const match = /\/dependency-graph\/sbom\/fetch-report\/([^/?#]+)$/.exec(generatePayload.sbom_url);
  if (!match || !/^[A-Za-z0-9-]{16,80}$/.test(match[1])) return { detections: [], warnings: ['sbom_generate_failed'] };
  const reportUrl = githubUrl(ref, `/dependency-graph/sbom/fetch-report/${encodeURIComponent(match[1])}`);

  for (let attempt = 0; attempt < GITHUB_IMPORT_MAX_POLLS; attempt += 1) {
    let report: Response;
    try {
      report = await githubFetch(reportUrl);
    } catch (error) {
      return { detections: [], warnings: [error instanceof Error ? error.message : 'sbom_fetch_failed'] };
    }
    if (report.status === 202) {
      const hinted = Number(report.headers.get('X-Poll-Interval') ?? 1);
      await delay(Math.min(Math.max(Number.isFinite(hinted) ? hinted : 1, 1), 2) * 1000);
      continue;
    }
    if (report.status === 403 || report.status === 404) return { detections: [], warnings: ['sbom_unavailable'] };
    if (!report.ok) return { detections: [], warnings: ['sbom_fetch_failed'] };

    const length = Number(report.headers.get('Content-Length') ?? 0);
    if (length > GITHUB_IMPORT_MAX_SBOM_BYTES) return { detections: [], warnings: ['sbom_too_large'] };
    let text: string;
    try { text = await report.text(); } catch { return { detections: [], warnings: ['sbom_fetch_failed'] }; }
    if (text.length > GITHUB_IMPORT_MAX_SBOM_BYTES) return { detections: [], warnings: ['sbom_too_large'] };
    try {
      return { detections: detectSbomCandidates(JSON.parse(text)), warnings: [] };
    } catch {
      return { detections: [], warnings: ['sbom_parse_failed'] };
    }
  }
  return { detections: [], warnings: ['sbom_pending_timeout'] };
}

export async function analyzePublicGitHubRepository(
  input: string,
  onProgress?: (progress: GitHubImportProgress) => void
): Promise<GitHubImportAnalysis> {
  const ref = parseGitHubRepositoryUrl(input);
  if (!ref) throw new Error('invalid_repository_url');

  onProgress?.('repository');
  const repoResponse = await githubFetch(githubUrl(ref));
  if (repoResponse.status === 404) throw new Error('repository_not_found');
  if (!repoResponse.ok) throw new Error('repository_lookup_failed');
  const repoData = await repoResponse.json() as GitHubRepoResponse;
  if (repoData.private) throw new Error('private_repository_not_supported');
  const defaultBranch = typeof repoData.default_branch === 'string' && repoData.default_branch ? repoData.default_branch : 'main';
  const htmlUrl = typeof repoData.html_url === 'string' && repoData.html_url ? repoData.html_url : `https://github.com/${ref.owner}/${ref.repo}`;

  onProgress?.('manifests');
  const manifestPromise = detectRootManifests(ref, defaultBranch);
  onProgress?.('sbom');
  const sbomPromise = detectSbom(ref);
  const [manifest, sbom] = await Promise.all([manifestPromise, sbomPromise]);

  onProgress?.('complete');
  return {
    repository: { ...ref, defaultBranch, htmlUrl },
    detections: dedupeDetections([...manifest.detections, ...sbom.detections]),
    warnings: [...new Set([...manifest.warnings, ...sbom.warnings])]
  };
}
