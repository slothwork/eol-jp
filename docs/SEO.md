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
```

将来、検索実績が十分ある場合のみバージョン専用URLを検討する。初期段階で `/eol/python/3.10/` のような薄いページを大量生成しない。

## Product page content requirements

1. 製品名 + EOL / サポート終了をH1に含める。
2. バージョン別一覧をHTML tableでSSR不要の静的HTMLとして出力。
3. EOL日と「あとN日」を併記。
4. 公式release policy linkを掲載。
5. 「どうすればいい？」に日本語の判断補助を置く。
6. 独自日本語summaryを主要製品から順次追加。

## Indexing

- canonicalを固定。
- XML sitemapを自動生成。
- 404はnoindex。
- URLパラメータで検索結果ページを生成しない。
- JSだけに重要コンテンツを閉じ込めない。
