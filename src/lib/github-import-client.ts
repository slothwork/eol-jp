import {
  dedupeDetections,
  detectManifestCandidates,
  detectSbomCandidates,
  parseGitHubRepositoryUrl
} from './github-import-detection.ts';
import {
  GITHUB_IMPORT_MAX_MANIFEST_BYTES,
  GITHUB_IMPORT_MAX_POLLS,
  GITHUB_IMPORT_MAX_SBOM_BYTES,
  type GitHubDetection,
  type GitHubImportAnalysis,
  type GitHubImportProgress,
  type GitHubRepositoryRef
} from './github-import-types.ts';

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

async function detectRootManifests(
  ref: GitHubRepositoryRef,
  defaultBranch: string
): Promise<{ detections: GitHubDetection[]; warnings: string[] }> {
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
