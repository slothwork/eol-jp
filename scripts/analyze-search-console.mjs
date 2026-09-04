import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const headerAliases = {
  query: ['上位のクエリ', 'クエリ', 'Query', 'Queries'],
  page: ['上位のページ', 'ページ', 'Page', 'Pages'],
  clicks: ['クリック数', 'Clicks'],
  impressions: ['表示回数', 'Impressions'],
  ctr: ['CTR', '平均CTR', 'Average CTR'],
  position: ['掲載順位', '平均掲載順位', 'Position', 'Average position']
};

function cleanHeader(value) {
  return value.replace(/^\uFEFF/, '').trim();
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows.filter((item) => item.some((value) => value.trim() !== ''));
}

function findHeader(headers, key) {
  const aliases = headerAliases[key];
  return headers.findIndex((header) => aliases.some((alias) => cleanHeader(header).toLowerCase() === alias.toLowerCase()));
}

function parseNumber(value) {
  if (value == null) return null;
  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseCtr(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.endsWith('%')) {
    const number = parseNumber(normalized.slice(0, -1));
    return number == null ? null : number / 100;
  }
  const number = parseNumber(normalized);
  if (number == null) return null;
  return number > 1 ? number / 100 : number;
}

function productSlugFromPage(value) {
  if (!value) return null;
  try {
    const url = new URL(value, 'https://eol.slothwright.com');
    const match = url.pathname.match(/^\/eol\/([^/]+)\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function normalizeSearchConsoleCsv(text) {
  const csv = parseCsv(text);
  if (csv.length < 2) throw new Error('CSVにデータ行がありません。');

  const headers = csv[0].map(cleanHeader);
  const indexes = Object.fromEntries(Object.keys(headerAliases).map((key) => [key, findHeader(headers, key)]));
  for (const key of ['clicks', 'impressions', 'ctr', 'position']) {
    if (indexes[key] < 0) throw new Error(`必須列が見つかりません: ${key}`);
  }
  if (indexes.query < 0 && indexes.page < 0) {
    throw new Error('クエリ列またはページ列が見つかりません。Search Consoleの検索パフォーマンスCSVを指定してください。');
  }

  return csv.slice(1).map((row) => {
    const query = indexes.query >= 0 ? row[indexes.query]?.trim() || null : null;
    const page = indexes.page >= 0 ? row[indexes.page]?.trim() || null : null;
    return {
      query,
      page,
      productSlug: productSlugFromPage(page),
      clicks: parseNumber(row[indexes.clicks]) ?? 0,
      impressions: parseNumber(row[indexes.impressions]) ?? 0,
      ctr: parseCtr(row[indexes.ctr]) ?? 0,
      position: parseNumber(row[indexes.position])
    };
  }).filter((row) => row.position != null && row.impressions > 0);
}

function rowLabel(row) {
  if (row.query && row.page) return `${row.query} → ${row.page}`;
  return row.query ?? row.page ?? '(不明)';
}

function opportunityScore(row, ctrThreshold) {
  return row.impressions * Math.max(ctrThreshold - row.ctr, 0);
}

export function analyzeSearchConsoleRows(rows, options = {}) {
  const minImpressions = options.minImpressions ?? 20;
  const ctrThreshold = options.ctrThreshold ?? 0.03;
  const maxPosition = options.maxPosition ?? 20;
  const top = options.top ?? 30;

  const eligible = rows.filter((row) => row.impressions >= minImpressions && row.position <= maxPosition);
  const ctrCandidates = eligible
    .filter((row) => row.position <= 10 && row.ctr < ctrThreshold)
    .sort((a, b) => opportunityScore(b, ctrThreshold) - opportunityScore(a, ctrThreshold) || b.impressions - a.impressions)
    .slice(0, top);
  const rankingCandidates = eligible
    .filter((row) => row.position > 10 && row.position <= maxPosition)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, top);

  return { minImpressions, ctrThreshold, maxPosition, top, eligible, ctrCandidates, rankingCandidates };
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function table(rows) {
  if (rows.length === 0) return '_該当なし_';
  const lines = [
    '| 対象 | Product | Clicks | Impressions | CTR | Position |',
    '| --- | --- | ---: | ---: | ---: | ---: |'
  ];
  for (const row of rows) {
    lines.push(`| ${escapeCell(rowLabel(row))} | ${escapeCell(row.productSlug ?? '')} | ${row.clicks} | ${row.impressions} | ${percent(row.ctr)} | ${row.position.toFixed(1)} |`);
  }
  return lines.join('\n');
}

export function renderReport(rows, analysis, sourceName = 'Search Console export') {
  const mode = rows.some((row) => row.query && row.page)
    ? 'query + page'
    : rows.some((row) => row.query)
      ? 'query'
      : 'page';

  return `# Search Console CTR改善候補\n\n- Source: ${sourceName}\n- Dimension: ${mode}\n- Rows: ${rows.length}\n- Filter: impressions >= ${analysis.minImpressions}, position <= ${analysis.maxPosition}\n- CTR candidate: position <= 10 and CTR < ${percent(analysis.ctrThreshold)}\n\n## CTR改善候補\n\n検索順位が1ページ目にあるのにCTRが低い行です。タイトル・description・検索意図との一致を優先して確認します。\n\n${table(analysis.ctrCandidates)}\n\n## 順位改善候補\n\n表示回数はあるものの平均掲載順位が11〜${analysis.maxPosition}位の行です。CTR変更より先に、本文・内部リンク・検索意図との一致を確認します。\n\n${table(analysis.rankingCandidates)}\n\n## 運用メモ\n\n- CTR候補は表示回数とCTR差から優先順位を付けています。3%は期待CTRの予測値ではなく、初期レビュー用の保守的な閾値です。\n- 掲載順位によって自然なCTRは大きく変わるため、CTRだけで良否を断定しません。\n- 実際にタイトルを変更する前に、該当ページをSearch Consoleでフィルタし、そのページに紐づくクエリを確認します。\n`;
}

function parseArgs(argv) {
  const options = { input: null, output: null, minImpressions: 20, ctrThreshold: 0.03, maxPosition: 20, top: 30 };
  for (const arg of argv) {
    if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length);
    else if (arg.startsWith('--min-impressions=')) options.minImpressions = Number(arg.slice('--min-impressions='.length));
    else if (arg.startsWith('--ctr-threshold=')) options.ctrThreshold = Number(arg.slice('--ctr-threshold='.length));
    else if (arg.startsWith('--max-position=')) options.maxPosition = Number(arg.slice('--max-position='.length));
    else if (arg.startsWith('--top=')) options.top = Number(arg.slice('--top='.length));
    else if (!arg.startsWith('--') && !options.input) options.input = arg;
    else throw new Error(`不明な引数です: ${arg}`);
  }
  if (!options.input) throw new Error('CSVファイルを指定してください。例: npm run analyze:gsc -- Queries.csv');
  for (const [key, value] of Object.entries(options)) {
    if (['input', 'output'].includes(key)) continue;
    if (!Number.isFinite(value) || value < 0) throw new Error(`不正な数値オプションです: ${key}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(options.input);
  const text = await fs.readFile(inputPath, 'utf8');
  const rows = normalizeSearchConsoleCsv(text);
  const analysis = analyzeSearchConsoleRows(rows, options);
  const report = renderReport(rows, analysis, path.basename(inputPath));

  if (options.output) {
    const outputPath = path.resolve(options.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, report, 'utf8');
    console.log(`Search Console report written: ${outputPath}`);
  } else {
    process.stdout.write(report);
  }
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
