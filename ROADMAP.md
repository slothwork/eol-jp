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
- [x] 主要20製品に「製品とは何か」の簡潔な日本語概要を表示
- [x] 主要5製品のメジャーリリース変更点を公式一次情報付きで表示（拡張可能なデータ構造）
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
- [x] Slack / Discord通知設定UI + Workers KV本番binding
- [x] メール通知実装（Resend Free + Turnstile + メールアドレス確認）
- [x] メール通知の本番有効化 + 登録/解除E2E確認
- [x] 公開JSON API / embeddable badge

## Phase 4 — Trust & expansion

- [x] 主要20製品の公式ソースレビュー台帳 + 公開照合状況ページ
- [x] 主要20製品の公式日付との手動照合（比較可能な製品のみ。固定日付を比較できない製品は `not-comparable`、粒度/系列差がある製品は `partial` として明示）
- [x] 公式日付証跡とコミット済みsnapshotのCI照合（構造化証跡30件以上 + pending 0件）
- [x] 製品ページへ公式ソース照合結果を表示（状態・公式ソース・確認日・構造化証跡）
- [x] リリース変更点の対象製品を主要20製品へ段階拡大（20/20完了）
- [x] 日本で利用できる商用サポート情報（一次情報と日本向け公式ページ/国内窓口を確認できた6製品: Ubuntu / MySQL / Java / Windows / Windows Server / nginx）
- [x] GitHub package / SBOM連携による自動バージョン検出の検討（SBOM単独では主要製品の検出範囲が狭いため、将来は公開GitHubリポジトリを対象にSBOM + manifest/runtime検出を組み合わせる方針。private repo認証は初期対象外）
- [x] 変更監査ログ（同期差分のSHA-256・変更件数・影響製品・同期元を記録し公開）

## Phase 5 — UX & repository import

- [x] サイト全体のレスポンシブUX監査・改善（アクセシブルなモバイルナビ、44px操作領域、狭幅フォーム/Turnstile保護、表スクロール案内、長文折返し、safe-area対応）
- [ ] 製品ページの閲覧履歴（localStorage、重複除外、最大20件、全削除、外部送信なし）
- [ ] Public GitHub Repository Import MVP（非同期SBOM API + manifest/runtime補完、高信頼度候補のみユーザー確認後にマイEOLへ保存）
