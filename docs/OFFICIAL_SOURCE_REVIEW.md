# Official source review

Phase 4では、endoflife.date由来のスナップショットをそのまま「公式確認済み」と扱わず、主要製品について独立したベンダー/公式プロジェクトの一次情報を確認する。

## Purpose

二重確認では次の2段階を分ける。

1. **公式ソース確認**: ベンダーまたは公式プロジェクトのライフサイクル/サポート情報URLを確認する。
2. **日付照合**: その公式情報と `src/data/eol-snapshot.json` の対象リリース日付を人手で比較する。

公式URLを登録しただけで `matched` にしてはいけない。

## Registry

台帳は `src/data/official-source-reviews.ts` で管理する。

主なフィールド:

- `sourceLabel`: 公開ページに表示する公式ソース名
- `sourceUrl`: endoflife.dateとは独立した公式一次情報
- `coverage`: 公式ページで何を確認できるか
- `sourceCheckedAt`: 公式ソースURLを最後に確認した日
- `comparisonStatus`: スナップショットとの日付照合結果
- `comparisonCheckedAt`: 実際に日付照合した日
- `note`: エディション差、ベンダー差、TBDなどの注意点

## Coverage

- `direct-dates`: 公式ページにリリース別の期限が直接掲載されている。
- `policy-only`: サポート期間のルールはあるが、固定EOL日が直接掲載されていない、または条件で決まる。
- `vendor-dependent`: 利用ベンダー/ディストリビューションにより期限が異なる。
- `release-status-only`: リリース状況は確認できるが、公式EOL一覧として比較できない。

## Comparison status

- `pending`: 公式ソースは確認したが、スナップショットとの日付照合はまだ行っていない。
- `matched`: 対象となる現行リリースの日付を人手で照合し、一致を確認した。
- `partial`: 一部リリースだけ一致確認済み、または公式表の対象範囲がスナップショットより狭い。
- `not-comparable`: 公式ソースが固定日を出していない、またはベンダー依存などで一律比較できない。

## Manual review procedure

1. `/trust/official-sources/` または台帳から `pending` 製品を選ぶ。
2. `sourceUrl` を開き、対象製品/エディション/リリース系列が正しいか確認する。
3. `src/data/eol-snapshot.json` のサポート中系列を公式ソースと比較する。
4. 次を確認する。
   - release date
   - active/mainstream support end（公式が提供している場合）
   - security/extended support end または EOL
   - LTS / STS / Maintenance などのフェーズ
5. 完全一致なら `matched` と `comparisonCheckedAt` を更新する。
6. 一部だけ比較できる場合は `partial` とし、`note` に差分理由を書く。
7. 不一致の場合は即座に推測修正しない。製品エディション、商用サポート、延長サポート、タイムゾーン、月単位表記などを確認してから対応する。

## Rules

- HTML scrapingで公式ページから自動的にEOLデータを取り込まない。
- 機械翻訳したサポート期限を根拠にしない。
- `null` / TBD は推測して埋めない。
- Javaなどベンダー依存製品を単一ベンダーの期限だけで一般化しない。
- Redis Open Source / Redis Cloud / Redis Softwareなど製品ラインを混同しない。
- Windowsはedition/service channel、Windows Serverはmainstream/extended supportを区別する。
- UbuntuはStandard Security MaintenanceとUbuntu Pro/ESMを区別する。

## Public transparency

`/trust/official-sources/` では主要20製品について、公式ソース、掲載形式、日付照合状態、確認日を公開する。

このページの目的は「すべて一致確認済み」と見せることではなく、確認済み範囲と未確認範囲を明示すること。
