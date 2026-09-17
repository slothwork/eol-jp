# 現在の状態

最終更新: 2026-09-17

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

2026-09-16にSearch Consoleの実データを再確認した結果:

- Search Consoleの確定データは2026-09-13まで。直近28日はクリック0・表示0
- 期間を約90日まで広げてもQueries / Pagesは0件で、Phase 7のBaselineを作れる検索実績はまだない
- `https://eol.slothwright.com/sitemap.xml` は正常取得され、462 URL submitted、0 indexed、warning 0、error 0
- ホーム、`/eol/`、`/releases/`、`/eol/nodejs/` はいずれも「クロール済み - インデックス未登録」。robots.txtは許可、indexingも許可、ページ取得は成功
- 共通レイアウトは通常ページへself-canonicalを生成し、`noindex` は明示指定時だけ出す。`Astro.site` の既定値も本番originと一致している
- 上記4URLをSearch Console連携のIndexing Trackerへ登録し、即時確認でも4件とも `not_indexed` / `INDEXING_ALLOWED`、警告なしであることを確認した

Googleがページを取得できない技術ブロックは今回の確認では見つからなかった。現時点では、推測でtitle / description、内部リンク、indexableページ範囲を大きく変更せず、初期インデックス反映を待つ。

## 作業中のこと

- 日次EOLデータ同期・snapshot鮮度・手動レビュー鮮度の既存運用を継続する
- Indexing Trackerで主要4URLの状態変化を追い、Search Consoleでsitemapのindexed件数またはQueries / Pagesの表示回数が発生するかを確認する

検索実データがない間は、SEO変更を作ること自体を目的にしない。

## 次に行うこと

1. **既存運用の異常に対応する** — 日次同期、鮮度監視、CI等に未解決の異常があれば優先する。異常や実利用上の課題がない場合は、追加実装を目的化しない。
2. **Growth gateを再確認する** — 主要4URLのindex状態、sitemapのindexed件数が0から変化する、またはQueries / Pagesに表示回数が出た時点でSearch Consoleを再確認する。毎日のSEO変更や一括再設計は行わない。
3. **実データに基づく最小実験へ進む** — 比較可能なデータが得られたら `docs/SEARCH_CONSOLE.md` に従ってBaselineを作成し、ROADMAPの条件に沿って3〜5ページ程度のPhase 7実験を設計する。

## ブロッカー・重要リスク

- Phase 7の検索改善はSearch Consoleの比較可能な実データ待ち。2026-09-16時点ではsitemap 462 URLに対してindexed 0、主要確認URLも「クロール済み - インデックス未登録」
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
