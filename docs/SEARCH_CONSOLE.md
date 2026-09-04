# Search Console CTR improvement workflow

## Purpose

Search Console の実クエリ・実ページデータを使って、表示回数があるのにクリックされていない検索結果を優先的に改善する。

推測だけで主要製品の `<title>` / meta description を一括変更しない。変更対象は Search Console で根拠を確認できたページに限定する。

## Recommended review window

初期は直近28日を基本とする。

サイト立ち上げ直後で表示回数が少ない場合は、データ量に応じて過去3か月まで広げてもよい。ただし期間を変えたレポート同士を単純比較しない。

## Export from Search Console

1. Search Console で EOL情報.jp のプロパティを開く。
2. `検索結果` のパフォーマンスレポートを開く。
3. `クリック数`、`表示回数`、`平均CTR`、`平均掲載順位` を有効にする。
4. 期間を直近28日にする。
5. クエリを分析する場合は `クエリ` タブからCSVをエクスポートする。
6. ページを分析する場合は `ページ` タブからCSVをエクスポートする。
7. 特定ページのtitleを変更する前は、そのページを完全一致でフィルタしてから `クエリ` タブをエクスポートし、実際にどの検索語で表示されているか確認する。

Search Console のエクスポートファイルは `search-console/` 配下へ置いてよい。このディレクトリの CSV / TSV / XLSX は `.gitignore` 対象で、GitHubへコミットしない。

## Analyze CSV

```bash
npm run analyze:gsc -- search-console/Queries.csv
```

Markdownレポートとして保存する場合:

```bash
npm run analyze:gsc -- search-console/Queries.csv --output=search-console/query-opportunities.md
```

表示回数の閾値を変更する場合:

```bash
npm run analyze:gsc -- search-console/Queries.csv --min-impressions=50
```

その他のオプション:

```text
--ctr-threshold=0.03
--max-position=20
--top=30
```

日本語UI・英語UIのSearch Console CSVヘッダーに対応する。

## How candidates are classified

### CTR改善候補

初期条件:

- 表示回数 >= 20
- 平均掲載順位 <= 10
- CTR < 3%

3%は「本来得られるはずのCTR」の予測値ではない。初期レビュー対象を絞るための保守的な閾値としてのみ使う。

確認順序:

1. ページをSearch Consoleで完全一致フィルタする。
2. そのページの実クエリを確認する。
3. 現在のtitle・description・H1が検索意図と一致しているか確認する。
4. titleが長すぎないか、定型文だけになっていないか確認する。
5. 必要な場合だけ `src/data/product-seo.ts` に製品単位のoverrideを追加する。
6. 変更理由を `rationale` に残す。
7. リリース後、同じ期間条件でCTRの変化を確認する。

### 順位改善候補

初期条件:

- 表示回数 >= 20
- 平均掲載順位 11〜20位

この場合、titleだけを変更しても効果が限定的な可能性が高い。先に以下を確認する。

- 検索クエリに対する本文の回答性。
- バージョン別データの充実度。
- 公式ソース・移行ガイドの有無。
- 関連ページからの内部リンク。
- 独自日本語summaryの追加余地。

## Product SEO overrides

製品ページの通常メタデータは共通ロジックで生成する。

```text
{製品名}のEOL・サポート終了日 | EOL情報.jp
```

Search Console のデータで改善根拠が確認できた製品だけ `src/data/product-seo.ts` へ追加する。

```ts
nodejs: {
  title: 'Node.jsのEOL・LTSサポート期限',
  description: '...',
  rationale: 'Search Consoleで「Node.js LTS EOL」の表示回数が多くCTRが低い'
}
```

`rationale` は画面には表示しない。後から「なぜこの製品だけtitleが違うのか」を追跡するために残す。

## Review cadence

サイト立ち上げ初期は毎日変更しない。

- 基本: 2〜4週間単位でレビュー。
- 大きな表示回数増加があったページは個別確認。
- 一度に多数のtitleを変更せず、少数ページずつ変更して結果を追跡する。
- 検索順位が大きく変動した期間はCTRだけで結論を出さない。

## Google references

- Search Console パフォーマンスレポート: https://support.google.com/webmasters/answer/7576553?hl=ja
- 表示回数・掲載順位・クリック数: https://support.google.com/webmasters/answer/7042828?hl=ja
- タイトルリンク: https://developers.google.com/search/docs/appearance/title-link?hl=ja
