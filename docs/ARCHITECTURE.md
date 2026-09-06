# Architecture

## Current decision

公開コンテンツは Astro の静的HTMLを基本とし、EOLデータはコミット済みsnapshotから生成する。アクセスごとのライフサイクルAPI呼び出しや恒久DBは使わない。

動的処理が必要な機能だけ Cloudflare Workers へ限定し、ユーザー固有の軽量機能は可能な限りブラウザlocalStorageで完結させる。

## Runtime layout

```text
Browser
  ├─ Static HTML / JS / CSS      <- Cloudflare Workers + Static Assets
  ├─ My EOL / view history      <- localStorage
  ├─ Public GitHub import       <- browser -> GitHub REST API directly
  └─ notification settings      <- Worker API

Cloudflare Worker
  ├─ Static Assets fallback
  ├─ Slack / Discord notification API
  ├─ Email notification API
  ├─ Public JSON API / badge
  └─ scheduled notification delivery

Workers KV
  └─ notification subscriptions / email runtime state only
```

アカウント、ユーザープロファイル、閲覧履歴、マイEOLの保存先としてKVやDBを利用しない。

## Module boundaries

ブラウザUIとWorkerでは、表示・純粋ロジック・外部I/Oを同じ巨大ファイルへ戻さない。

```text
src/components/
  EmailNotificationSettings.astro       <- markup / component-local style
  ExternalNotificationSettings.astro    <- markup

src/client/
  turnstile.ts                          <- Turnstile script loader
  email-notification-settings.ts        <- email notification DOM / Worker API orchestration
  external-notification-settings.ts     <- Slack/Discord DOM / Worker API orchestration
  github-import.ts                      <- GitHub import page DOM / localStorage orchestration

src/lib/
  github-import.ts                      <- compatibility/public export barrel
  github-import-types.ts                <- data contracts / limits
  github-import-detection.ts            <- URL / manifest / SBOM pure detection
  github-import-resolution.ts           <- detected version -> EOL series resolution
  github-import-client.ts               <- GitHub REST / async SBOM I/O

worker/
  index.ts                              <- fetch/scheduled routing only
  runtime-types.ts                      <- Worker env / KV shared types
  catalog-runtime.ts                    <- committed catalog asset loading
  external-notification-runtime.ts      <- Slack/Discord API + scheduled delivery
  email-runtime.ts                      <- email API + scheduled delivery
  public-api-runtime.ts                 <- JSON API / badge HTTP handling
  notification-core.ts                  <- notification pure domain logic
  public-api.ts                         <- public API / badge pure transformation
```

Astroコンポーネントやページ内へ大きなDOM/API処理を再び埋め込まず、ブラウザ実行コードは `src/client/` に置く。GitHub importの外向きimport pathは互換性のため `@/lib/github-import` を維持し、内部責務だけを分割する。

Workerの `index.ts` には個別APIの入力検証・KV操作・通知送信を実装せず、各runtimeへ委譲する。`email-runtime.ts` は現時点でメールという単一ドメインに閉じているため、ファイルサイズだけを理由に追加分割しない。変更頻度や責務がさらに増えた時点で検討する。

## EOL data pipeline

1. GitHub Actions scheduleが `scripts/sync-eol.mjs` を実行。
2. `https://endoflife.date/api/v1/products/full` を取得。
3. UIで使う安定した内部schemaへ正規化。
4. 前回snapshotと比較し、変更履歴と監査ログを更新。
5. 差分があれば `chore/eol-data-sync` ブランチへcommitしPRを作成/更新。
6. CI通過後にmainへmerge。
7. Cloudflareがmainの変更をbuildし、Worker + Static Assetsとして配信。

本番buildではendoflife.dateへアクセスせず、コミット済みsnapshotだけを利用する。

## Why committed snapshots

- API障害がサイト閲覧へ波及しない。
- API仕様変更をsync jobで検知できる。
- いつどのEOL日が変わったかGit履歴・change log・audit logで追跡できる。
- CIで差分を確認してから本番へ反映できる。
- 静的配信を中心にして運用コストを抑えられる。

## Internal normalized schema

```text
Snapshot
  schemaVersion
  generatedAt
  sourceUrl
  products[]
    slug
    label
    category
    versionCommand
    links
    releases[]
      name
      releaseDate
      isLts
      eoasFrom
      eolFrom
      isEol
      isMaintained
      latest{name,date,link}
```

新しいendoflife.dateフィールドは、この内部schemaへ明示的に追加してからUIで利用する。

## Client-local utilities

### My EOL / reminders

利用中製品・バージョン、リマインダー設定、確認済み状態はブラウザlocalStorageへ保存する。ログインや端末間同期は行わない。

### View history

製品詳細の閲覧履歴だけをlocalStorageへ最大20件保存する。サーバーへ送信しない。

### Public GitHub Repository Import

公開GitHubリポジトリのみを対象とし、ブラウザからGitHub REST APIへ直接アクセスする。SBOMと明示的なruntime/manifest指定を解析し、高信頼度候補だけをユーザー確認後にマイEOLへ保存する。

GitHub token、private repository認証、解析対象ファイルをWorker/KVへ保存する設計は採用しない。

## Worker responsibilities

Workerは以下に限定する。

- 静的アセット配信へのfallback
- Slack / Discord通知設定API
- メール通知APIと確認/解除フロー
- scheduled通知処理
- 公開JSON API
- embeddable badge

通知データにはTurnstile、same-origin確認、入力上限、レート制限などの防御を適用する。

## Failure policy

- EOL同期でAPI取得またはschema validationが失敗した場合は既存snapshotを上書きしない。
- 同期が失敗しても本番サイトは直前の正常snapshotで継続する。
- localStorageやGitHub APIが利用できない場合も、EOL情報の基本閲覧は継続できること。
- 通知・公開API等の動的機能の障害が、静的EOLページ配信へ波及しないようにする。

## Cost policy

- 常設DBを前提にしない。
- 公開ページは静的配信を維持する。
- ブラウザ内で安全に完結できる処理はクライアント側で行う。
- Worker/KVは通知などサーバー側処理が必須の用途だけに使う。
- 新しい外部サービスを追加する場合は、無料枠・障害時挙動・データ保存範囲を先に評価する。
