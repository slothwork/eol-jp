import { dedupeDetections } from './github-import-detection.ts';
import type {
  GitHubDetection,
  ImportCatalogProduct,
  ImportConflict,
  ImportResolution,
  ImportUnmatched,
  ResolvedImportCandidate
} from './github-import-types.ts';

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

export function resolveImportCandidates(
  detections: GitHubDetection[],
  catalog: ImportCatalogProduct[]
): ImportResolution {
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
