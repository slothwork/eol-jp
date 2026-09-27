# 現在の状態

最終更新: 2026-09-26

この文書は履歴保管ではなく、プロジェクトの「今」を短時間で把握するために使う。目的・制約は `docs/PROJECT.md`、重要な判断理由は `docs/DECISIONS.md`、中期計画は `ROADMAP.md` を参照する。

## 現在のフェーズ

公開後改善 / Growth gate。

Phase 0〜6の公開・通知・信頼性情報・GitHub Import・運用・テスト基盤は完了済み。現在はSearch Consoleのインデックス反映と検索実データを待ち、Phase 7のデータ駆動改善へ入る条件を確認している。

`ai-design-template` の初回パイロットも完了し、既存UXを大きく変えずにDesign replaceabilityを改善できることを確認した。デザイン改善自体を次の作業目的にはせず、新しい課題・Reference design・利用データ等の根拠が生じた場合に再開する。

## 完了したこと

直近の重要な完了事項:

- 一覧・比較画面を高密度テーブル中心へ整理
- 製品詳細のバージョンサポート表を5列構成へ整理
- `/releases/` とページング・性能対策を公開
- sitemapと全indexable canonical HTMLのCI整合性検証を追加
- Search Consoleへsitemap送信、主要URLのインデックス登録リクエストを実施
- 外部HTTP/HTTPSリンクを別タブで開く共通処理を追加
- PR #90で `PROJECT / DECISIONS / CURRENT_STATE` を導入し、標準開発プロセスを反映
- PR #91で文書専用変更のCI軽量化を導入。通常変更と差分判定失敗時は既存のフルCIを維持
- PR #92で標準化の振り返りを追加し、文書専用の実PRで軽量CI経路を確認
- PR #93で標準化・CI軽量化完了後の現在地を確定
- PR #94でSearch ConsoleのGrowth gate観測結果を現在地へ反映
- PR #97で `ai-design-template` のDesign Baselineとsemantic design token基盤を導入
- PR #98でglobal semantic tokenの適用範囲をPerformance budgetと実際の変更波及から調整
- PR #99で主要Navigationへsemanticかつ非Color依存の現在位置表現を追加
- PR #100で高密度な情報設計に合わせてTypography hierarchyを調整
- PR #101でHeader / Footerをsemantic roleへ寄せ、共通Shellの差し替え容易性を改善

## 直近の検証結果

`PASS` — 初回Design Refinementは完了。PR #97〜#101では、既存のResponsive / Accessibility / Astro check / production build / Performance budget / browser smoke / SEO等の品質gateを維持したまま改善を行った。

特にPR #98では、global token化を広げすぎた段階でCSS Performance budget超過を検出した。budgetを緩和せず、Component内で完結するVisual valueをlocalへ戻し、Theme全体・複数Component・Domain meaningとの境界に関係する値だけをglobal semantic tokenとして残すことでPASSへ戻した。この結果を `docs/DESIGN.md` に反映済み。

2026-09-17時点で、直近のmain CI、日次EOLデータ同期、snapshot鮮度チェックに未解決の失敗は確認していない。デザイン改善や標準化を目的とした追加実装は行わない。

## 本番確認・公開後の判断

`未判定` — Growth gateは継続する。

2026-09-26の再調査結果:

- Windsor経由のSearch Consoleで `sc-domain:eol.slothwright.com` を確認。9月1日〜25日を指定した取得結果は9月3日〜23日で、クリック・表示回数はすべて0。表示0だけから全URL未登録とは断定しない。
- sitemapは463 URL、error 0、warning 0。最終取得は2026-09-25 15:27:44 UTC（9月26日 00:27:44 JST）。
- 公開サイトへの通常のHTTP GETで、ホーム、`/eol/`、`/releases/`、`/eol/nodejs/`、`/eol/python/` は200。確認したHTMLのcanonicalは本番URL自身を指し、noindexとX-Robots-Tagはない。
- 公開robots.txtは全体を許可し、本番sitemapを案内。sitemapは200で463 URL、originは本番のみ。存在しない検査用URLは404。
- これは通常のHTTP取得であり、Googlebotの取得成功やGoogleが選択したcanonicalの確認を代替しない。
- 9月16日の主要4URL「クロール済み - インデックス未登録」は過去の観測として保持する。今回の接続はURL検査・Indexing Trackerを提供していないため、現在の各URLの登録状態は未確認。
- 過去の「sitemap indexed 0」をサイト全体の登録件数の根拠に使う記述を訂正する。Google Sitemaps APIの `contents[].indexed` は廃止項目で使用不可。登録件数はSearch Console画面の「ページのインデックス登録」、個別状態はURL検査で確認する。

出典: https://developers.google.com/webmaster-tools/v1/sitemaps

確認範囲では登録を妨げる配信・SEO設定の異常は見つからない。未登録理由は未確定であり、「品質不足」や「CloudflareがGooglebotを遮断」とは断定しない。

## 作業中のこと

- 最新の「ページのインデックス登録」と主要URL検査の結果を取得し、未登録理由を切り分ける。
- 日次EOLデータ同期・snapshot鮮度・手動レビュー鮮度の既存運用を継続する。

## 次に行うこと

1. **現在の未登録理由を確認する** — ページ登録レポートの理由別件数と、ホーム・Node.jsのURL検査（最終クロール、取得結果、登録許可、ユーザー指定／Google選択canonical、公開URLテスト）を確認する。
2. **原因に対応する最小修正を行う** — 取得失敗なら配信設定、重複なら正規化を調査。取得・正規化が正常でクロール済み未登録が継続していれば、対象3〜5ページの独自情報・検索意図への回答性を監査し、根拠のある不足だけを改善する。表示回数がないことを理由に原因調査まで停止しない。
3. **結果を観測する** — 修正後の公開URLテストと必要な代表URLの登録リクエストを行い、URL検査・ページ登録レポート・検索表示を同じ対象で追う。大量再送信や連日の推測SEO変更は行わない。

## ブロッカー・重要リスク

- 現在のURL検査・ページ登録レポートが未取得。過去の未登録状態や廃止API指標を現在のサイト全体の状態として扱わない。
- インデックス反映待ちの段階で大規模なSEO変更を重ねると、何が効いたか比較できなくなる
- 文書パスが将来build / test入力になる場合は、同じ変更でCI分類を再検討する
- 新しいプロセス文書やCIロジックを増やしすぎて、管理負荷を実開発より重くしないこと
- Design replaceabilityを理由に、Component-localで十分なVisual valueまでglobal abstractionへ押し上げないこと

## 関連するPull Request / Issue

- [PR #90](https://github.com/slothwork/eol-jp/pull/90) — 企画・判断・現在地の整理。マージ済み
- [PR #91](https://github.com/slothwork/eol-jp/pull/91) — 文書専用変更のCI軽量化。マージ済み
- [PR #92](https://github.com/slothwork/eol-jp/pull/92) — 標準化の振り返りと文書専用軽量CIの実案件確認。マージ済み
- [PR #93](https://github.com/slothwork/eol-jp/pull/93) — 標準化完了後の現在地確定。マージ済み
- [PR #94](https://github.com/slothwork/eol-jp/pull/94) — Search ConsoleのGrowth gate観測結果記録。マージ済み
- [PR #97](https://github.com/slothwork/eol-jp/pull/97) — `ai-design-template` 初回適用とsemantic token基盤。マージ済み
- [PR #98](https://github.com/slothwork/eol-jp/pull/98) — semantic tokenの適用範囲調整。マージ済み
- [PR #99](https://github.com/slothwork/eol-jp/pull/99) — 主要Navigationの現在位置表現。マージ済み
- [PR #100](https://github.com/slothwork/eol-jp/pull/100) — Typography hierarchy調整。マージ済み
- [PR #101](https://github.com/slothwork/eol-jp/pull/101) — Header / Footer Presentation整理。マージ済み

## 最終更新時の補足

日次同期で `main` は継続的に進むため、最新SHAや一時的なCI run番号はこの文書へ固定しない。新しいセッションではGitHubの最新 `main` とopen PR / open Issueを最初に確認し、文書に残る記載より実際のGitHub状態を優先する。
