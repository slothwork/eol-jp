# SEO strategy

## Search intent hierarchy

### Primary

- `Node.js EOL`
- `Python 3.10 EOL`
- `PHP 8.2 サポート期限`
- `Ubuntu 24.04 EOL`
- `PostgreSQL 14 EOL`

### Secondary

- `EOL 一覧`
- `サポート終了 一覧`
- `ソフトウェア EOL カレンダー`
- `今月 EOL`

## URL design

```text
/eol/{product}/
/upcoming/
/calendar/
/changes/
```

将来、検索実績が十分ある場合のみバージョン専用URLを検討する。初期段階で `/eol/python/3.10/` のような薄いページを大量生成しない。

## Product page content requirements

1. 製品名 + EOL / サポート終了をH1に含める。
2. バージョン別一覧をHTML tableでSSR不要の静的HTMLとして出力。
3. EOL日と「あとN日」を併記。
4. 公式release policy linkを掲載。
5. 「どうすればいい？」に日本語の判断補助を置く。
6. 独自日本語summaryを主要製品から順次追加。
7. FAQはユーザー向けの可視コンテンツとして掲載する。
8. 製品ごとの公式移行・アップグレード資料へ導線を置ける場合は追加する。

## Structured data policy

- JSON-LDを使用する。
- 製品EOLページは記事ではなくリファレンスページなので `WebPage` を使用する。
- 検索結果で現在サポートされる機能として `BreadcrumbList` を維持する。
- FAQ本文は表示するが、Google検索でFAQリッチリザルトが廃止されたため `FAQPage` JSON-LDは付けない。
- `TechArticle` や `Article` を検索表示目的だけで無理に付けず、ページの実態に合う型を優先する。
- 構造化データは画面上の内容と矛盾させない。
- `npm run build` 後に `npm run validate:seo` を実行し、全製品ページのcanonical、JSON-LD、breadcrumb、sitemapを検査する。

Reference:
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/updates

## Indexing

- canonicalを固定。
- XML sitemapを自動生成。
- 404はnoindex。
- URLパラメータで検索結果ページを生成しない。
- JSだけに重要コンテンツを閉じ込めない。
