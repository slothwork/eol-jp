import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SNAPSHOT_PATH = 'src/data/eol-snapshot.json';
const SOURCE_URL = 'https://endoflife.date/api/v1/products/full';
const HOUR = 60 * 60 * 1000;

function countReleases(snapshot) {
  return snapshot.products.reduce((sum, product) => sum + product.releases.length, 0);
}

function findDuplicateItems(snapshot, errors) {
  const slugs = new Set();
  for (const product of snapshot.products) {
    if (!product || typeof product.slug !== 'string' || !product.slug || product.slug.includes('/')) {
      errors.push('製品slugが不正です');
      continue;
    }
    if (slugs.has(product.slug)) errors.push('重複した製品slug: ' + product.slug);
    slugs.add(product.slug);
    if (!Array.isArray(product.releases) || product.releases.length === 0) {
      errors.push('リリースが存在しない製品: ' + product.slug);
      continue;
    }
    const releases = new Set();
    for (const release of product.releases) {
      if (!release || typeof release.name !== 'string' || !release.name) {
        errors.push('不正なリリース名: ' + product.slug);
        continue;
      }
      if (releases.has(release.name)) errors.push('重複したリリース名: ' + product.slug + ' / ' + release.name);
      releases.add(release.name);
    }
  }
}

export function validateEolSnapshot(previous, next, now = new Date()) {
  const errors = [];
  if (!previous || !next || !Array.isArray(previous.products) || !Array.isArray(next.products)) {
    return { ok: false, errors: ['スナップショットのproducts配列が不正です'], metrics: {} };
  }

  if (next.sourceUrl !== SOURCE_URL) errors.push('取得元URLが想定と異なります');
  if (next.schemaVersion !== previous.schemaVersion) errors.push('APIスキーマのバージョンが変化しました。正規化の確認が必要です');

  const previousTime = Date.parse(previous.generatedAt);
  const nextTime = Date.parse(next.generatedAt);
  const nowTime = now.getTime();
  if (!Number.isFinite(previousTime) || !Number.isFinite(nextTime)) {
    errors.push('generatedAtが不正です');
  } else {
    if (nextTime < previousTime) errors.push('取得データの生成日時が前回より古くなりました');
    if (nextTime > nowTime + 24 * HOUR) errors.push('生成日時が未来すぎます');
    if (nowTime - nextTime > 168 * HOUR) errors.push('取得データが7日以上古い状態です');
  }

  findDuplicateItems(next, errors);
  const previousProductCount = previous.products.length;
  const nextProductCount = next.products.length;
  const oldReleaseCount = countReleases(previous);
  const newReleaseCount = countReleases(next);
  if (previousProductCount === 0 || oldReleaseCount === 0) {
    errors.push('比較元の製品・リリース数が不正です');
  } else {
    if (nextProductCount < previousProductCount * 0.9) errors.push('製品数が10%以上減少しています');
    if (nextProductCount > previousProductCount * 1.3) errors.push('製品数が30%以上増加しています');
    if (newReleaseCount < oldReleaseCount * 0.9) errors.push('リリース数が10%以上減少しています');
    if (newReleaseCount > oldReleaseCount * 1.3) errors.push('リリース数が30%以上増加しています');
  }

  let removedProducts = 0;
  let removedReleases = 0;
  let changedEol = 0;
  let changedSupport = 0;

  for (const product of previous.products) {
    const updated = next.products.find((entry) => entry.slug === product.slug);
    if (!updated) {
      removedProducts++;
      removedReleases += product.releases.length;
      continue;
    }
    const updatedReleases = new Map(updated.releases.map((release) => [release.name, release]));
    for (const release of product.releases) {
      const current = updatedReleases.get(release.name);
      if (!current) {
        removedReleases++;
        continue;
      }
      if ((current.eolFrom ?? null) !== (release.eolFrom ?? null)) changedEol++;
      if ((current.eoasFrom ?? null) !== (release.eoasFrom ?? null)) changedSupport++;
    }
  }
  if (previousProductCount && removedProducts > Math.max(8, Math.floor(previousProductCount * 0.05))) {
    errors.push('既存製品の削除が5%を超えています');
  }
  if (oldReleaseCount && removedReleases > Math.max(50, Math.floor(oldReleaseCount * 0.05))) {
    errors.push('既存リリースの削除が5%を超えています');
  }
  const changeLimit = Math.max(40, Math.ceil(oldReleaseCount * 0.015));
  if (changedEol > changeLimit) errors.push('EOL日の大量変更を検出しました');
  if (changedSupport > changeLimit) errors.push('サポート終了日の大量変更を検出しました');

  const metrics = {
    products: [previousProductCount, nextProductCount],
    releases: [oldReleaseCount, newReleaseCount],
    removedProducts,
    removedReleases,
    changedEol,
    changedSupport
  };
  return { ok: errors.length === 0, errors, metrics };
}

async function main() {
  const argument = process.argv.find((item) => item.startsWith('--base-ref='));
  const baseRef = argument ? argument.slice('--base-ref='.length) : 'HEAD';
  if (!/^[a-zA-Z0-9_./-]+$/.test(baseRef)) throw new Error('base-refが不正です');
  const baseline = JSON.parse(execFileSync('git', ['show', baseRef + ':' + SNAPSHOT_PATH], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  const next = JSON.parse(await readFile(resolve(SNAPSHOT_PATH), 'utf8'));
  const result = validateEolSnapshot(baseline, next);
  console.log('EOL同期データ検証: ' + JSON.stringify(result.metrics));
  for (const error of result.errors) console.error('::error title=EOL同期の安全性チェック::' + error);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
