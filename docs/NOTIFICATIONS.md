# External notifications

Phase 3の外部通知は、静的Astroサイトを維持しつつCloudflare Worker + Cron + KVで処理する。

## Current scope

MY EOLからSlack / Discord Webhook通知とメール通知を登録・同期・解除できる。メール通知は追加固定費0円を優先し、Cloudflare Email SendingではなくResend Free + Cloudflare Turnstileを使用する。Slack / Discordの新規登録にも同じTurnstile widget設定を利用し、自動登録によるKV / Workerリソース消費を抑える。

## Architecture

```text
MY EOL (browser)
  ↓ subscription API
Cloudflare Worker
  ↓
Workers KV
  - webhook URL または確認済みメールアドレス
  - tracked product/version
  - 30/90/180 thresholds
  - sent delivery keys

Daily Cron (01:15 UTC / 10:15 JST)
  ↓
/my-eol-data.json
  ↓
JST threshold evaluation
  ├─ Slack Webhook
  ├─ Discord Webhook
  └─ Resend Email API
```

Webhook URLはフロントへ再返却しない。管理用トークンは作成時に一度だけ返し、そのSHA-256だけをKVへ保存する。ブラウザにはsubscription ID、管理token、最終同期fingerprintだけをlocalStorageへ保存する。

メールアドレスは通知処理のためWorkers KVに保存するが、ブラウザのlocalStorageには保存しない。UI/APIではマスクしたアドレスだけを返す。

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

KV namespace IDは公開識別子であり、Webhook URL、メールアドレス、管理token、API keyなどの秘密情報ではない。

## Slack / Discord

- 利用中バージョンが1件以上ある場合にSlack / Discord通知を登録できる。
- 新規登録時はCloudflare Turnstileを必須にし、WorkerからSiteverify APIで検証する。
- Turnstile actionは `external_notification`、hostnameは現在のWorkerリクエストhostnameと一致させる。
- 新規登録POSTは同一Originのブラウザリクエストのみ許可し、`Origin` が無いリクエストは拒否する。
- `CF-Connecting-IP` をSHA-256したキーで1IPあたり1時間5件の新規登録ソフト上限を設ける。
- サイト全体でも新規登録を100件/日のソフト上限にする。Workers KVはeventually consistentのため厳密な同時実行上限ではない。
- 登録時にIncoming Webhook URLへ固定のテストメッセージを送信する。
- テスト成功後にsubscriptionを作成し、Webhook入力欄はクリアする。
- Webhook URLはSlack / DiscordのHTTPS公式Webhookホストだけを許可し、任意URLへの送信を許可しない。
- 30 / 90 / 180日前のローカルリマインダー設定を外部通知にも使用する。
- 利用中バージョンやthresholdが変わると「同期が必要」を表示する。
- 「現在のマイEOLと同期」でPUTし、最新状態へ更新する。
- 「通知設定を解除」でsubscriptionを削除する。
- 1 subscriptionあたり最大25製品。
- Turnstile設定が利用できない場合は新規登録だけを停止し、既存subscriptionのGET / PUT / DELETEと日次通知は継続する。

## Email

メール通知はResend Freeを利用する。無料プランの外側に勝手に課金する機構は持たず、サイト側でも通常運用の送信数を80通/日に抑える。

登録フロー:

```text
MY EOL
  ↓
メールアドレス入力
  ↓
Cloudflare Turnstile
  ↓ server-side Siteverify
確認コードをResendで送信
  ↓ 6桁 / 15分有効
コード確認
  ↓
email-subscription作成
  ↓
Daily Cronで30/90/180日前を通知
```

安全策:

- Turnstileはクライアント表示だけでなくWorkerからSiteverify APIへ必ず検証する。
- Turnstile actionは `email_notification`、hostnameは現在のWorkerリクエストhostnameと一致させる。
- 確認コードは6桁・15分有効・最大5回まで。
- 確認コード送信は同じメールアドレスへ10分間隔、1日3回まで。
- 確認コード送信と通常通知を合算して80通/日のソフト上限を設ける。
- Resend Free側の100通/日・3,000通/月を超えない前提で運用し、有料プラン/PAYGへ自動移行しない。
- 通知メールには `/email-unsubscribe/` の解除リンクを含める。
- 解除リンクを開いただけでは削除せず、ページ内ボタンからPOSTして解除する。メールクローラによる誤解除を避けるため。
- 同じ `slug + version + EOL日 + threshold` は1回だけ送信する。
- 外部通知の日付判定はJST基準に統一する。

### Required runtime settings

本番でメール通知を有効にするには、Cloudflare Workerのruntimeに次を設定する。

```text
RESEND_API_KEY          secret
EMAIL_FROM              variable
TURNSTILE_SITE_KEY      variable（公開値）
TURNSTILE_SECRET_KEY    secret
```

`TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` はSlack / Discordの新規登録保護にも使用する。Resendの2項目が欠けていても、Turnstile 2項目とKVが設定済みならSlack / Discordの新規登録は利用できる。

`EMAIL_FROM` はResendで検証済みの送信ドメインを使う。例:

```text
EOL情報.jp <notify@verified.example.com>
```

秘密値はGitHubや `wrangler.jsonc` にコミットしない。

Turnstile widget側では本番hostname `eol.slothwright.com` を許可する。

メール通知は4項目のどれかが欠けている場合、`GET /api/notifications/email/config` が `enabled: false` を返して登録UIを無効化する。Slack / Discord新規登録はKV + Turnstile 2項目だけで判定し、`GET /api/notifications/config` から状態を返す。

## API

Slack / Discord:

- `GET /api/notifications/config`
- `POST /api/notifications/subscriptions`
- `GET /api/notifications/subscriptions/{id}`
- `PUT /api/notifications/subscriptions/{id}`
- `DELETE /api/notifications/subscriptions/{id}`

Email:

- `GET /api/notifications/email/config`
- `POST /api/notifications/email/request`
- `POST /api/notifications/email/verify`
- `GET /api/notifications/email/subscriptions/{id}`
- `PUT /api/notifications/email/subscriptions/{id}`
- `DELETE /api/notifications/email/subscriptions/{id}`
- `POST /api/notifications/email/unsubscribe`

GET / PUT / DELETEは作成時に返されたBearer tokenを必要とする。

Cronは `15 1 * * *`（毎日01:15 UTC / 10:15 JST）。
