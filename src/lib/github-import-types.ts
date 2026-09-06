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
