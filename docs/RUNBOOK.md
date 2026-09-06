# Operations Runbook

最終更新: 2026-09-06

## 目的

EOL情報.jp の本番運用で障害・同期失敗・外部サービス不調・資格情報更新が発生したときに、原因を短時間で切り分け、安全に復旧するための手順です。

このRunbookは「その場しのぎで本番を直接編集する」ためのものではありません。原則は次のとおりです。

- EOL日付を推測して手で補完しない。
- 正常な `src/data/eol-snapshot.json` を障害時に上書きしない。
- 静的ページ、Worker API、外部サービスを分けて切り分ける。
- 秘密値、Webhook URL、管理token、メールアドレスをIssue・PR・ログへ貼らない。
- 復旧変更は通常どおりGitHub PR + CIを通し、緊急時も可能な限り履歴を残す。
- Cloudflare KV namespaceを安易に作り直さない。binding変更は既存通知subscriptionを実質失うため高リスク変更として扱う。

関連資料:

- アーキテクチャ: `docs/ARCHITECTURE.md`
- 通知仕様: `docs/NOTIFICATIONS.md`
- セキュリティ運用: `docs/SECURITY_OPERATIONS.md`
- Search Console運用: `docs/SEARCH_CONSOLE.md`
- 実装ルール: `AGENTS.md`

## 障害レベル

### S1 — サイト閲覧またはEOL情報の信頼性に大きく影響

例:

- トップ・製品ページが広範囲で表示できない。
- 誤ったEOL日を多数ページへ配信した。
- Workerの変更がStatic Assets配信まで巻き込んでいる。

最優先で切り戻しまたは配信復旧を行う。

### S2 — 動的機能または鮮度に影響

例:

- Slack / Discord / メール通知が停止。
- 公開JSON API / badgeが停止。
- committed snapshotが168時間以上古く、freshness checkが失敗。
- Workers KV bindingが外れている。

静的EOL閲覧が正常なら、まず静的配信を維持したまま動的経路だけを復旧する。

### S3 — 補助機能・運用警告

例:

- 注目度ランキングの同期失敗。
- GitHub Repository ImportがGitHub APIレート制限で利用できない。
- 手動レビュー情報がwarning期間に入った。

EOL日付の基本閲覧は継続し、通常PRで修正する。

## 最初の5分で行う確認

本番URLは `https://eol.slothwright.com`。

### 1. 静的ページが生きているか

```bash
curl -sSI https://eol.slothwright.com/
curl -sSI https://eol.slothwright.com/eol/nodejs/
```

HTTP 200系でHTMLが返るか確認する。

ここが失敗している場合は、通知や外部APIより先に Cloudflare deployment / Static Assets / DNS の確認へ進む。

### 2. Workerの公開APIが生きているか

```bash
curl -fsS https://eol.slothwright.com/api/v1/products/nodejs
curl -sSI 'https://eol.slothwright.com/badge/nodejs.svg?version=22'
```

静的ページは正常でここだけ失敗する場合、Worker entrypoint・deployment・runtime bindingを疑う。

### 3. 通知設定の存在確認

```bash
curl -fsS https://eol.slothwright.com/api/notifications/config
curl -fsS https://eol.slothwright.com/api/notifications/email/config
```

期待値:

- Slack / Discord: `enabled: true`
- Email: `enabled: true`

これらのconfig endpointは主に「必要な設定値が存在するか」を判定する。Turnstile SiteverifyやResend API keyが実際に有効かまでは保証しないため、資格情報変更後はE2E確認も必要。

### 4. GitHub Actionsを確認

主なWorkflow:

| Workflow | Schedule | 用途 |
| --- | --- | --- |
| `Sync EOL data` | 毎日 00:15 UTC / 09:15 JST | endoflife.date同期とPR作成 |
| `Sync EOL attention ranking` | 月曜 00:45 UTC / 09:45 JST | Cloudflare Web Analyticsランキング更新 |
| Worker Cron | 毎日 01:15 UTC / 10:15 JST | Slack / Discord / Email通知 |
| `Check manual review freshness` | 月曜 01:35 UTC / 10:35 JST | 手動確認情報の鮮度 |
| `Check EOL snapshot freshness` | 毎日 01:45 UTC / 10:45 JST | committed snapshotの鮮度 |
| `CI` | PR / main push | test / build / security / browser smoke / SEO |

直近の失敗Workflowが、現在の症状と一致するかを確認する。

### 5. 直近変更を確認

本番障害がデプロイ直後なら、直近のmain mergeとCloudflare deployment時刻を照合する。

- コード変更直後に発生: deployment regressionを優先して疑う。
- コード変更なしで発生: Cloudflare / GitHub / endoflife.date / Turnstile / Resend / Slack / Discord等の外部要因を疑う。

---

## Runbook A — 本番ページが表示できない

### 症状

- `/` や `/eol/nodejs/` が5xx / connection error。
- 静的HTMLまで表示できない。

### 切り分け

1. Cloudflare deploymentが成功しているか確認。
2. mainの直近PRでbuild / Worker entrypoint / `wrangler.jsonc` / security runtimeを変更していないか確認。
3. GitHub CIの `Production build` と `Browser smoke tests` が成功していたか確認。
4. `wrangler.jsonc` の現在の重要設定を確認。

```text
main = ./worker/security-runtime.ts
assets.directory = ./dist
assets.binding = ASSETS
keep_vars = true
```

5. Cloudflare側のサービス障害が疑われる場合は、コード変更を重ねず外部障害とdeployment regressionを区別する。

### 復旧

直近deploymentが原因と判断できる場合:

1. Cloudflare Dashboardで直前の正常deploymentへrollbackできる場合はrollbackする。
2. GitHub側では原因PRをrevertするPRを作り、CIを通してmainへ戻す。
3. Dashboardだけを恒久状態にせず、Git履歴と本番状態を一致させる。

外部Cloudflare障害の場合:

- EOLデータやコードを変更しない。
- 復旧後に静的ページ、Worker API、通知configを順に再確認する。

### 復旧確認

```bash
curl -sSI https://eol.slothwright.com/
curl -sSI https://eol.slothwright.com/eol/nodejs/
curl -fsS https://eol.slothwright.com/api/v1/products/nodejs
```

セキュリティ関連変更を伴った場合:

```bash
curl -sSI https://eol.slothwright.com/
```

でHSTS / CSP / nosniff等も確認する。

---

## Runbook B — `Sync EOL data` が失敗した

### 重要な前提

同期失敗時も、本番サイトはコミット済みの直前正常snapshotを使い続ける。失敗した取得結果でsnapshotを上書きしない。

### 切り分け

GitHub Actions `Sync EOL data` の失敗stepを確認する。

主な分類:

1. endoflife.date API取得・通信失敗
2. API schema / normalization validation失敗
3. Git branch push失敗
4. PR作成失敗
5. 作成された同期PRのCI失敗

### API取得失敗

- upstream一時障害なら日付を手入力しない。
- Workflowを時間を空けて `workflow_dispatch` で再実行する。
- ローカル再現時は:

```bash
npm run sync:eol
```

### schema / normalization失敗

API仕様変更の可能性がある。

1. `scripts/sync-eol.mjs` のvalidation失敗箇所を確認。
2. 新しいAPI fieldをUIへ直接流さず、内部schemaへ明示的に正規化する。
3. 既存snapshotを残したまま修正PRを作る。
4. CI通過後に再同期する。

### branch push / PR作成失敗

`Sync EOL data` はGitHub Actionsのrepository tokenで `chore/eol-data-sync` を更新する。

- workflow permissionsが `contents: write`, `pull-requests: write` のままか確認。
- repository settings変更でGitHub Actionsの書込権限が制限されていないか確認。

### 同期PRのCI失敗

同期PRを無理にmergeしない。

最低限確認:

```bash
npm run test:eol-audit
npm run check:snapshot-freshness
npm run check
npm run build
```

CI上では全テスト、Browser smoke、SEO validationまで通してからmergeする。

### 復旧確認

1. `Sync EOL data` が成功。
2. `chore/eol-data-sync` PRの差分を確認。
3. CI成功後にmerge。
4. mainの `src/data/eol-snapshot.json` の `generatedAt` が更新されたことを確認。
5. `Check EOL snapshot freshness` を手動実行して成功することを確認。

---

## Runbook C — snapshot freshnessがwarning / failure

現在の基準:

- 72時間以上: warning
- 168時間以上または不正な `generatedAt`: failure

確認コマンド:

```bash
npm run check:snapshot-freshness
```

### よくある原因

- `Sync EOL data` が失敗している。
- 同期PRが作成済みだが長期間mergeされていない。
- GitHub Actions scheduleが停止している。
- snapshotの `generatedAt` が壊れている。

### 復旧

1. Openな `chore/eol-data-sync` PRがあるか確認。
2. PRが正常でCI成功済みならmerge。
3. PRが無い場合は `Sync EOL data` をmanual dispatch。
4. Workflow失敗ならRunbook Bへ進む。
5. `generatedAt` だけを手作業で現在時刻へ変更してfresh扱いにしない。

サイト側のstale表示もcommitted snapshotを根拠にしているため、実データを更新せず表示だけ消す対応は禁止。

---

## Runbook D — 手動レビュー情報の鮮度警告

現在の基準:

- 180日以上: warning
- 365日以上: failure

確認:

```bash
npm run check:manual-review-freshness
```

対象は公式ソース照合、公式日付比較、商用サポート、主要リリース変更点など。

### 復旧

1. failure / warning対象のrecordを確認。
2. 必ず公式一次情報を再確認する。
3. 内容に変更があればデータと注記を更新する。
4. 内容に変更がなくても、実際に一次情報を確認した場合だけ `checkedAt` 等を更新する。
5. 日付だけ機械的に延長しない。
6. 関連test + CI成功後にmergeする。

---

## Runbook E — 注目度ランキング同期が失敗

この障害はEOL日付や製品ページの基本機能へ影響しないため通常はS3。

`Sync EOL attention ranking` が利用するGitHub secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
EOL_AUTOMATION_TOKEN
```

`EOL_AUTOMATION_TOKEN` は `eol-jp` のみに限定したfine-grained PATで、必要権限は:

```text
Contents: Read and write
Pull requests: Read and write
```

### 切り分け

- `EOL_AUTOMATION_TOKEN` が空: workflowは明示的に失敗。
- Cloudflare 2項目が空: ranking fetchをskip。
- Analytics API 401/403: Cloudflare API tokenの期限・権限を確認。
- Git push / PR作成失敗: GitHub PATの期限・repository permissionを確認。

### 復旧確認

secret更新後に `Sync EOL attention ranking` をmanual dispatchし、

1. Cloudflare ranking取得
2. change detection
3. 必要な場合のbranch push
4. PR作成/更新

まで成功することを確認する。

ランキングが空の場合はセクションが非表示になるだけで、EOLページを止めない。

---

## Runbook F — Slack / Discord通知の新規登録ができない

最初に:

```bash
curl -fsS https://eol.slothwright.com/api/notifications/config
```

### `enabled: false`

必要条件を確認:

- `NOTIFICATION_SUBSCRIPTIONS` KV binding
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

`wrangler.jsonc` のKV binding名は必ず:

```text
NOTIFICATION_SUBSCRIPTIONS
```

namespace IDを別namespaceへ変更すると、既存subscriptionが見えなくなる。

### `enabled: true` だが登録だけ失敗

確認:

1. Turnstile widgetのallowed hostnameに `eol.slothwright.com` がある。
2. Site key / secret keyが同じwidgetの組み合わせ。
3. Turnstile actionが `external_notification`。
4. `Origin` が本番originと一致。
5. IP 1時間5件 / サイト全体100件/日のregistration soft limitに達していない。
6. Slack / Discord webhook hostが正規のURLか。

Turnstile自体の外部障害時は新規登録が止まるが、既存のSlack / Discord subscriptionのscheduled deliveryはTurnstile Siteverifyを呼ばないため切り分けて考える。

### 復旧確認

本番UIからテスト用Webhookで1件登録し、固定テストメッセージが届くことを確認する。

実Webhook URLをIssueやログへ残さない。

---

## Runbook G — Slack / Discordの日次通知が届かない

Cron:

```text
15 1 * * *
毎日 01:15 UTC / 10:15 JST
```

### 切り分け

1. Cloudflare Cron triggerが有効か。
2. Worker scheduled handlerが呼ばれているか。
3. KV bindingが正しいか。
4. `/my-eol-data.json` をWorkerから読めるか。
5. subscriptionの対象version / threshold / EOL日が実際にdueか。
6. Slack / Discord provider側でWebhookが有効か。

Webhook送信が404 / 410を返すと、そのsubscriptionは無効化される設計。Webhookを作り直した場合はユーザー側で通知設定を再登録する。

### コード変更後の回帰確認

```bash
npm run test:external-notifications
npm run test:external-notification-client
npm run test:worker-runtime-routing
```

公開の「cronを強制実行するdebug endpoint」は追加しない。

---

## Runbook H — メール通知が利用できない

最初に:

```bash
curl -fsS https://eol.slothwright.com/api/notifications/email/config
```

必要なruntime設定:

```text
RESEND_API_KEY          secret
EMAIL_FROM              variable
TURNSTILE_SITE_KEY      variable
TURNSTILE_SECRET_KEY    secret
NOTIFICATION_SUBSCRIPTIONS  KV binding
```

### `enabled: false`

上記のどれかが欠けている。Cloudflare WorkerのProduction runtime設定を確認する。

`EMAIL_FROM` はResendで検証済みドメインを使用する。

### `enabled: true` だが確認メールが届かない

config endpointはResend keyの有効性までは検証しない。

確認:

1. Resend API keyが失効していない。
2. `EMAIL_FROM` のドメインがResendでverified。
3. Turnstile actionが `email_notification`。
4. Turnstile hostname設定が正しい。
5. 同一メール10分間隔 / 1日3回のverification limitに達していない。
6. サイト側80通/日の送信上限に達していない。
7. Resend側のFree plan上限・障害状況を確認。

資格情報変更後は本番UIで実際に確認コードを1通送って検証する。

### 日次メールだけ届かない

1. Cron invocationを確認。
2. Resend API応答をWorker logsで確認。
3. daily send quotaを確認。
4. subscriptionのdue判定を確認。

失敗時はdelivery keyを成功扱いにしないため、条件を満たしている間は次回処理で再送対象になり得る。

### 回帰確認

```bash
npm run test:email-notifications
npm run test:email-notification-client
npm run test:worker-runtime-routing
```

---

## Runbook I — Turnstile障害・設定不一致

Turnstileは新規のSlack / Discord登録とメール登録で使用する。

### 確認項目

```text
TURNSTILE_SITE_KEY      公開variable
TURNSTILE_SECRET_KEY    secret
allowed hostname        eol.slothwright.com
external action         external_notification
email action            email_notification
```

### 影響範囲

- 新規Slack / Discord登録: 影響あり
- 新規メール登録 / 確認コード送信: 影響あり
- 既存Slack / Discordの日次送信: Siteverifyを使わないため原則影響なし
- 既存メールの日次送信: Siteverifyを使わないためTurnstileサービス障害そのものでは原則影響なし
- 静的EOLページ / マイEOL: 影響なし

Turnstile障害を理由にTurnstile検証を一時的に無効化しない。新規登録を停止した状態で既存機能を維持する。

---

## Runbook J — Resend障害

### 影響範囲

- メール確認コード送信
- 日次メール通知

Slack / Discord、静的EOL、公開APIには影響させない。

### 対応

1. Resend側障害かAPI key失効かを区別する。
2. 障害中に有料プランへ自動移行する変更を入れない。
3. `RESEND_API_KEY` を変更する場合はRunbook Mのrotation手順を使う。
4. 復旧後に確認コードを1通送ってE2E確認。
5. 次回Cronのscheduled deliveryも確認する。

メール送信上限はサイト側80通/日を維持し、Free planの外へ自動課金しない。

---

## Runbook K — Workers KV異常 / binding不一致

### 症状

- 通知configがdisabled。
- 既存subscriptionが突然すべてnot found。
- GET / PUT / DELETEで `notification_storage_unconfigured`。

### 最重要確認

`wrangler.jsonc`:

```text
binding = NOTIFICATION_SUBSCRIPTIONS
namespace id = ee50aa2917ec4cdeae0f644f3b3bee23
```

### 禁止事項

- 「直りそう」という理由で新しいKV namespaceを作ってbindingを差し替えない。
- namespaceを削除しない。
- KV値を一括削除しない。

現状は通知subscriptionの恒久バックアップ/復元機構を持たない。namespace自体を失った場合、ユーザーの再登録が必要になる可能性がある。

### 復旧

1. binding名とnamespace IDをGitの `wrangler.jsonc` とCloudflare deploymentで照合。
2. 最近のdeploymentでbindingが変わったなら正常deploymentへrollback。
3. Git側も正しいbindingへrevert/fixし、CI後に再deploy。
4. config endpointと既存subscriptionで復旧確認。

---

## Runbook L — Public GitHub Repository Importが動かない

この機能はWorkerを経由せず、ブラウザからGitHub REST APIへ直接アクセスする。

### 影響範囲

GitHub Importだけ。静的EOLページ、通知、公開APIには影響しない。

### 切り分け

1. GitHub APIの未認証rate limit。
2. GitHub側障害。
3. 対象repositoryがprivate。
4. Dependency Graph / SBOMが利用できない。
5. CSP `connect-src` から `https://api.github.com` が欠落。
6. manifest / SBOMがMVPの上限を超えた。

回帰確認:

```bash
npm run test:github-import
npm run test:browser-smoke
npm run test:security-headers
```

rate limit回避のためにブラウザへGitHub token入力欄を追加したり、localStorageへtokenを保存したりしない。

---

## Runbook M — API token / secret / variableの更新

### 原則

可能な限り:

1. 新しい資格情報を発行
2. 利用先へ新値を設定
3. 本番E2E確認
4. 旧資格情報を失効

の順で行い、先に旧値を無効化して不要な停止時間を作らない。

秘密値をGitへcommitしない。

### GitHub repository secrets

#### `EOL_AUTOMATION_TOKEN`

用途: 注目度ranking branch push / PR操作。

更新後:

1. `Sync EOL attention ranking` をmanual dispatch。
2. Checkout / push / PR作成系stepが成功することを確認。
3. 成功後に旧PATをrevoke。

必要権限:

```text
Repository: eol-jp only
Contents: Read and write
Pull requests: Read and write
```

#### `CLOUDFLARE_API_TOKEN`

用途: Cloudflare Web Analytics読取。

必要権限:

```text
Account > Account Analytics > Read
```

更新後に `Sync EOL attention ranking` をmanual dispatchし、Analytics取得stepの成功を確認してから旧tokenをrevoke。

#### `CLOUDFLARE_ACCOUNT_ID`

秘密鍵ではないがworkflow設定値としてGitHub secretに保存している。Account変更時以外は通常rotation不要。

### Cloudflare Worker runtime secrets

#### `RESEND_API_KEY`

1. Resendで新keyを作る。
2. Cloudflare Production runtime secretを更新。
3. 必要なら再deploy。
4. `GET /api/notifications/email/config` を確認。
5. 本番UIから確認コードを実送信。
6. 成功後に旧Resend keyをrevoke。

config endpointが `enabled: true` でもkeyの有効性は証明できないため、実送信確認を省略しない。

#### `TURNSTILE_SECRET_KEY`

site keyと対になるsecret。新widgetへ切替える場合は `TURNSTILE_SITE_KEY` と組で更新する。

本番hostname `eol.slothwright.com` を許可してから切替える。

更新後はSlack / Discord登録とメール確認コード送信の両方を確認する。

### Cloudflare Worker variables

#### `EMAIL_FROM`

Resend verified domainの送信元。変更後は確認メールを1通送る。

#### `TURNSTILE_SITE_KEY`

公開値。対応するsecretと一致させる。

#### `PUBLIC_SITE_URL`

Cloudflare build variable:

```text
https://eol.slothwright.com
```

canonical等へ影響するため変更後はProduction build / SEO validationを確認する。

### deployment時にvariableが消えた場合

`wrangler.jsonc` は:

```json
"keep_vars": true
```

を維持する。

`EMAIL_FROM` や `TURNSTILE_SITE_KEY` がdeploy後に消えた場合:

1. `keep_vars: true` がmainにあるか確認。
2. Cloudflare Production runtime variablesを再登録。
3. 再deploy。
4. notification config endpointを再確認。
5. 登録E2Eを確認。

`keep_vars` を外す変更は、Dashboard管理variableを消す可能性があるため通常変更として扱わない。

---

## Runbook N — セキュリティインシデント / secret漏えい疑い

1. 漏えいが疑われる資格情報を特定する。
2. 新しいcredentialを発行可能ならRunbook Mの順序でrotationする。公開済みなど緊急度が高い場合は旧credentialを即revokeする。
3. GitHub history / Actions logs / Cloudflare logsへ秘密値が残っていないか確認する。
4. Gitに秘密値をcommitした場合、単なる削除commitだけで「秘密が消えた」と考えず、必ずcredential自体を失効する。
5. 影響範囲を確認する。
6. 原因修正PRを作る。
7. `docs/SECURITY_OPERATIONS.md` のCI / CSP / dependency手順も確認する。

Webhook URLやメールアドレスなどユーザー情報をincident記録へ転記しない。

---

## ローカル / CIで使う復旧確認コマンド

依存導入:

```bash
npm ci --no-audit --no-fund
```

基本:

```bash
npm run check
npm run build
```

EOLデータ:

```bash
npm run test:eol-audit
npm run test:eol-decisions
npm run check:snapshot-freshness
```

手動情報:

```bash
npm run check:manual-review-freshness
npm run test:official-source-reviews
npm run test:product-content
```

通知 / Worker:

```bash
npm run test:external-notifications
npm run test:external-notification-client
npm run test:email-notifications
npm run test:email-notification-client
npm run test:public-api
npm run test:worker-runtime-routing
```

本番相当回帰:

```bash
npm run test:security-headers
npm run check:performance-budget
npm run test:browser-smoke
npm run validate:seo
```

`test:security-headers`, performance budget, browser smokeはProduction build後の `dist` を前提とするため、CIと同じ順序で実行する。

## 復旧完了チェックリスト

障害復旧後は、影響範囲に応じて最低限以下を確認する。

- [ ] `/` が200で表示できる
- [ ] `/eol/nodejs/` が表示できる
- [ ] `/api/v1/products/nodejs` が正常応答
- [ ] badgeが正常応答
- [ ] Slack / Discord configが想定どおり
- [ ] Email configが想定どおり
- [ ] 対象Workflowが成功
- [ ] snapshot freshnessが正常
- [ ] CIが成功
- [ ] Browser smokeが成功
- [ ] Security header testが成功
- [ ] SEO validationが成功
- [ ] temporaryなdebug route / secret / bypassを残していない

外部資格情報を更新した場合は、config endpointだけでなく対象機能のE2Eを1回行う。

## インシデント記録テンプレート

Issue等へ残す場合も秘密情報は含めない。

```text
発生日時:
検知方法:
障害レベル: S1 / S2 / S3
影響範囲:
直前の正常deployment / commit:
症状:
原因:
実施した復旧:
復旧確認:
再発防止:
```

## 通常運用の確認頻度

### 毎日

- `Sync EOL data` の成功確認。異常時は通知/Actions画面で確認。
- `Check EOL snapshot freshness` が失敗していないこと。
- 通知Cronに継続的なエラーがないことを、障害兆候がある場合に確認。

### 毎週

- `Sync EOL attention ranking`
- `Check manual review freshness`
- Openな自動同期PRの滞留確認

### 毎月

- Dependabot npm / GitHub Actions PR確認
- 期限が近いPAT / API tokenがないか確認
- Cloudflare / Resendの無料枠利用量が想定範囲か確認

資格情報は「期限切れしてから交換」ではなく、期限前にrotationする。
