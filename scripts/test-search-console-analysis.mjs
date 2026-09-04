import assert from 'node:assert/strict';
import {
  analyzeSearchConsoleRows,
  normalizeSearchConsoleCsv,
  parseCsv,
  renderReport
} from './analyze-search-console.mjs';

const parsed = parseCsv('a,"b,c"\n1,"x""y"\n');
assert.deepEqual(parsed, [['a', 'b,c'], ['1', 'x"y']]);

const japaneseCsv = `上位のクエリ,クリック数,表示回数,CTR,掲載順位\nNode.js EOL,4,400,1%,4.2\nPython EOL,20,300,6.67%,3.1\nUbuntu EOL,2,180,1.11%,13.4\n`;
const queryRows = normalizeSearchConsoleCsv(japaneseCsv);
assert.equal(queryRows.length, 3);
assert.equal(queryRows[0].query, 'Node.js EOL');
assert.equal(queryRows[0].ctr, 0.01);

const queryAnalysis = analyzeSearchConsoleRows(queryRows, { minImpressions: 20, ctrThreshold: 0.03, maxPosition: 20 });
assert.deepEqual(queryAnalysis.ctrCandidates.map((row) => row.query), ['Node.js EOL']);
assert.deepEqual(queryAnalysis.rankingCandidates.map((row) => row.query), ['Ubuntu EOL']);

const englishPageCsv = `Page,Clicks,Impressions,CTR,Position\nhttps://eol.slothwright.com/eol/nodejs/,8,500,1.6%,5.5\nhttps://eol.slothwright.com/eol/python/,30,600,5%,3.2\nhttps://eol.slothwright.com/about/,1,100,1%,9.0\n`;
const pageRows = normalizeSearchConsoleCsv(englishPageCsv);
assert.equal(pageRows[0].productSlug, 'nodejs');
assert.equal(pageRows[1].productSlug, 'python');
assert.equal(pageRows[2].productSlug, null);

const pageAnalysis = analyzeSearchConsoleRows(pageRows);
assert.deepEqual(pageAnalysis.ctrCandidates.map((row) => row.productSlug), ['nodejs', null]);

const report = renderReport(queryRows, queryAnalysis, 'Queries.csv');
assert.match(report, /Node\.js EOL/);
assert.match(report, /Ubuntu EOL/);
assert.match(report, /3\.00%/);

assert.throws(
  () => normalizeSearchConsoleCsv('Query,Clicks\nfoo,1\n'),
  /必須列が見つかりません/
);

console.log('Search Console analysis tests passed.');
