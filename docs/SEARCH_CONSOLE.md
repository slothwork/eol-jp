# Search Console CTR improvement workflow

## Purpose

Search Console の実クエリ・実ページデータを使って、表示回数があるのにクリックされていない検索結果を優先的に改善する。

推測だけで主要製品の `<title>` / meta description を一括変更しない。変更対象は Search Console で根拠を確認できたページに限定する。

## インデックス登録前の確認

Search Console の URL 検査が「クロール済み - インデックス未登録」の場合、まず技術的なブロックとサイトマップ認識を確認する。

1. URL 検査で「クロールを許可」「ページの取得」「インデックス登録を許可」が正常であることを確認する。
2. 正規 URL が検査対象 URL と一致していることを確認する。
3. Search Console の「サイトマップ」で `https://eol.slothwright.com/sitemap.xml` を送信し、取得成功を確認する。
4. `robots.txt` が同じ sitemap URL を案内していることを確認する。
5. ホーム、`/eol/`、`/releases/`、主要製品ページなど少数の重要 URL だけ URL 検査からインデックス登録をリクエストする。
6. リクエスト後に title / description を連日変更せず、クロール・インデックス状況の推移を確認する。

ビルド後の sitemap は `npm run test:sitemap` で検証する。indexable な canonical URL が sitemap に含まれ、`noindex` URL が含まれないこと、`robots.txt` の sitemap 指定と一致することを自動確認する。

## 登録件数と未登録理由の正しい確認

Sitemaps APIの `contents[].indexed` は廃止されているため、値が0でも「サイト全体が未登録」と判断しない。Windsor等の連携で公開されている `indexed` も登録件数の判定には使わない。sitemapからはURL件数、取得日時、error / warningだけを確認する。検索表示回数0も、未登録の直接的な証拠ではない。

- 全体: Search Consoleの「ページのインデックス登録」で登録件数・未登録理由別件数・レポート更新日を確認する。
- 個別: ホームと代表製品ページのURL検査で最終クロール日時、取得結果、robots許可、登録許可、ユーザー指定とGoogle選択のcanonicalを確認する。
- 現在の取得可否: 「公開URLをテスト」で確認する。テスト成功はインデックス登録済みを意味しない。
- 連携がURL検査を提供しない場合は該当画面のスクリーンショットを依頼する。過去の検査結果を現在の結果として流用しない。

| 確認できた状態 | 次の調査・対策 |
| --- | --- |
| robots / noindexによる除外 | 意図した除外かを確認し、対象ページだけ修正 |
| 取得失敗・403・5xx | 公開URLテストとCloudflare側のイベントを突き合わせる。通常クライアントの失敗だけでGooglebot遮断と判断しない |
| Googleが別のcanonicalを選択 | 重複URL、redirect、内部リンク、canonicalの整合性を調査 |
| 検出済み・未クロール | sitemap認識、内部導線、配信安定性を確認 |
| クロール済み・未登録、取得・正規化が正常 | 代表3〜5ページで独自情報・本文の回答性・重複を監査。不足が確認できた点だけ改善し、同じURLで経過を見る |

検索表示回数を必要とするCTR改善と、インデックス未登録の原因調査は区別する。原因調査は表示回数がない段階でも進める。固定日数の経過だけで大量のページ削除・noindex化・本文生成へ進まない。

出典: https://developers.google.com/webmaster-tools/v1/sitemaps

## 2026-11-21 GSCインデックス登録ゼロの基準点（Issue #129 → #134）

ユーザー提供のGoogle Search Console画像により、従来未取得だったページ登録レポート、サイトマップ、代表2 URLの**公開URLテスト**を確認した。

| 指標 | 2026-11-21時点の画面 |
| --- | --- |
| 登録済み | **0ページ** |
| 未登録 | **473ページ** |
| 検出 - インデックス未登録 | **452ページ** |
| クロール済み - インデックス未登録 | **21ページ** |
| サイトマップ | `https://eol.slothwright.com/sitemap.xml` |
| サイトマップ取得 | **成功**、最終読み込み **2026-11-15**、検出ページ **473** |
| トップ公開URLテスト | 2026-11-21 09:32 JST、クロール許可・ページ取得・index許可が正常 |
| Node.js公開URLテスト | 2026-11-21 09:34 JST、クロール許可・ページ取得・index許可が正常 |

両ページの「Googleが選択した正規URL」は「インデックス登録後にのみ決定されます」。そのためライブテストの「URLはGoogleに登録できます」は、**登録済みの証拠ではない**。

### 状態別の切り分け

- **452件（検出・未クロール）**: URLはGoogleに認識されているが、まだクロールされていない。サイトマップ登録成功・代表URLのライブテスト成功だけでは、全473ページのクロール需要や取得可否を保証しない。ページ一覧から3〜5件を選び、静的HTMLの内部リンク、robots、noindex、canonical、ステータスコード、サイトマップ掲載状況を確認する。
- **21件（クロール済み・未登録）**: 取得後にGoogleがインデックス登録していない。検証ステータス「失敗しました」は**修正の検証が通らなかった表示**であり、HTTP取得失敗と同義ではない。代表ページの独自情報、検索意図への回答、競合・出典との差別化、関連ページへの導線を調べる。
- **サイト側の技術的障害**: トップとNode.jsのライブテストでは取得成功・クロール許可・index許可を確認。全URLに同一の技術原因があるとは現時点で言えない。

### 次の進め方

1. GSCの「検出 - インデックス未登録」と「クロール済み - インデックス未登録」それぞれの詳細にある代表URLを取得して、サイトの生成結果・リンク元と照合する。
2. ホーム、Node.js、Python、PHP、Ubuntuのうち3〜5ページを優先し、**実際に確認できた不足点だけ**を個別改善する。ベンダー公式の日付・商用サポート情報は一次資料を確認し、推測で追加しない。
3. 変更したURLと実行日を控え、2〜4週間後（2026-12-05〜12-19目安）にGSCの**登録済み・未登録理由別件数・最終クロール・表示回数**を同じ条件で再取得する。必要なURLに限って登録をリクエストし、短期間に連続送信しない。

調査基準点は [Issue #129](https://github.com/slothwork/eol-jp/issues/129) に記録済み。**登録済み0件からの改善は [Issue #134](https://github.com/slothwork/eol-jp/issues/134) で継続**する。0件の原因がすべて「低品質」であると断定しない。URL Inspection APIの保存済み検査とライブテストは別の情報源として扱う。

Google公式資料：
- https://support.google.com/webmasters/answer/7440203?hl=ja
- https://support.google.com/webmasters/answer/9012289?hl=ja
- https://developers.google.com/crawling/docs/crawl-budget

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
