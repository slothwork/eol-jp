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
- PR #90で `PROJECT / DECISIONS / CURRENT_STATE` を導入し、`project-planning-template` に沿う標準開発プロセスをリポジトリへ反映

## 直近の検証結果

`PASS` — PR #90は既存のフルCIでcheck / build / sitemap / SEO / security / performance / browser smokeをすべて通過してマージ済み。プロセス標準化後も公開実装・品質gateに変更はない。

現在は、標準化レビューで見つかった「文書だけの変更にもフルCIを実行している」過剰を解消するため、変更リスクに応じたCI分類を実装・検証している。

## 本番確認・公開後の判断

`未判定` — Search Consoleではsitemap送信と主要URLのインデックス登録リクエストを実施済みで、検証開始通知も受領済み。ただし、検索パフォーマンスと主要URLのインデックス反映は、Phase 7の改善対象を比較できるだけのデータがまだ揃っていない。

このため、title / description、内部リンク、indexableページ範囲を推測だけで大きく変更しない。

## 作業中のこと

- `ci/risk-based-validation` でCIの変更分類を追加し、`docs/` 配下とリポジトリ直下Markdownだけの変更では重い検証をskipする構成を検証中
- 日次EOLデータ同期は既存自動化で継続中

## 次に行うこと

1. **変更リスク別CIを検証する** — workflow変更を含む今回のPRでは従来のフルCIが実行され、変更分類jobと既存品質gateが両方通ることを確認する。
2. **実案件パイロットの振り返りを行う** — 標準化とCI軽量化で得た事実を、プロジェクト固有 / 再利用候補 / テンプレート改善候補に整理する。形式的に毎PRでは行わず、今回の標準化区切りで実施する。
3. **Search ConsoleのGrowth gateを監視する** — 主要URLのindex状態とQueries / Pagesが比較可能になったらBaselineを作成し、3〜5ページのPhase 7実験へ進む。

## ブロッカー・重要リスク

- Phase 7の検索改善はSearch Consoleの比較可能な実データ待ち
- CI軽量化は文書パスの判定範囲を広げすぎず、build入力になり得る `src/` 等のMarkdownを将来自動skipしないこと
- 新しいプロセス文書やCIロジックを増やしすぎて、管理負荷を実開発より重くしないこと

## 関連するPull Request / Issue

- PR #90 `docs: 企画・判断・現在地を標準開発プロセスへ整理` — マージ済み
- 現在のCI軽量化は `ci/risk-based-validation` ブランチで作業中

## 最終更新時の補足

日次同期で `main` は継続的に進むため、最新SHAはこの文書へ固定しない。新しいセッションではGitHubの最新 `main` とopen PRを最初に確認する。
