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
- PR #92で標準化の振り返りを追加し、文書専用の実PRで軽量CI経路を確認

## 直近の検証結果

`PASS` — PR #90〜#92はマージ済み。PR #91ではworkflow変更とマージ後mainで既存のcheck / build / sitemap / SEO / security / performance / browser smoke等が成功し、PR #92では文書専用変更として `Classify changes` が成功し、重い `Check, build and SEO validate` がskippedになった。

これにより、通常変更では既存のフルCIを維持しつつ、`docs/**` とリポジトリ直下Markdownだけの変更では重い検証を省略する経路を実案件で確認した。詳細は [PROCESS_REVIEW_2026-09.md](PROCESS_REVIEW_2026-09.md) を参照する。

## 本番確認・公開後の判断

`未判定` — Search Consoleではsitemap送信と主要URLのインデックス登録リクエストを実施済みで、検証開始通知も受領済み。検索パフォーマンスと主要URLのインデックス反映について、比較可能な新しい実データはこのセッションでは取得していない。

title / description、内部リンク、indexableページ範囲を推測だけで大きく変更しない。プロセス整備とCIの成功を、検索や継続利用の改善結果とは区別する。

## 作業中のこと

- 日次EOLデータ同期・snapshot鮮度・手動レビュー鮮度の既存運用を継続する
- Search ConsoleのGrowth gate条件が満たされるかを確認する

現時点で、標準化やCI軽量化を目的とした追加実装は行わない。

## 次に行うこと

1. **既存運用の異常に対応する** — 日次同期、鮮度監視、CI等に未解決の異常があれば優先する。異常や実利用上の課題がない場合は、追加実装を目的化しない。
2. **Growth gateの判断材料を確認する** — Search Consoleの主要URLのindex状態とQueries / Pagesを取得できたら、`docs/SEARCH_CONSOLE.md` に従ってBaselineを作成する。比較可能なデータが不足している場合は待機を維持する。
3. **実データに基づく最小実験へ進む** — Baseline作成後、ROADMAPの条件に沿って3〜5ページ程度のPhase 7実験を設計する。観測前に大規模なSEO変更を行わない。

## ブロッカー・重要リスク

- Phase 7の検索改善はSearch Consoleの比較可能な実データ待ち
- 文書パスが将来build / test入力になる場合は、同じ変更でCI分類を再検討する
- 新しいプロセス文書やCIロジックを増やしすぎて、管理負荷を実開発より重くしないこと

## 関連するPull Request / Issue

- [PR #90](https://github.com/slothwork/eol-jp/pull/90) — 企画・判断・現在地の整理。マージ済み
- [PR #91](https://github.com/slothwork/eol-jp/pull/91) — 文書専用変更のCI軽量化。マージ済み
- [PR #92](https://github.com/slothwork/eol-jp/pull/92) — 標準化の振り返りと文書専用軽量CIの実案件確認。マージ済み

## 最終更新時の補足

日次同期で `main` は継続的に進むため、最新SHAや一時的なCI run番号はこの文書へ固定しない。新しいセッションではGitHubの最新 `main` とopen PR / open Issueを最初に確認し、文書に残る記載より実際のGitHub状態を優先する。
