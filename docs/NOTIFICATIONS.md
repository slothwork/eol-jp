# External notifications

Phase 3の外部通知は、静的Astroサイトを維持しつつCloudflare Worker + Cron + KVで処理する。

## Current scope

この段階ではSlack / Discord Webhookのサーバー側通知基盤までを実装する。メール通知はCloudflare Email Sendingの任意宛先送信がWorkers Paidと送信ドメイン設定を必要とするため、別段階で追加する。

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

Daily Cron (01:15 UTC)
  ↓
/my-eol-data.json
  ↓
threshold evaluation
  ↓
Slack / Discord Webhook
```

Webhook URLはフロントへ再返却しない。管理用トークンは作成時に一度だけ返し、そのSHA-256だけをKVへ保存する。

## Safety rules

- WebhookはHTTPSのみ。
- Slackは `hooks.slack.com` / `hooks.slack-gov.com` のIncoming Webhookだけ許可。
- Discordは `discord.com` / `discordapp.com` のWebhook APIだけ許可。
- 1 subscriptionあたり最大25製品。
- 登録前にWebhookへテスト送信し、成功した送信先だけ保存する。
- Discordでは `allowed_mentions.parse=[]` としてメンション展開を禁止する。
- 同じ `slug + version + EOL日 + threshold` は1回だけ送信する。
- Webhookが404/410になったsubscriptionは自動でdisabledにする。

## API

KV bindingが設定されるまではAPIは `503 notification_storage_unconfigured` を返す。

- `POST /api/notifications/subscriptions`
- `GET /api/notifications/subscriptions/{id}`
- `PUT /api/notifications/subscriptions/{id}`
- `DELETE /api/notifications/subscriptions/{id}`

GET / PUT / DELETEは作成時に返されたBearer tokenを必要とする。

## Cloudflare setup required before enabling UI

Workers KV namespaceを1つ作成し、binding名を次に固定する。

```text
NOTIFICATION_SUBSCRIPTIONS
```

namespace IDを `wrangler.jsonc` の `kv_namespaces` に追加した後、MY EOLから通知設定UIを有効化する。

Cronは `15 1 * * *`（毎日01:15 UTC / 10:15 JST）。

## Email

Cloudflare Email Serviceで任意のユーザー宛に送信する場合はWorkers Paidと送信ドメインのonboardingが必要。メール実装時も同じthreshold評価とdelivery keyを再利用する。
