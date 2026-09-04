# ROADMAP

## Phase 0 — Foundation

- [x] Astro静的サイト構成
- [x] endoflife.date API v1 正規化スクリプト
- [x] GitHub Actions日次同期
- [x] EOLまでの日数・状態分類
- [x] 製品一覧 / 個別ページ / Upcoming / Calendar
- [x] RSS / iCalendar / sitemap
- [x] endoflife.date attribution / 免責事項

## Phase 1 — Public MVP

- [x] GitHubリポジトリ作成・initial commit
- [ ] `npm install` でlockfile生成
- [x] `npm run sync:eol` で全製品を取得
- [x] `npm run check && npm run build`
- [x] Cloudflare Workers接続
- [x] 独自ドメイン確定
- [x] robots.txtのSitemap URL確定
- [x] Google Search Console登録・sitemap送信
- [ ] OGP画像 / favicon
- [x] 主要20製品の日本語summary手動整備

## Phase 2 — Search growth

- [x] 「30日以内 / 90日以内 / 半年以内」専用ランディング
- [x] カテゴリ別ページ（言語 / OS / DB / インフラ等）
- [x] バージョン単位の見出し・FAQ強化
- [x] EOL変更履歴ページ
- [x] 主要製品の公式移行ガイドへの導線
- [ ] Search Consoleのクエリ別CTR改善
- [x] 構造化データ検証

## Phase 3 — Utility product

- [ ] 「利用中バージョン」ローカル保存
- [ ] マイEOLダッシュボード
- [ ] 30/90/180日前リマインダー
- [ ] メール / Slack / Discord通知
- [ ] 公開JSON API / embeddable badge検討

## Phase 4 — Trust & expansion

- [ ] ベンダー公式ソースとの二重確認フロー
- [ ] 日本固有の商用サポート情報（根拠が確認できるもののみ）
- [ ] GitHub package / SBOM連携による自動バージョン検出の検討
- [ ] 変更監査ログ
