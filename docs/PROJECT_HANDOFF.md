# Project handoff

最終更新: 2026-09-10

この文書は、ChatGPTのメッセージ上限到達や新規チャットへの切り替え後でも、GitHub上の情報だけで作業文脈を復元するための引き継ぎメモである。優先順位の正本は `ROADMAP.md`、恒久ルールは `AGENTS.md` とする。

## New session checklist

新しいチャットでは、過去会話の記憶や古いコミットSHAを前提にせず、次を順に確認する。

1. GitHubの最新 `main` を取得する
2. open PR / open Issue を確認する
3. `AGENTS.md` を読む
4. この `docs/PROJECT_HANDOFF.md` を読む
5. `ROADMAP.md` の Current / Waiting / Next / Later を確認する
6. 関連PRがある場合はdiffとCIを確認する
7. 本番運用なら `docs/RUNBOOK.md`、構成変更なら `docs/ARCHITECTURE.md` を確認する

日次データ同期で `main` は継続的に進むため、この文書に「最新mainのSHA」は固定しない。

## Current state

2026-09-10時点の主要状態は次のとおり。

- Phase 0〜6は完了済みで、サイトの主要機能・信頼性情報・通知・運用・テスト基盤は揃っている。
- Search Consoleへ `https://eol.slothwright.com/sitemap.xml` を送信済み。
- 主要URLのインデックス登録リクエストも実施済み。
- Search Consoleでは検証開始の通知が届いているが、インデックス登録状況と検索パフォーマンスへの反映はまだ待機中。
- この待機中は、title / descriptionや内部リンク、indexableページ範囲を推測で変更しない。
- sitemapは静的生成され、CIで全indexable canonical HTMLとの整合性を検証している。
- 一覧・比較画面は高密度テーブル中心へ整理済み。製品詳細のバージョンサポート表は5列構成。
- 外部 `http` / `https` リンクは別タブ、内部リンクは同一タブで開く共通処理を導入済み。
- Search Console待ちの間は、運用維持、バグ修正、ユーザーから具体的に挙がった小規模UX改善、ドキュメント整備を優先する。

## Working agreement for ChatGPT sessions

- Codexは使わず、GitHub integrationを直接使って作業する。
- 変更前に前回の関連PRがマージ済みか、最新 `main` がどこまで進んでいるか確認する。
- 最新 `main` から作業ブランチを作る。
- GitHub上で編集し、PRを作成する。
- PR説明と `.md` は原則日本語。
- diff、CI、`main` からのbehind、mergeable状態を確認してからマージ可否を報告する。
- ユーザーが明示的に依頼しない限り、PRをマージしない。
- 運用費はほぼ0円を維持する。新しいWorker / KV / DB / 外部API・有料サービス依存を安易に追加しない。
- build時にlive endoflife.date APIへ依存せず、コミット済み `src/data/eol-snapshot.json` を使う。

## Recent decisions that should carry across chats

### UI density

比較・一覧が目的のページでは、一画面あたりの情報量と比較しやすさを優先し、高密度テーブルを基本とする。カードは探索、説明、確認操作に向く箇所へ限定する。

製品詳細の「バージョン別サポート状況」は、バージョンと最新版、リリース日と最新リリース日をそれぞれ同一セルにまとめた5列テーブルをPC / スマホで共通利用する。

### Search Console / SEO

ホームを含むページが「クロール済み - インデックス未登録」だったため調査した結果、robots / noindex / canonicalによるブロックは確認されていない。sitemap自体は既存実装で生成されていたが `/releases/` の漏れが見つかり修正し、現在はCIでindexable HTMLとの完全整合を検証している。

sitemap送信とインデックス登録リクエスト後、Search Consoleの検証が進行中。反映待ちの間にSEO要素を何度も変更しない。検索実データが出たら `ROADMAP.md` のPhase 7手順へ進む。

### External links

外部originの `http` / `https` リンクには `target="_blank"` と `rel="external noopener noreferrer"` を付与する。内部リンク、`mailto:`、`tel:` は従来の挙動を維持する。

## Key recent PRs

背景を確認する必要がある場合はGitHubで次を参照する。

- PR #72 `feat(ui): 一覧UIを高密度テーブルへ統一`
- PR #73 `fix(seo): sitemapの検出性と整合性を強化`
- PR #76 `fix(ui): 外部リンクを別タブで開く`

日次データ更新PRは通常この一覧へ記録しない。

## Next trigger

Search Consoleに反映が出たら、まず次を行う。

1. 主要URLのインデックス状態を確認する
2. Queries / Pagesをエクスポートする
3. インデックス異常と検索需要を分けて分析する
4. 改善対象を3〜5ページへ絞る
5. `ROADMAP.md` のPhase 7に沿って、小さく変更して効果を測る

Search Consoleの反映前でも、本番不具合、CI失敗、freshness警告、ユーザーから明示されたUX修正は独立して進めてよい。

## Keeping this handoff useful

この文書はチャットログの代替ではなく、「次のセッションが判断を再開するために必要な状態」だけを書く。

更新するタイミング:

- Search Consoleの待ち状態が解消した
- RoadmapのCurrent / Nextが変わった
- アーキテクチャやコスト方針に重要な変更があった
- チャットをまたいで維持すべき重要な設計判断が追加された

原則として記録しないもの:

- 日次同期ごとのcommit SHA
- 完了済みCI run番号
- 一時的な作業ログ
- すでにマージ済みの細かな修正履歴

作業途中でチャットが切り替わった場合は、この文書へ一時情報を無理に書き込むのではなく、新しいチャットでopen PRを取得し、PR本文・diff・CIから続きの状態を復元する。
