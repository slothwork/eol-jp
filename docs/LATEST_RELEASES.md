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
6. `latest.date` がJST基準で直近365日以内

EOL済み系列と、期限不明かつ非maintainedの系列は「最新リリース」ページから除外する。最新版の更新が1年以上前のサポート系列も一覧には載せず、製品詳細ページで確認できる。

## UI

URL: `/releases/`

一覧は**1ページ20件**とし、DOM上に同時に存在するリリースカードも最大20件に制限する。

初期HTMLには直近30日のうち最新20件だけを含める。ブラウザ上で次のフィルタを行う。

- 7日
- 30日
- 90日
- 1年（365日）
- category
- 製品名 / slug / 系列 / 最新版番号の検索
- 前へ / 次へによる20件単位のページ送り

初期20件から先へ進む、期間を変更する、categoryや検索を使う場合に、ビルド済みの同一オリジン静的JSON `/releases/data.json` を必要時だけ読み込む。このJSONには直近365日の対象系列をデータとして含めるが、**全件をDOM化しない**。フィルタ結果から現在ページの最大20件だけを生成し、既存の20件を `replaceChildren` で置き換える。

このため、1年分の対象件数が増えてもDOMノード数は対象件数に比例して増加しない。外部APIやWorker処理は発生しない。

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

JavaScriptが無効な場合は直近30日のうち最新20件を表示する。

## ページングを採用する理由

初回MVPでは、90日・1年を選択した際に静的JSONの全エントリを `article` 要素へ変換し、一括でDOMへ追加してから `hidden` で絞り込んでいた。件数が多い環境では、表示されないカードまで生成するためメインスレッド負荷が大きく、画面が固まる原因になった。

現在はデータ件数とDOM件数を分離する。365日分は軽量なJSONデータとして保持し、実際にDOMへ描画するのは現在ページの20件だけとする。

ページ番号はURLの `page` queryに保持し、期間・category・検索条件を変更した場合は1ページ目へ戻す。

## なぜ全期間を初期HTMLへ含めないか

初回実装で全サポート系列をHTMLへ含めたところ、Production buildの `/releases/` は raw HTML 約1.34MB / gzip相当約78.5KiBとなった。直近365日に絞っても raw HTML 約1.18MB / gzip相当約69.7KiB で、通常利用には重すぎた。

そのため探索上限を直近1年とし、さらに初期HTMLを最新20件へ制限する。続きはユーザー操作時だけ静的JSONから読み込む。SEO向けには最新の代表情報をHTMLに残しながら、通常アクセス時の転送量とDOM量の両方を抑える。

1年以上前の系列は既存の製品詳細ページに委ねる。

## 情報の意味

このページの「最新」は endoflife.date の各release cycleに記録された `latest` を意味する。

このページではリリースノート本文の転載・機械翻訳・AI要約を行わない。「何が変わったか」の説明は、既存の主要製品向け手動レビュー済み `release-highlights` と分離する。

重要な更新判断では upstream の公式情報確認を案内する。

## SEO / discoverability

- canonical: `/releases/`
- index対象の通常静的ページ
- 最新20件は静的HTMLとして検索エンジンから読める状態を維持
- メインナビから到達可能
- 変更履歴はフッターと製品詳細から引き続き到達可能
- トップページheroにも導線を持つ

Search Console実データがない段階では、製品別の「最新バージョン」専用URLや大量の派生ページは作らない。

## 性能・回帰防止

`/releases/` とオンデマンド静的JSONをperformance budgetで継続監視する。

さらにbuild後テストで次を固定する。

- 初期HTMLの `data-release-item` は最大20件
- `/releases/data.json` はschemaVersion 2、最大365日
- clientは `slice(start, start + PAGE_SIZE)` で現在ページだけを対象にする
- 一括appendではなく `replaceChildren` で現在ページを差し替える

これにより、将来のデータ増加で「全件DOM化」が再導入されるのをCIで検知する。

## 将来拡張

利用実績が確認できた場合のみ検討する。

- `latest-changed` の履歴蓄積
- 最新リリース専用RSS
- マイEOL登録製品だけの最新版更新表示
- 主要製品の手動レビュー済みリリース変更点との連携

全製品のリリースノート自動要約や、製品ごとの外部API直接巡回はMVP対象外とする。
