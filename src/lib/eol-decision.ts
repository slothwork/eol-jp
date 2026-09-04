import { daysUntil } from './date.ts';

export type DecisionStatus = 'ended' | 'critical' | 'warning' | 'planning' | 'supported' | 'unknown';

export type DecisionRelease = {
  name: string;
  releaseDate: string | null;
  eolFrom: string | null;
  isLts: boolean;
  isEol: boolean;
  isMaintained: boolean;
};

export function statusForRelease(release: DecisionRelease): DecisionStatus {
  const days = daysUntil(release.eolFrom);
  if (release.isEol || (days !== null && days < 0)) return 'ended';
  if (days === null) return release.isMaintained ? 'supported' : 'unknown';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'warning';
  if (days <= 180) return 'planning';
  return 'supported';
}

export function nearestUpcomingEolRelease<T extends DecisionRelease>(releases: T[]): T | null {
  return releases
    .filter((release) => statusForRelease(release) !== 'ended')
    .filter((release) => {
      const days = daysUntil(release.eolFrom);
      return days !== null && days >= 0;
    })
    .sort((a, b) => {
      const byEol = (a.eolFrom ?? '9999-12-31').localeCompare(b.eolFrom ?? '9999-12-31');
      if (byEol !== 0) return byEol;
      return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
    })[0] ?? null;
}

function isCandidateNewerThanSource(candidate: DecisionRelease, source: DecisionRelease): boolean {
  if (!source.releaseDate || !candidate.releaseDate) return false;
  if (candidate.releaseDate <= source.releaseDate) return false;

  if (source.eolFrom && candidate.eolFrom && candidate.eolFrom <= source.eolFrom) {
    return false;
  }

  return true;
}

export function chooseRecommendedTarget<T extends DecisionRelease>(releases: T[], source: T): T | null {
  if (!source.releaseDate) return null;

  const candidates = releases
    .filter((candidate) => candidate.name !== source.name)
    .filter((candidate) => {
      const status = statusForRelease(candidate);
      return status !== 'ended' && status !== 'unknown';
    })
    .filter((candidate) => isCandidateNewerThanSource(candidate, source))
    .sort((a, b) => {
      if (a.isLts !== b.isLts) return a.isLts ? -1 : 1;

      const aHasEol = Boolean(a.eolFrom);
      const bHasEol = Boolean(b.eolFrom);
      if (aHasEol !== bHasEol) return aHasEol ? -1 : 1;

      if (a.eolFrom && b.eolFrom && a.eolFrom !== b.eolFrom) {
        return b.eolFrom.localeCompare(a.eolFrom);
      }

      return (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
    });

  return candidates[0] ?? null;
}
