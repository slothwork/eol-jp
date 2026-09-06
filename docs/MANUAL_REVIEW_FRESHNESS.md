# Manual review freshness policy

EOL情報.jpでは、endoflife.dateの自動同期とは別に、公式一次情報を人手で確認しているコンテンツがあります。これらが長期間再確認されないまま残らないよう、確認日をCIで監視します。

## 対象

- 主要20製品の公式ソース確認日 `sourceCheckedAt`
- 公式日付との比較確認日 `comparisonCheckedAt`（`pending` 以外）
- 日本で利用できる商用サポート情報の `checkedAt`
- 主要製品のリリース変更点の `checkedAt`

## 閾値

- 180日未満: fresh
- 180日以上365日未満: warning（再確認推奨）
- 365日以上: overdue（CI失敗）
- `YYYY-MM-DD` でない日付、実在しない日付: invalid（CI失敗）
- GitHub ActionsのUTC日付との差を考慮し、1日先までは許容する。2日以上未来の日付はinvalidとする。

warningは開発を停止させず、期限が近づいていることを事前に知らせるためのものです。365日を超えた場合は、新しい変更をマージする前に一次情報を再確認し、確認日と必要な内容を更新します。

## 実行

```bash
npm run test:manual-review-freshness
npm run check:manual-review-freshness
```

CIではPRごとに実行します。さらに定期GitHub Actionsでもmainを監視するため、コード変更がない期間でも期限超過を検出できます。

## 再確認時のルール

1. `checkedAt` だけを機械的に更新しない。
2. 記載している一次情報URLを実際に開き、内容が現在も正しいことを確認する。
3. サポート期間、製品名、契約条件、リリース内容などに変更があれば本文も同時に修正する。
4. 公式ソース照合では、可能な製品についてsnapshotのEOL日との比較も再確認する。
5. 不明な日付や条件は推測せず、必要ならpartial / not-comparable等の状態を維持または変更する。

この仕組みは「確認日を更新すること」ではなく、手動で付加した信頼情報を定期的に一次情報へ戻って検証することを目的とします。
