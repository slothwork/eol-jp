# ROADMAP

最終整理: 2026-09-06

## Current status

- Phase 0〜5 は完了。
- Search Console は登録済みだが、現時点ではインデックス/検索パフォーマンスデータの処理待ち。実データが出るまでは title / description の推測変更を行わない。
- 次の優先テーマは、新機能追加よりも **安定化・運用・信頼性の底上げ**。
- その後、Search Console / 閲覧データなどの実データを使って成長施策を選ぶ。

## Phase 6 — Stabilization & operations

- [x] ROADMAP / AGENTS / ARCHITECTURE / README を現行実装へ同期
- [x] EOL snapshot の鮮度監視（`generatedAt` が72時間超で警告、168時間超または不正時はCI/日次監視を失敗。サイト側もブラウザ実時刻でstale表示）
- [x] 手動レビュー情報の鮮度ポリシー（公式ソース確認・公式日付比較・商用サポート・リリース変更点を180日でwarning、365日でCI/定期監視を失敗）
- [x] 重要ユーザーフローのブラウザ smoke test（実Chromeで主要URL、マイEOL保存/表示、閲覧履歴、GitHub import入力検証、375pxモバイルナビをProduction buildに対して確認）
- [x] HTTPセキュリティヘッダーの監査・強化と依存更新の定期運用（Static Assetsの`_headers` + Worker共通header、CSP、CI検証、npm / GitHub Actionsの月次Dependabot）
- [x] パフォーマンス基準の計測と予算化（Production buildの全JS/CSS/最大JSチャンクと主要5ページのHTML・JS・CSS初期転送量をgzip相当でCI監視）
- [ ] 肥大化したモジュールの段階的分割（通知UI、Worker runtime、GitHub import等。機能変更を伴わない保守性改善）
- [ ] 運用Runbook整備（同期失敗、通知障害、APIトークン更新、Resend / Turnstile / Cloudflare障害時の確認手順）

## Phase 7 — Data-driven growth

- [ ] Search Console実データに基づく title / description 改善と効果検証（Phase 2からの継続。Search Console処理完了後に開始）
- [ ] 実クエリと閲覧データに基づく内部リンク改善（関連製品、同カテゴリ、移行先候補などを必要なページだけに追加）
- [ ] 実需要に基づく独自コンテンツ拡張（主要20製品固定ではなく、表示回数・閲覧数・EOL接近度から優先順位を決める）
- [ ] マイEOLのローカルバックアップ/復元（JSON export / import。アカウント・DBなしで端末移行を可能にする）
- [ ] Public GitHub Repository Import の利用実績を見て対応範囲を拡張（monorepo / サブディレクトリ / 追加manifest）。利用実績がない段階では過剰実装しない
- [ ] バージョン専用URL等のSEO拡張は、Search Consoleで十分な検索需要が確認できた場合のみ再検討

---

## Completed phases

### Phase 0 — Foundation

- [x] Astro静的サイト構成
- [x] endoflife.date API v1 正規化スクリプト
- [x] GitHub Actions日次同期
- [x] EOLまでの日数・状態分類
- [x] 製品一覧 / 個別ページ / Upcoming / Calendar
- [x] RSS / iCalendar / sitemap
- [x] endoflife.date attribution / 免責事項

### Phase 1 — Public MVP

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

### Phase 2 — Search growth

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
- [x] 構造化データ検証

### Phase 3 — Utility product

- [x] 「利用中バージョン」ローカル保存
- [x] マイEOLダッシュボード
- [x] 30/90/180日前リマインダー（マイEOL閲覧時のローカル判定）
- [x] Slack / Discord外部通知のWorker・Cron・Webhook判定基盤
- [x] Slack / Discord通知設定UI + Workers KV本番binding
- [x] メール通知実装（Resend Free + Turnstile + メールアドレス確認）
- [x] メール通知の本番有効化 + 登録/解除E2E確認
- [x] 公開JSON API / embeddable badge

### Phase 4 — Trust & expansion

- [x] 主要20製品の公式ソースレビュー台帳 + 公開照合状況ページ
- [x] 主要20製品の公式日付との手動照合（比較可能な製品のみ。固定日付を比較できない製品は `not-comparable`、粒度/系列差がある製品は `partial` として明示）
- [x] 公式日付証跡とコミット済みsnapshotのCI照合（構造化証跡30件以上 + pending 0件）
- [x] 製品ページへ公式ソース照合結果を表示（状態・公式ソース・確認日・構造化証跡）
- [x] リリース変更点の対象製品を主要20製品へ段階拡大（20/20完了）
- [x] 日本で利用できる商用サポート情報（一次情報と日本向け公式ページ/国内窓口を確認できた6製品: Ubuntu / MySQL / Java / Windows / Windows Server / nginx）
- [x] GitHub package / SBOM連携による自動バージョン検出の検討
- [x] 変更監査ログ（同期差分のSHA-256・変更件数・影響製品・同期元を記録し公開）

### Phase 5 — UX & repository import

- [x] サイト全体のレスポンシブUX監査・改善（アクセシブルなモバイルナビ、44px操作領域、狭幅フォーム/Turnstile保護、表スクロール案内、長文折返し、safe-area対応）
- [x] 製品ページの閲覧履歴（localStorage、重複除外、最大20件、個別/全削除、外部送信なし。製品一覧/マイEOLで最近見た製品を表示）
- [x] Public GitHub Repository Import MVP（ブラウザからGitHub REST APIへ直接接続。非同期SBOM + ルートmanifest/runtime補完を解析し、高信頼度候補のみユーザー確認後にマイEOLへ保存。private repo / token保存なし）
