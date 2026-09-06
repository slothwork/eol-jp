# EOL情報.jp (`eol-jp`)

ソフトウェア・OS・データベース・フレームワーク等のEOL（End of Life）とサポート期限を、日本語で分かりやすく確認するためのサイトです。

## コンセプト

単なる endoflife.date の翻訳ではなく、日本の開発者・インフラ担当・情シスが「次に何を確認すべきか」を判断しやすい情報とユーティリティを提供します。

主な機能:

- EOLまで「あと何日」を表示
- 30日 / 90日 / 180日 / 1年以内の期限を優先表示
- 製品名 + バージョン + EOL の検索意図に最適化した個別ページ
- 独自の日本語summary・判断ガイド・FAQ
- 主要製品の公式ソース照合、移行ガイド、リリース変更点
- EOLカレンダー、RSS、iCalendar
- EOL変更履歴・変更監査ログ
- マイEOL（利用中バージョンのブラウザ保存）
- 30 / 90 / 180日前リマインダー
- Slack / Discord / メール通知
- 製品ページ閲覧履歴
- 公開GitHubリポジトリからの利用バージョン検出
- 公開JSON API / embeddable badge
- 180日以内にEOLを迎える製品のうち、直近30日で関心が集まっている情報を表示

## 技術構成

- Astro 7 / TypeScript
- 静的HTML生成（SSRなし）
- Cloudflare Workers + Static Assets
- Workers KV（通知機能で必要な状態のみ）
- endoflife.date API v1 `/api/v1/products/full`
- Cloudflare Web Analytics
- GitHub ActionsでEOLデータを1日1回同期
- GitHub ActionsでEOL注目度ランキングを週1回同期
- マイEOL / 閲覧履歴はlocalStorage
- Public GitHub Repository ImportはブラウザからGitHub REST APIへ直接接続

## データ更新の流れ

```text
endoflife.date API
       ↓ 1日1回
GitHub Actions
       ↓
src/data/eol-snapshot.json
change-log.json / audit-log.json
       ↓
chore/eol-data-sync PR
       ↓ CI / review / merge
GitHub main
       ↓
Cloudflare build
       ↓
Workers + Static Assets
```

Cloudflareの本番build時にendoflife.date APIを必須依存させないことで、API一時障害や仕様変更の影響を本番配信から切り離します。

### 注目されているEOL情報

トップページの「注目されているEOL情報」は、製品の普及率や一般的な人気度を示すランキングではありません。

```text
Cloudflare Web Analytics
       ↓ 直近30日の /eol/{slug}/ Page Views
scripts/sync-eol-attention.mjs
       ↓ 180日以内にEOLを迎える製品だけに限定
src/data/eol-attention-ranking.json
       ↓ Top 10
トップページ
```

集計対象は「180日以内にEOLを迎える製品」、順位は「直近30日間の製品ページ閲覧数」です。当サイト利用者の関心がどこに集まっているかを見る補助指標として利用します。

GitHub Actionsの `Sync EOL attention ranking` は毎週月曜 00:45 UTC に実行し、ランキングJSONに変更があれば `chore/eol-attention-ranking` ブランチのPRを作成または更新します。

ランキングの変更判定では、集計時刻だけの差分は無視します。Top 10の製品・順位・Page Views、30日/180日条件、データソースがすべて前回と同じ場合は既存JSONを書き換えず、PRも作成しません。

事前設定:

1. Cloudflare DashboardのWeb Analyticsで `eol.slothwright.com` を有効化する。
2. Cloudflare API Tokenを作成し、`Account > Account Analytics > Read` 権限を付与する。
3. GitHubのfine-grained personal access tokenを `eol-jp` リポジトリだけに限定して作成する。
4. fine-grained PATには以下のRepository permissionsだけを付与する。

```text
Contents: Read and write
Pull requests: Read and write
```

5. GitHub repository secretsに以下を登録する。

```text
CLOUDFLARE_API_TOKEN=<Cloudflare API Token>
CLOUDFLARE_ACCOUNT_ID=<Cloudflare Account ID>
EOL_AUTOMATION_TOKEN=<GitHub fine-grained PAT>
```

`EOL_AUTOMATION_TOKEN` はランキング更新ブランチのpushとPR作成・更新に使います。不要な権限は追加せず、トークンの有効期限前に更新してください。

Cloudflare Secretsが未設定の場合、ランキング同期はデータ取得をスキップします。`EOL_AUTOMATION_TOKEN` が未設定の場合は、自動PRのCIを保証できないためworkflowを明示的に失敗させます。ランキングデータが空の場合、トップページのランキングセクションは表示しません。

## ローカル実行

```bash
npm install
npm run dev
```

データを最新化する場合:

```bash
npm run sync:eol
```

Cloudflare Web Analyticsのランキングを更新する場合:

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ACCOUNT_ID=... \
npm run sync:attention
```

本番ビルド:

```bash
npm run build
```

型・Astro検証:

```bash
npm run check
```

## Cloudflare Workers

推奨設定:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Environment variable:
  PUBLIC_SITE_URL=https://eol.slothwright.com
```

通知機能ではWorkers KV、Turnstile、Resend等の本番設定を利用します。詳細は `docs/NOTIFICATIONS.md` を参照してください。

## 主要URL

```text
/                               トップ
/eol/                            製品一覧・検索
/eol/{product}/                  製品別EOLページ
/upcoming/                       今後1年のEOL
/upcoming/30-days/               30日以内
/upcoming/90-days/               90日以内
/upcoming/180-days/              180日以内
/calendar/                       月別EOLカレンダー
/calendar.ics                    iCalendar
/feed.xml                        RSS
/changes/                        EOL変更履歴
/trust/official-sources/         公式ソース照合状況
/trust/commercial-support/       日本向け商用サポート情報
/trust/audit-log/                変更監査ログ
/my-eol/                         マイEOL
/my-eol/github-import/           公開GitHubリポジトリから検出
/api/                            公開API説明
/api/v1/products                 公開JSON API
/sitemap.xml                     XML Sitemap
/about/                          出典・免責事項
```

## プライバシー / ローカル保存

- マイEOL、リマインダー設定、閲覧履歴はブラウザlocalStorageへ保存します。
- これらはログイン情報やサーバー側アカウントへ紐づきません。
- Public GitHub Repository Importは公開リポジトリのみを対象にし、GitHub tokenを要求・保存しません。
- GitHub importのURL、SBOM、manifest内容、解析結果はEOL情報.jpのWorker/KVへ送信しない設計です。

## データ出典・ライセンス

ライフサイクルデータの一部は [endoflife.date](https://endoflife.date/) を利用します。endoflife.date および関連データはMIT Licenseで提供されています。詳細は `THIRD_PARTY_NOTICES.md` を参照してください。

製品説明文をそのまま翻訳・転載せず、日本語説明は独自に作成します。

## 開発・運用ドキュメント

- 実装ルール: `AGENTS.md`
- ロードマップ: `ROADMAP.md`
- アーキテクチャ: `docs/ARCHITECTURE.md`
- 本番障害対応・復旧・資格情報更新: `docs/RUNBOOK.md`
- SEO方針: `docs/SEO.md`
- Search Console運用: `docs/SEARCH_CONSOLE.md`
- 通知運用: `docs/NOTIFICATIONS.md`
- セキュリティ・依存更新運用: `docs/SECURITY_OPERATIONS.md`
- 公式ソース照合: `docs/OFFICIAL_SOURCE_REVIEW.md`
- GitHub/SBOM連携: `docs/GITHUB_SBOM.md`