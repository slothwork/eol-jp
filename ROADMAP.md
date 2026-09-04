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
- [x] package-lock.json生成・CIをnpm ciへ移行
- [x] `npm run sync:eol` で全製品を取得
- [x] `npm run check && npm run build`
- [x] Cloudflare Workers接続
- [x] 独自ドメイン確定
- [x] robots.txtのSitemap URL確定
- [x] Google Search Console登録・sitemap送信
- [x] OGP画像 / favicon
- [x] 主要20製品の日本語summary手動整備

## Phase 2 — Search growth

- [x] 「30日以内 / 90日以内 / 半年以内」専用ランディング
- [x] カテゴリ別ページ（言語 / OS / DB / インフラ等）
- [x] バージョン単位の見出し・FAQ強化
- [x] EOL変更履歴ページ
- [x] 主要製品の公式移行ガイドへの導線
- [x] 「注目されているEOL情報」表示基盤（180日以内 × 直近30日閲覧）
- [x] 製品ページの最接近EOL判定・LTS優先の保守的な移行候補判定
- [x] 製品ページの情報量に応じたindex / noindex方針とsitemap連動
- [x] Search Console CSVのクエリ / ページ別CTR改善候補抽出基盤
- [ ] Search Console実データに基づくtitle / description改善と効果検証
- [x] 構造化データ検証

## Phase 3 — Utility product

- [x] 「利用中バージョン」ローカル保存
- [x] マイEOLダッシュボード
- [x] 30/90/180日前リマインダー（マイEOL閲覧時のローカル判定）
- [x] Slack / Discord外部通知のWorker・Cron・Webhook判定基盤
- [ ] Slack / Discord通知設定UI + Workers KV本番binding
- [ ] メール通知
- [ ] 公開JSON API / embeddable badge検討

## Phase 4 — Trust & expansion

- [ ] ベンダー公式ソースとの二重確認フロー
- [ ] 日本固有の商用サポート情報（根拠が確認できるもののみ）
- [ ] GitHub package / SBOM連携による自動バージョン検出の検討
- [ ] 変更監査ログ
