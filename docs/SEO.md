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

## Search Console / CTR policy

製品ページのtitle・descriptionは、推測だけで主要製品を一括変更しない。Search Console の表示回数・CTR・平均掲載順位・実クエリを根拠に、改善対象を少数ずつ選ぶ。

- CSV解析は `npm run analyze:gsc -- <csv>` を使用する。
- 1ページ目に表示されているのにCTRが低い行をtitle / descriptionレビュー候補とする。
- 11〜20位の行はtitle変更より先に本文・内部リンク・検索意図との一致を確認する。
- 実クエリで根拠が確認できた製品だけ `src/data/product-seo.ts` にoverrideを追加する。
- overrideには `rationale` を残し、変更理由を追跡できるようにする。
- Search Console の生エクスポートはGitHubへコミットしない。

詳細運用は `docs/SEARCH_CONSOLE.md` を参照する。

Reference:
- https://support.google.com/webmasters/answer/7576553?hl=ja
- https://support.google.com/webmasters/answer/7042828?hl=ja
- https://developers.google.com/search/docs/appearance/title-link?hl=ja

## Structured data policy

- JSON-LDを使用する。
- 製品EOLページは記事ではなくリファレンスページなので `WebPage` を使用する。
- 検索結果で現在サポートされる機能として `BreadcrumbList` を維持する。
- FAQ本文は表示するが、Google検索でFAQリッチリザルトが廃止されたため `FAQPage` JSON-LDは付けない。
- `TechArticle` や `Article` を検索表示目的だけで無理に付けず、ページの実態に合う型を優先する。
- 構造化データは画面上の内容と矛盾させない。
- `npm run build` 後に `npm run validate:seo` を実行し、全製品ページのcanonical、JSON-LD、breadcrumb、index方針、sitemapを検査する。

Reference:
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/updates

## Indexing

製品ページはすべてユーザーから閲覧可能な静的ページとして生成する。一方で、検索エンジンへのindex対象はページの情報量で選別し、データが乏しいページを検索流入目的だけで大量indexさせない。

### Indexする製品ページ

次のどちらかを満たす製品ページをindex対象とする。

1. `src/data/product-meta.ts` に独自日本語summaryがある。
2. 独自summaryがなくても、EOL日が確定しているリリース系列が2件以上あり、公式release policyまたはendoflife.dateの参照リンクを持つ。

この判定は `src/lib/index-policy.ts` に集約する。主要製品は独自コンテンツによってindexを維持し、それ以外は実際のライフサイクルデータが十分にある場合だけindexする。

### noindexにする製品ページ

上記条件を満たさない製品ページは削除せず、`noindex,follow` とする。

- 製品一覧やカテゴリからは引き続き閲覧できる。
- ページ内の一次情報や関連ページへのリンクはfollow可能なままにする。
- XML sitemapからは除外する。
- 将来データが充実してindex条件を満たした場合は、自動的にindex対象へ戻る。

### Validation

`npm run validate:seo` では以下を検証する。

- 全製品ページのself canonical。
- noindexページが `follow` を維持していること。
- index対象ページだけがsitemapへ含まれること。
- noindexページがsitemapへ混入しないこと。
- index/noindexの件数をCIログへ出力すること。

その他の基本方針:

- canonicalを固定する。
- XML sitemapを自動生成する。
- 404はnoindexとする。
- URLパラメータで検索結果ページを生成しない。
- JSだけに重要コンテンツを閉じ込めない。

Reference:
- https://developers.google.com/search/docs/crawling-indexing/block-indexing
- https://developers.google.com/search/docs/essentials/spam-policies
