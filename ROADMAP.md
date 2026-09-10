# ROADMAP

最終整理: 2026-09-10

この文書は「次に何をするか」の正本とする。チャット間の現在地・作業上の合意は `docs/PROJECT_HANDOFF.md`、過去の判断記録は `docs/ROADMAP_REVIEW_2026-09.md` を参照する。

## Strategy

Phase 0〜6で、公開サイト、通知、マイEOL、信頼性情報、GitHub import、運用・テスト・性能・セキュリティの基盤は一通り完成した。

今後は機能数を増やすこと自体を目標にせず、次のサイクルを基本とする。

1. 観測する
2. 実需要がある改善対象を少数選ぶ
3. 仮説を1つずつ実装する
4. Search Console / 閲覧実績で効果を測る
5. 効果が確認できたものだけ横展開する

## Current status

- Phase 0〜6は完了。
- `/releases/`、マイEOLのJSONバックアップ/復元、高密度テーブルUI、sitemap整合性検証、外部リンクの別タブ化まで反映済み。
- Search Consoleではsitemap送信と主要URLのインデックス登録リクエストを実施済み。
- 2026-09-10時点で検証開始の通知は届いているが、インデックス登録状況・検索パフォーマンスへの反映は待機中。
- Search Consoleの実データが出るまでは、title / description、内部リンク、ページ生成範囲を推測で変更しない。

## Waiting / Growth gate

Phase 7の検索成長施策は、次の情報が実際に確認できるまで待つ。

- 主要URLのインデックス状態がSearch Consoleへ反映される
- 「検索パフォーマンス」のQueries / Pagesに、改善対象を比較できる程度の実データが出る
- sitemapやcanonical、noindex等の技術的な異常がないことを確認できる

固定の日数だけを理由に施策を開始しない。データ量が少ない場合は追加で待ち、無理に結論を出さない。

## Now — gate期間中に進めること

Search Console待ちの間は、新しい大規模機能を作るのではなく次を優先する。

- 日次EOL同期、snapshot鮮度、手動レビュー鮮度、CI、Dependabot等の既存運用を維持する
- CI / browser smoke / performance budget / security headerで検出された不具合を修正する
- ユーザーが実際に使って気づいた小規模UX改善を行う
- ドキュメントと実装のdriftを防ぐ
- Search Consoleの検証状態に変化があれば `docs/PROJECT_HANDOFF.md` のCurrent stateを更新する

次は原則として行わない。

- 根拠のないtitle / descriptionの一括変更
- バージョン専用URLなどindexableページの大量追加
- 利用実績のないGitHub Import対応範囲の先回り拡張
- アカウント、恒久DB、private GitHub認証など運用負荷の大きい基盤追加

## Next — Phase 7: Data-driven growth

Growth gateを満たしたら、以下の順序で進める。

### 1. Baselineを作る

- Search ConsoleからQueries / Pagesをエクスポートする
- 利用可能な期間が短ければ、その時点で取得できる全期間を使う
- インデックス済み / 未登録の傾向、表示回数、掲載順位、CTRをページ種別ごとに確認する
- Cloudflare Web Analytics等の既存閲覧データと、必要な範囲で突き合わせる

### 2. 改善対象を3〜5ページに絞る

優先候補は次のようなページとする。

- 表示回数が多いのにCTRが相対的に弱い
- 4〜20位付近で、検索意図に対して内容改善の余地がある
- 実クエリに対して必要な情報や内部導線が不足している
- 同種ページと比べてインデックス状況が不自然に弱い

固定の主要20製品だからという理由だけで対象を選ばない。

### 3. 仮説ごとに小さく改善する

原因に応じて、必要なものだけを変更する。

- title / description
- 関連製品・同カテゴリ・移行先候補などの内部リンク
- 製品固有の概要、公式移行情報、変更点、EOL判断材料
- 検索意図に合っていない見出しや情報配置

複数要因を一度に大きく変更せず、何が効いたか追える単位を優先する。

### 4. 効果を測る

- 改善前後で表示回数、CTR、掲載順位、対象ページ閲覧を比較する
- Search Consoleの反映遅延を考慮し、短期間の変動だけで成功・失敗を決めない
- 効果が確認できた施策だけ類似ページへ横展開する

### 5. 独自コンテンツを需要順に拡張する

主要20製品固定ではなく、次を組み合わせて優先順位を決める。

- Search Consoleの表示回数・実クエリ
- サイト内の閲覧実績
- EOL接近度
- 公式情報を用いて日本語で独自価値を追加できるか

## Later / Conditional

次の項目は、需要または利用実績が確認できた場合のみ再検討する。

- Public GitHub Repository Importのmonorepo / サブディレクトリ / 追加manifest対応
- バージョン専用URLなどのSEO拡張
- マイEOLのアカウント同期・クラウドバックアップ
- 追加の通知チャネルや恒久データ基盤
- 大規模な製品固有コンテンツ拡張

## Completed milestones

### Phase 0 — Foundation

Astro静的サイト、endoflife.date API v1正規化、日次snapshot同期、EOL判定、製品一覧・個別・Upcoming・Calendar、RSS / iCalendar / sitemapを整備。

### Phase 1 — Public MVP

Cloudflare Workers + Static Assets、独自ドメイン、Search Console、robots、OGP / favicon、主要製品の日本語説明まで公開基盤を完成。

### Phase 2 — Search foundation

期限別・カテゴリ別LP、FAQ、変更履歴、公式移行導線、独自概要、リリース変更点、注目EOL、index/noindex方針、Search Console CSV分析基盤、構造化データ検証を整備。

### Phase 3 — Utility product

利用中バージョン保存、マイEOL、ローカルリマインダー、Slack / Discord / メール通知、公開JSON API、badgeを実装。

### Phase 4 — Trust & expansion

公式ソースレビュー、公式日付証跡、照合状況表示、日本向け商用サポート情報、監査ログ、GitHub package / SBOM連携方針を整備。

### Phase 5 — UX & repository import

レスポンシブUX、閲覧履歴、Public GitHub Repository Import MVPを実装。

### Phase 6 — Stabilization & operations

snapshot / 手動レビュー鮮度監視、実Chrome browser smoke、HTTPセキュリティヘッダー、Dependabot、performance budget、大型モジュール分割、運用Runbookを整備。

### Completed independent improvements

- マイEOLのversioned JSONバックアップ / 復元
- 最新リリース情報 `/releases/` と20件ページング・テーブル表示
- サイト全体の比較・一覧UIを高密度テーブルへ統一
- 製品詳細のバージョンサポート表を5列へ整理
- sitemapと全indexable canonical HTMLのCI整合性検証
- 外部リンクを別タブで開く共通処理
