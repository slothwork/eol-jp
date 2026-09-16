# 現在の状態

最終更新: 2026-09-16

この文書は履歴保管ではなく、プロジェクトの「今」を短時間で把握するために使う。目的・制約は `docs/PROJECT.md`、重要な判断理由は `docs/DECISIONS.md`、中期計画は `ROADMAP.md` を参照する。

## 現在のフェーズ

公開後改善 / Growth gate。

Phase 0〜6の公開・通知・信頼性情報・GitHub Import・運用・テスト基盤は完了済み。現在はSearch Consoleのインデックス反映と検索実データを待ち、Phase 7のデータ駆動改善へ入る条件を確認している。

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
- 標準化の振り返りを [PROCESS_REVIEW_2026-09.md](PROCESS_REVIEW_2026-09.md) に整理し、プロジェクト固有の学びと再利用・テンプレート改善候補を記録

## 直近の検証結果

`PASS` — PR #90・#91はCI成功後にマージ済み。PR #91のマージ後mainでも、変更分類と既存のcheck / build / sitemap / SEO / security / performance / browser smoke等が成功している。

文書のみの実PRで重いjobが省略されることは、今回の振り返り文書PRのマージ前に確認する。完了条件と証跡の保存先は [振り返り](PROCESS_REVIEW_2026-09.md) を参照する。期待と異なる場合は `FIX` とし、軽量化を完了扱いにしない。

## 本番確認・公開後の判断

`未判定` — Search Consoleではsitemap送信と主要URLのインデックス登録リクエストを実施済みで、検証開始通知も受領済み。検索パフォーマンスと主要URLのインデックス反映について、比較可能な新しい実データはこのセッションでは取得していない。

title / description、内部リンク、indexableページ範囲を推測だけで大きく変更しない。プロセス整備とCIの成功を、検索や継続利用の改善結果とは区別する。

## 作業中のこと

- 振り返り文書PRで、文書専用変更の軽量CIを最終確認する
- 日次EOLデータ同期・snapshot鮮度・手動レビュー鮮度の既存運用を継続する

## 次に行うこと

1. **標準化の区切りを完了する** — 本文書を更新するPRで差分を確認し、変更分類success・重いjob skippedを確認してマージ可否を報告する。確認済みならこの作業を繰り返さず、次の項目へ進む。
2. **既存運用の異常に対応する** — 日次同期、鮮度監視、CI等に未解決の異常があれば優先する。異常や実利用上の課題がない場合は、追加実装を目的化しない。
3. **Growth gateの判断材料を確認する** — Search Consoleの主要URLのindex状態とQueries / Pagesを取得できたら、`docs/SEARCH_CONSOLE.md` に従ってBaselineを作成する。比較可能なデータが不足している場合は待機を維持する。

## ブロッカー・重要リスク

- Phase 7の検索改善はSearch Consoleの比較可能な実データ待ち
- 文書パスが将来build / test入力になる場合は、同じ変更でCI分類を再検討する
- 新しいプロセス文書やCIロジックを増やしすぎて、管理負荷を実開発より重くしないこと

## 関連するPull Request / Issue

- [PR #90](https://github.com/slothwork/eol-jp/pull/90) — 企画・判断・現在地の整理。マージ済み
- [PR #91](https://github.com/slothwork/eol-jp/pull/91) — 文書専用変更のCI軽量化。マージ済み
- 振り返りと軽量CIの最終検証は `docs/process-standardization-review` ブランチのPRで確認する
- セッション開始時にopen PR / open Issueはなかった。以後はGitHubの最新状態を確認する

## 最終更新時の補足

日次同期で `main` は継続的に進むため、最新SHAや一時的なCI run番号はこの文書へ固定しない。新しいセッションではGitHubの最新 `main` とopen PRを最初に確認し、文書に残る作業中の記載より実際のマージ状態を優先する。
