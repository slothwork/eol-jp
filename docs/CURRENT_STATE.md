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
- 新しいチャットでもリポジトリから復元できるhandoff方針を整備
- `project-planning-template` と現行実装を照合し、企画・判断・現在地の標準化不足とdocs-only CI過剰を確認

## 直近の検証結果

`PASS` — Phase 0〜6の既存品質gateは維持されており、直近のマージ済み変更までCIでcheck / build / sitemap / SEO / security / performance / browser smokeを通過している。

今回のプロセス標準化レビューでは、実装・品質・運用基盤に重大な不足は見つからなかった。改善対象は主に、企画判断の保存形式とCI実行量である。

## 本番確認・公開後の判断

`未判定` — Search Consoleではsitemap送信と主要URLのインデックス登録リクエストを実施済みで、検証開始通知も受領済み。ただし、検索パフォーマンスと主要URLのインデックス反映は、Phase 7の改善対象を比較できるだけのデータがまだ揃っていない。

このため、title / description、内部リンク、indexableページ範囲を推測だけで大きく変更しない。

## 作業中のこと

- `project-planning-template` に合わせ、`PROJECT / DECISIONS / CURRENT_STATE` の役割へ文書構造を整理中
- 日次EOLデータ同期は既存自動化で継続中

## 次に行うこと

1. **企画・判断・現在地の標準化を完了する** — `AGENTS.md` と既存handoff/roadmapの参照関係を整理し、チャットだけに残っていた1年方針・KPI・収益化・編集方針をリポジトリへ固定する。
2. **CIの実行量を変更リスクに合わせて見直す** — docs-only変更でフルbuild / browser smoke等を毎回実行している現状について、必要な品質を落とさずpath単位で軽量化できるかを別Pull Requestで検証する。
3. **Search ConsoleのGrowth gateを監視する** — 主要URLのindex状態とQueries / Pagesが比較可能になったらBaselineを作成し、3〜5ページのPhase 7実験へ進む。

## ブロッカー・重要リスク

- Phase 7の検索改善はSearch Consoleの比較可能な実データ待ち
- docs-only CI軽量化では、文書変更にコード生成やbuild依存がないことを確認してからgateを分ける必要がある
- 新しいプロセス文書を増やしすぎて、管理負荷を実開発より重くしないこと

## 関連するPull Request / Issue

- PR #89 `chore(data): sync endoflife.date` — 自動日次データ同期。今回のプロセス標準化とは独立
- プロセス標準化のPull Requestは本ブランチ `docs/planning-process-standardization` から作成する

## 最終更新時の補足

日次同期で `main` は継続的に進むため、最新SHAはこの文書へ固定しない。新しいセッションではGitHubの最新 `main` とopen PRを最初に確認する。
