# ROADMAP

最終整理: 2026-09-16

この文書は中期の「何をどの順で進めるか」を扱う。企画の目的・制約は `docs/PROJECT.md`、重要判断の理由は `docs/DECISIONS.md`、現在の1〜3件は `docs/CURRENT_STATE.md` を正本とする。過去の2026-09初旬の整理背景は `docs/ROADMAP_REVIEW_2026-09.md` を参照する。

## Strategy

Phase 0〜6で、公開サイト、通知、マイEOL、信頼性情報、GitHub Import、運用・テスト・性能・セキュリティの基盤は一通り完成した。

1年後の目標は「EOLを調べるならまずここを見る。重要な製品はそのまま監視できる、日本語のEOL管理サイト」。今後は機能数を増やすこと自体を目標にせず、次のサイクルを基本とする。

1. 観測する
2. 実需要がある改善対象を少数選ぶ
3. 仮説を1つずつ実装する
4. Search Console / 閲覧実績で効果を測る
5. 効果が確認できたものだけ横展開する
6. 3〜6か月単位で、検索・管理ツール・信頼性DBのどこへ寄せるかを見直す

## Current status

現在の詳細は `docs/CURRENT_STATE.md` を参照する。

- Phase 0〜6は完了。
- sitemap送信と主要URLのインデックス登録リクエストは実施済み。
- Search Consoleは検証開始後の反映待ちで、検索パフォーマンスを比較できるだけのデータはまだ不足している。
- Search Consoleの実データが出るまでは、title / description、内部リンク、ページ生成範囲を推測で大きく変更しない。
- 企画・判断・現在地を `PROJECT / DECISIONS / CURRENT_STATE` へ分離する開発プロセス標準化を進めている。

## Waiting / Growth gate

Phase 7の検索成長施策は、次の情報が実際に確認できるまで待つ。

- 主要URLのインデックス状態がSearch Consoleへ反映される
- 「検索パフォーマンス」のQueries / Pagesに、改善対象を比較できる程度の実データが出る
- sitemapやcanonical、noindex等の技術的な異常がないことを確認できる

固定の日数だけを理由に施策を開始しない。データ量が少ない場合は追加で待ち、無理に結論を出さない。

## Now — gate期間中に進めること

- 日次EOL同期、snapshot鮮度、手動レビュー鮮度、CI、Dependabot等の既存運用を維持する
- CI / browser smoke / performance budget / security headerで検出された不具合を修正する
- ユーザーが実際に使って気づいた小規模UX改善を行う
- `PROJECT / DECISIONS / CURRENT_STATE` を中心に文書driftを防ぐ
- 現在のCIが変更リスクに対して過剰でないかを検証し、品質を落とさず軽量化できる箇所を別PRで整理する
- Search Consoleの検証状態に変化があれば `docs/CURRENT_STATE.md` を更新する

次は原則として行わない。

- 根拠のないtitle / descriptionの一括変更
- バージョン専用URLなどindexableページの大量追加
- 利用実績のないGitHub Import対応範囲の先回り拡張
- アカウント、恒久DB、private GitHub認証など運用負荷の大きい基盤追加
- 全製品への大量のAI生成コンテンツ追加

## Next — Phase 7: Data-driven growth

Growth gateを満たしたら、以下の順序で進める。

### 1. Baselineを作る

- Search ConsoleからQueries / Pagesをエクスポートする
- 利用可能な期間が短ければ、その時点で取得できる全期間を使う
- インデックス済み / 未登録の傾向、表示回数、掲載順位、CTRをページ種別ごとに確認する
- Cloudflare Web Analytics等の既存閲覧データと、必要な範囲で突き合わせる
- 既存データだけでは検索から継続利用への接続を判断できないと確認できた場合に限り、最小限のイベント計測を再検討する

### 2. 月次KPIを同じ形式で確認する

原則として直近28日と、その前の28日を比較する。

- Search: impressions、clicks、CTR、average position、index状況、上位Queries / Pages
- Usage: Cloudflare Web AnalyticsのPage Viewsと主要ページの閲覧傾向
- Trust: snapshot freshness、手動レビュー鮮度
- Operations: CI、browser smoke、sitemap、SEO、security、performanceの未解決異常

最初は絶対目標値を置かず、Baseline取得後に現実的な目標レンジを設定する。

### 3. 改善対象を3〜5ページに絞る

優先候補は次のようなページとする。

- 表示回数が多いのにCTRが相対的に弱い
- 4〜20位付近で、検索意図に対して内容改善の余地がある
- 実クエリに対して必要な情報や内部導線が不足している
- 同種ページと比べてインデックス状況が不自然に弱い

固定の主要20製品だからという理由だけで対象を選ばない。

### 4. 仮説ごとに小さく改善する

原因に応じて必要なものだけを変更する。

- title / description
- 関連製品・同カテゴリ・移行先候補などの内部リンク
- 製品固有の概要、公式移行情報、変更点、EOL判断材料
- 検索意図に合っていない見出しや情報配置

複数要因を一度に大きく変更せず、何が効いたか追える単位を優先する。

### 5. 効果を測る

- 原則28日程度観測する
- 母数が不足する場合は56日程度まで延長する
- 結果は `win / neutral / lose / insufficient data` で整理する
- Search Consoleの反映遅延を考慮し、数日の変動だけで成功・失敗を決めない
- 効果が確認できた施策だけ類似ページへ横展開する

### 6. 独自コンテンツを需要順に拡張する

製品は実データに応じて次の考え方で扱う。

- Tier A: 検索・閲覧需要が大きく、独自情報追加の価値が高い
- Tier B: 一定需要があり、必要十分な独自情報を維持する
- Tier C: ロングテールとして正確なEOLデータベースを維持する

Tierは固定しない。コンテンツ量に差を付けても、データ正確性は全Tierで同じ水準を求める。

## 3〜6か月レビュー

Baseline取得後およそ3か月で、検索中心・管理ツール中心・信頼性DB中心のどこに強い兆候があるかをレビューする。

- `Green`: 明確な勝ち筋がある。重点投資を増やす
- `Yellow`: 需要はあるが判断材料不足。さらに観測する
- `Red`: 実利用がほぼなく、追加投資根拠が弱い。優先度を下げる

半年時点では各方向を `Primary / Secondary / Maintenance` に分類し、開発配分を見直す。

作った機能だからという理由だけで育て続けない。2回以上改善しても効果が確認できない、56日経っても判断に必要なデータが得られない、運用負荷が価値に見合わない場合は、その施策を一度止める。

## Later / Conditional

次の項目は、需要または利用実績が確認できた場合のみ再検討する。

- Public GitHub Repository Importのmonorepo / サブディレクトリ / 追加manifest対応
- バージョン専用URLなどのSEO拡張
- マイEOLのアカウント同期・クラウドバックアップ
- 追加の通知チャネルや恒久データ基盤
- 大規模な製品固有コンテンツ拡張
- 法人向けチーム管理・レポート機能
- 商用API枠やスポンサー等の収益化

収益化の原則と禁止事項は `docs/PROJECT.md` / `docs/DECISIONS.md` を参照する。

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
