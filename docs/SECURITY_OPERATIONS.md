# Security operations

最終更新: 2026-09-06

## 目的

EOL情報.jp の静的配信・Worker API・依存関係更新を、追加の有料サービスなしで継続的に保守するための運用方針です。

## HTTPセキュリティヘッダー

### 配信経路

本番は Cloudflare Workers + Static Assets です。

- 静的HTML / CSS / JS / 画像など: `public/_headers` を Astro build が `dist/_headers` へコピーし、Cloudflare Static Assets が適用する。
- `/api/notifications/*`, `/api/v1/*`, `/badge/*`: `assets.run_worker_first` の対象なので `_headers` は適用されない。`worker/security-headers.ts` でWorker生成レスポンスへ付与する。

この2経路は別々に保護する必要があります。静的側だけ、またはWorker側だけ変更しないでください。

### 静的ページの方針

`public/_headers` の `/*` ルールで次を適用します。

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `X-Permitted-Cross-Domain-Policies: none`

CSPは原則same-originとし、現在必要な外部接続だけを明示的に許可します。

- `https://challenges.cloudflare.com`: Cloudflare Turnstile のscript / frame / challenge通信
- `https://api.github.com`: Public GitHub Repository Import のブラウザ直接通信

`unsafe-eval`、wildcard source、平文 `http:` は許可しません。

Astroの現行ビルド・構造化データ・既存インライン処理との互換性を優先して、`script-src` / `style-src` では現時点で `unsafe-inline` を残します。静的ビルドにhash CSPを導入するとビルドごとのhash管理が必要になるため、運用コストとのバランスを見て将来再評価します。

### Workerレスポンスの方針

Worker生成レスポンスには共通して次を付けます。

- HSTS
- nosniff
- frame拒否
- referrer policy
- permissions policy
- cross-domain policy拒否
- `default-src 'none'` を基本とするCSP

badgeなどルート固有でより厳しいCSPがすでにある場合は上書きしません。公開APIのCORS (`Access-Control-Allow-Origin: *`) も既存仕様を維持します。

## CI検証

Production build後に `npm run test:security-headers` を実行します。

このテストは以下を確認します。

1. `public/_headers` が `dist/_headers` へそのままコピーされている。
2. 必須セキュリティヘッダーが欠落していない。
3. CSPにTurnstile / GitHub APIの必要最小限の許可がある。
4. `unsafe-eval` / wildcard / `http:` を許可していない。
5. Worker共通ヘッダーが付与される。
6. ルート固有のより厳しいCSPをWorker共通処理が上書きしない。

本番デプロイ後にヘッダーを変更した場合は、ブラウザDevToolsまたは `curl -I https://eol.slothwright.com/` でも実レスポンスを確認してください。

## 依存パッケージ更新

`.github/dependabot.yml` で追加費用なしのDependabot version updatesを使用します。

### npm

- 月1回、09:00 Asia/Tokyo
- minor / patch は1つのPRへグループ化
- major updateは別PRとして扱い、変更点を個別確認
- 同時オープンPRは最大3件

### GitHub Actions

- 月1回、09:30 Asia/Tokyo
- Actions更新をグループ化
- 同時オープンPRは最大2件
- workflow内のActionsはSHA pinを維持する

## Dependabot PRの確認手順

自動マージは行いません。更新PRでは最低限次を確認します。

1. 変更対象とmajor/minor/patchを確認する。
2. major updateは公式migration guide / changelogの破壊的変更を確認する。
3. `package-lock.json` が意図した依存だけを更新していることを確認する。
4. CIの全項目、とくにAstro check / Production build / Browser smoke / Security header tests / SEO validationが成功していることを確認する。
5. GitHub Actions更新ではSHA pinが維持されていることを確認する。
6. 問題なければ通常PRと同じ手順でmergeする。

Dependabot security updates / alerts はGitHubリポジトリ側のSecurity設定にも依存します。重大なsecurity updateが発生した場合は月次version updateを待たず、優先して確認・適用します。

## CSP変更時の注意

新しい外部サービスを追加するときは、まずsame-originで実現できないかを検討します。外部originが必要な場合も `default-src` を広げず、`script-src` / `connect-src` / `frame-src` など必要なdirectiveだけへ正確なoriginを追加してください。

CSP違反を解消するために `*` や `unsafe-eval` を追加する変更は禁止します。TurnstileやGitHub Importが動かなくなった場合は、実際にブロックされたoriginとdirectiveを確認してから最小限の修正を行います。
