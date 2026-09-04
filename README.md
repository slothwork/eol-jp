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

## 技術構成

- Astro 7 / TypeScript
- 静的HTML生成（SSRなし）
- Cloudflare Pages
- endoflife.date API v1 `/api/v1/products/full`
- GitHub Actionsで1日1回データ同期

## データ更新の流れ

```text
endoflife.date API
       ↓ 1日1回
GitHub Actions
       ↓
src/data/eol-snapshot.json
       ↓ commit
GitHub main
       ↓
Cloudflare Pages build
       ↓
静的HTML / RSS / iCalendar / sitemap
```

Cloudflareのビルド時に外部APIを必須にしないことで、API一時障害や仕様変更の影響を本番配信から切り離します。

## ローカル実行

```bash
npm install
npm run dev
```

データを最新化する場合：

```bash
npm run sync:eol
```

本番ビルド：

```bash
npm run build
```

## Cloudflare Pages

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
