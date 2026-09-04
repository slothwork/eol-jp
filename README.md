# EOL情報.jp (`eol-jp`)

ソフトウェア・OS・データベース・フレームワーク等のEOL（End of Life）とサポート期限を、日本語で分かりやすく確認するための静的サイトです。

## コンセプト

単なる endoflife.date の翻訳ではなく、以下を日本向けの付加価値として提供します。

- EOLまで「あと何日」を表示
- 30日 / 90日 / 180日 / 1年以内の期限を優先表示
- 製品名 + バージョン + EOL の検索意図に最適化した個別ページ
- 日本語の短い判断ガイド
- EOLカレンダー、RSS、iCalendar
- 公式リリースポリシーと元データへのリンク
- 180日以内にEOLを迎える製品のうち、直近30日で関心が集まっている情報を表示

## 技術構成

- Astro 7 / TypeScript
- 静的HTML生成（SSRなし）
- Cloudflare Workers + Static Assets
- endoflife.date API v1 `/api/v1/products/full`
- Cloudflare Web Analytics
- GitHub ActionsでEOLデータを1日1回同期
- GitHub ActionsでEOL注目度ランキングを週1回同期

## データ更新の流れ

```text
endoflife.date API
       ↓ 1日1回
GitHub Actions
       ↓
src/data/eol-snapshot.json
       ↓ PR / merge
GitHub main
       ↓
Cloudflare Workers build
       ↓
静的HTML / RSS / iCalendar / sitemap
```

Cloudflareのビルド時に外部APIを必須にしないことで、API一時障害や仕様変更の影響を本番配信から切り離します。

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

集計対象は「180日以内にEOLを迎える製品」、順位は「直近30日間の製品ページ閲覧数」です。これにより、EOLが近い製品の中で当サイト利用者の関心がどこに集まっているかを見るための補助指標として利用します。

GitHub Actionsの `Sync EOL attention ranking` は毎週月曜 00:45 UTC に実行し、ランキングJSONに変更があれば `chore/eol-attention-ranking` ブランチのPRを作成または更新します。

ランキングの変更判定では、集計時刻だけの差分は無視します。Top 10の製品・順位・Page Views、30日/180日条件、データソースがすべて前回と同じ場合は既存JSONを書き換えず、PRも作成しません。

事前設定:

1. Cloudflare DashboardのWeb Analyticsで `eol.slothwright.com` を有効化する。Cloudflareでプロキシしているサイトは自動セットアップを利用できます。
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

`EOL_AUTOMATION_TOKEN` はランキング更新ブランチのpushとPR作成・更新に使います。標準の `GITHUB_TOKEN` でActionsからPRを作成すると、そのPRのCIは承認待ちになるため、通常のPRと同様にCIを自動実行させる目的で専用トークンを使用します。不要な権限は追加せず、トークンの有効期限前に更新してください。

Cloudflare Secretsが未設定の場合、ランキング同期はデータ取得をスキップします。`EOL_AUTOMATION_TOKEN` が未設定の場合は、自動PRのCIを保証できないためworkflowを明示的に失敗させます。ランキングデータが空の場合、トップページのランキングセクションは表示しません。

## ローカル実行

```bash
npm install
npm run dev
```

データを最新化する場合：

```bash
npm run sync:eol
```

Cloudflare Web Analyticsのランキングを更新する場合：

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ACCOUNT_ID=... \
npm run sync:attention
```

本番ビルド：

```bash
npm run build
```

## Cloudflare Workers

推奨設定：

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Environment variable:
  PUBLIC_SITE_URL=https://eol.slothwright.com
```

独自ドメイン決定後は `PUBLIC_SITE_URL` と `public/robots.txt` のSitemap URLを合わせて変更してください。

## 主要URL

```text
/                       トップ
/eol/                    製品一覧・検索
/eol/{product}/          製品別EOLページ
/upcoming/               今後1年のEOL
/calendar/               月別EOLカレンダー
/calendar.ics            iCalendar
/feed.xml                RSS
/sitemap.xml             XML Sitemap
/about/                  出典・免責事項
```

## データ出典・ライセンス

ライフサイクルデータの一部は [endoflife.date](https://endoflife.date/) を利用します。endoflife.date および関連データはMIT Licenseで提供されています。詳細は `THIRD_PARTY_NOTICES.md` を参照してください。

製品説明文をそのまま翻訳・転載せず、日本語説明は独自に作成します。

## 開発方針

Codex / AIによる実装ルールは `AGENTS.md`、ロードマップは `ROADMAP.md`、設計詳細は `docs/ARCHITECTURE.md` と `docs/SEO.md` を参照してください。
