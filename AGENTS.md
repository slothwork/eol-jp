# AGENTS.md

## Project goal

日本の開発者・インフラ担当・情シス向けに、ソフトウェアのEOLとサポート期限を「判断しやすい日本語」で提示する。

## Non-negotiable architecture

1. Astro + TypeScriptの静的サイトを維持する。初期フェーズではSSR、DB、ログインを導入しない。
2. ライフサイクルデータの主ソースは endoflife.date API v1 とする。HTMLスクレイピングは禁止。
3. Cloudflare Pagesのbuild時にendoflife.date APIを必須依存させない。コミット済み `src/data/eol-snapshot.json` からbuildする。
4. API取得・正規化は `scripts/sync-eol.mjs` に集約し、API仕様変更はここで吸収する。
5. endoflife.dateの製品説明文を機械翻訳して転載しない。日本語説明は `src/data/product-meta.ts` 等で独自作成する。
6. 元データ、公式サポート方針、免責事項への導線を削除しない。

## UX rules

- ISO日付だけで終わらせず「EOLまであとN日」を併記する。
- 0–30日: critical、31–90日: warning、91–180日: planning、181日以上: supported。
- EOL済みを明確に区別する。
- 「アップグレード推奨」は断定せず、公式移行ガイド・互換性確認を促す。
- モバイルで期限が読みやすいことを優先する。

## SEO rules

- 製品ページのcanonicalは `/eol/{slug}/`。
- タイトルの基本形は `{製品名}のEOL・サポート終了日 | EOL情報.jp`。
- 主要検索意図: `{product} EOL`, `{product} サポート期限`, `{product} {version} EOL`。
- sitemap、RSS、iCalendarを壊さない。
- 薄い自動生成記事を大量作成しない。製品ページに独自価値を追加する。

## Data integrity

- 日付は `YYYY-MM-DD` を正規形とする。
- 不明な日付を推測しない。nullは「未定」と表示する。
- EOL期限の変更を `change-log.json` に記録する。
- API schema versionをsnapshotに保存する。
- 新しいAPIフィールドをUIへ直接漏らさず、正規化層を通す。

## Testing before merge

- `npm run check`
- `npm run build`
- `/`, `/eol/`, `/upcoming/`, `/calendar/`, 主要製品ページが生成されること。
- sitemap.xml / feed.xml / calendar.ics が生成されること。
- EOL日境界（昨日/今日/30/90/180日）を確認すること。

## Future features

通知・ユーザー登録・Slack/メール連携はPhase 3以降。静的MVPに混ぜない。
