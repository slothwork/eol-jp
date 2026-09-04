# External notifications

Phase 3の外部通知は、静的Astroサイトを維持しつつCloudflare Worker + Cron + KVで処理する。

## Current scope

Slack / Discord Webhook通知は、MY EOLから登録・同期・解除まで行える。メール通知はCloudflare Email Sendingの任意宛先送信がWorkers Paidと送信ドメイン設定を必要とするため、別段階で追加する。

## Architecture

```text
MY EOL (browser)
  ↓ subscription API
Cloudflare Worker
  ↓
Workers KV
  - webhook URL
  - tracked product/version
  - 30/90/180 thresholds
  - sent delivery keys

Daily Cron (01:15 UTC / 10:15 JST)
  ↓
/my-eol-data.json
  ↓
threshold evaluation
  ↓
Slack / Discord Webhook
```

Webhook URLはフロントへ再返却しない。管理用トークンは作成時に一度だけ返し、そのSHA-256だけをKVへ保存する。ブラウザにはsubscription ID、管理token、最終同期fingerprintだけをlocalStorageへ保存し、Webhook URLは登録完了後に保持しない。

## Cloudflare binding

本番Workers KV namespaceは次のbinding名で固定する。

```text
NOTIFICATION_SUBSCRIPTIONS
```

`wrangler.jsonc`:

```json
{
  "kv_namespaces": [
    {
      "binding": "NOTIFICATION_SUBSCRIPTIONS",
      "id": "ee50aa2917ec4cdeae0f644f3b3bee23"
    }
  ]
}
```

KV namespace IDは公開識別子であり、Webhook URLや管理tokenなどの秘密情報ではない。

## MY EOL UI

- 利用中バージョンが1件以上ある場合にSlack / Discord通知を登録できる。
- 登録時にIncoming Webhook URLへ固定のテストメッセージを送信する。
- テスト成功後にsubscriptionを作成し、Webhook入力欄はクリアする。
- 30 / 90 / 180日前のローカルリマインダー設定を外部通知にも使用する。
- 利用中バージョンやthresholdが変わると「同期が必要」と表示する。
- 「現在のマイEOLと同期」でPUTし、最新状態へ更新する。
- 「通知設定を解除」でsubscriptionを削除する。
- 1 subscriptionあたり最大25製品。

## Safety rules

- WebhookはHTTPSのみ。
- Slackは `hooks.slack.com` / `hooks.slack-gov.com` のIncoming Webhookだけ許可。
- Discordは `discord.com` / `discordapp.com` のWebhook APIだけ許可。
- 登録前にWebhookへテスト送信し、成功した送信先だけ保存する。
- Discordでは `allowed_mentions.parse=[]` としてメンション展開を禁止する。
- 同じ `slug + version + EOL日 + threshold` は1回だけ送信する。
- Webhookが404/410になったsubscriptionは自動でdisabledにする。
- 管理tokenはサーバーへ平文保存せずSHA-256 hashだけ保持する。
- APIレスポンスでWebhook URLを返さない。

## API

- `POST /api/notifications/subscriptions`
- `GET /api/notifications/subscriptions/{id}`
- `PUT /api/notifications/subscriptions/{id}`
- `DELETE /api/notifications/subscriptions/{id}`

GET / PUT / DELETEは作成時に返されたBearer tokenを必要とする。

Cronは `15 1 * * *`（毎日01:15 UTC / 10:15 JST）。

## Email

Cloudflare Email Serviceで任意のユーザー宛に送信する場合はWorkers Paidと送信ドメインのonboardingが必要。メール実装時も同じthreshold評価とdelivery keyを再利用する。
