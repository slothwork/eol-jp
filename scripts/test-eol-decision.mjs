import assert from 'node:assert/strict';
import {
  chooseRecommendedTarget,
  nearestUpcomingEolRelease,
  statusForRelease
} from '../src/lib/eol-decision.ts';

function release(overrides = {}) {
  return {
    name: '1.0',
    releaseDate: '2090-01-01',
    eolFrom: '2095-01-01',
    isLts: false,
    isEol: false,
    isMaintained: true,
    ...overrides
  };
}

{
  const latest = release({ name: '3.0', releaseDate: '2093-01-01', eolFrom: '2099-01-01' });
  const nearest = release({ name: '2.0', releaseDate: '2092-01-01', eolFrom: '2097-01-01' });
  const unknown = release({ name: '4.0', releaseDate: '2094-01-01', eolFrom: null, isMaintained: true });

  assert.equal(nearestUpcomingEolRelease([latest, unknown, nearest])?.name, '2.0');
}

{
  const source = release({ name: '1.0', releaseDate: '2090-01-01', eolFrom: '2095-01-01' });
  const newerNonLts = release({ name: '3.0', releaseDate: '2092-01-01', eolFrom: '2099-01-01' });
  const newerLts = release({ name: '2.0', releaseDate: '2091-01-01', eolFrom: '2098-01-01', isLts: true });

  assert.equal(chooseRecommendedTarget([source, newerNonLts, newerLts], source)?.name, '2.0');
}

{
  const source = release({ name: '2.0', releaseDate: '2092-01-01', eolFrom: '2096-01-01' });
  const olderLts = release({ name: '1.0', releaseDate: '2091-01-01', eolFrom: '2099-01-01', isLts: true });
  const newer = release({ name: '3.0', releaseDate: '2093-01-01', eolFrom: '2098-01-01' });

  assert.equal(chooseRecommendedTarget([source, olderLts, newer], source)?.name, '3.0');
}

{
  const source = release({ name: '1.0', releaseDate: '2090-01-01', eolFrom: '2096-01-01' });
  const unknownSupport = release({ name: '2.0', releaseDate: '2091-01-01', eolFrom: null, isMaintained: false, isLts: true });
  const knownSupported = release({ name: '3.0', releaseDate: '2092-01-01', eolFrom: '2098-01-01' });

  assert.equal(statusForRelease(unknownSupport), 'unknown');
  assert.equal(chooseRecommendedTarget([source, unknownSupport, knownSupported], source)?.name, '3.0');
}

{
  const sourceWithoutDate = release({ name: '1.0', releaseDate: null, eolFrom: '2096-01-01' });
  const candidate = release({ name: '2.0', releaseDate: '2092-01-01', eolFrom: '2098-01-01', isLts: true });

  assert.equal(chooseRecommendedTarget([sourceWithoutDate, candidate], sourceWithoutDate), null);
}

{
  const source = release({ name: '1.0', releaseDate: '2090-01-01', eolFrom: '2098-01-01' });
  const shorterLts = release({ name: '2.0', releaseDate: '2091-01-01', eolFrom: '2097-01-01', isLts: true });
  const viable = release({ name: '3.0', releaseDate: '2092-01-01', eolFrom: '2099-01-01' });

  assert.equal(chooseRecommendedTarget([source, shorterLts, viable], source)?.name, '3.0');
}

console.log('EOL decision tests passed.');
