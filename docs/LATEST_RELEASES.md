# 最新リリース情報ページ設計

## 目的

EOL情報.jp では「いつサポートが終わるか」に加えて、「現在サポート中の系列で最新版はいくつか」を横断して確認できるようにする。

`/changes/` は EOL 日・通常サポート期限・新規系列の変更履歴を扱い、`/releases/` は各サポート系列の `latest` を扱う。両者は用途を分離する。

## データソース

新しい外部API、Worker、KV、DBは追加しない。

- 既存の `src/data/eol-snapshot.json`
- endoflife.date API v1 から同期済みの `release.latest.name`
- `release.latest.date`
- `release.latest.link`
- 系列の EOL / LTS / category 情報

ビルド時にlive APIへ接続しない既存方針を維持する。

## 掲載条件

以下をすべて満たす系列のみ掲載する。

1. `latest.name` と `latest.date` がある
2. `isEol` ではない
3. EOL日がある場合はJST基準で期限前または当日
4. EOL日がない場合は `isMaintained` が true
5. `latest.date` が未来日ではない

EOL済み系列と、期限不明かつ非maintainedの系列は「最新リリース」ページから除外する。過去系列は製品詳細ページで確認できる。

## UI

URL: `/releases/`

初期表示は直近30日。全データ自体は静的HTMLに含め、ブラウザ上で次のフィルタを行う。

- 7日
- 30日
- 90日
- 全期間
- category
- 製品名 / slug / 系列 / 最新版番号の検索

各行に表示する内容:

- 最新版リリース日
- 製品名
- category
- サポート系列
- 最新版番号
- LTS表示
- EOL / セキュリティ終了日
- 製品詳細ページ
- upstreamの最新版参照先（http/httpsの場合のみ）

JavaScriptが無効な場合は絞り込みを行わず全件を表示する。

## 情報の意味

このページの「最新」は endoflife.date の各release cycleに記録された `latest` を意味する。

このページではリリースノート本文の転載・機械翻訳・AI要約を行わない。「何が変わったか」の説明は、既存の主要製品向け手動レビュー済み `release-highlights` と分離する。

重要な更新判断では upstream の公式情報確認を案内する。

## SEO / discoverability

- canonical: `/releases/`
- index対象の通常静的ページ
- メインナビの「変更履歴」を「最新リリース」へ置き換える
- 変更履歴はフッターと製品詳細から引き続き到達可能
- トップページheroにも「最新リリースを見る」を追加

Search Console実データがない段階では、製品別の「最新バージョン」専用URLや大量の派生ページは作らない。

## 性能

`/releases/` を `performance-budget.json` の監視対象へ追加する。

初回は実測取得用に余裕のある上限を設定し、CIのProduction buildで実サイズを確認後に適正な固定予算へ締める。

## 将来拡張

利用実績が確認できた場合のみ検討する。

- `latest-changed` の履歴蓄積
- 最新リリース専用RSS
- マイEOL登録製品だけの最新版更新表示
- 主要製品の手動レビュー済みリリース変更点との連携

全製品のリリースノート自動要約や、製品ごとの外部API直接巡回はMVP対象外とする。
