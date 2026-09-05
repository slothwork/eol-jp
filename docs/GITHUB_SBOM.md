# GitHub package / SBOM連携による自動バージョン検出

最終更新: 2026-09-05

## 現在の結論

Public GitHub Repository Import MVPを実装した。

GitHub Packages APIは主軸にせず、**GitHub Dependency Graphの非同期SBOM + リポジトリ直下のmanifest/runtime指定ファイル**を組み合わせる。

MVPでは公開リポジトリのみを対象とし、GitHubトークンやログインを要求しない。解析はブラウザからGitHub REST APIへ直接アクセスして行い、GitHub URL、SBOM、manifest内容、解析結果をEOL情報.jpのWorker・KVへ送信しない。

実装ページ:

- `/my-eol/github-import/`

## GitHub SBOM

GitHub Dependency Graphは、リポジトリの依存関係をSPDX形式のSBOMとして出力できる。

公式ドキュメント:

- https://docs.github.com/en/rest/dependency-graph/sboms
- https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom

従来の同期API `GET /repos/{owner}/{repo}/dependency-graph/sbom` は2026-11-13に終了予定のため、MVPでは使用しない。

採用するフロー:

1. `GET /repos/{owner}/{repo}/dependency-graph/sbom/generate-report`
2. 返却されたSBOM UUIDを取得
3. `GET /repos/{owner}/{repo}/dependency-graph/sbom/fetch-report/{uuid}` を状態確認
4. 生成完了後のSPDX JSONをブラウザ内で解析
5. allowlistに一致する高信頼度候補だけをEOL製品へ対応付け

ブラウザからの直接アクセスではGitHub REST APIのCORSを利用する。未認証の公開データ利用はGitHub側のIP単位レート制限に従う。

## SBOMで自動対応する製品

MVPでは、クライアントライブラリとサーバー本体を誤認しないよう、package URL（purl）が製品そのものと明確に対応するものだけを採用する。

現在のallowlist:

- `pkg:npm/next@...` → Next.js
- `pkg:pypi/django@...` → Django
- `pkg:composer/laravel/framework@...` → Laravel

MySQLクライアント、PostgreSQLドライバ、Redisクライアント等がSBOMに存在しても、サーバー製品のバージョン検出とは扱わない。

## manifest/runtime補完

SBOMだけではランタイムやサーバー製品を十分に検出できないため、リポジトリ直下の次のファイルを補完的に確認する。

- `.nvmrc`
- `.node-version`
- `.python-version`
- `.ruby-version`
- `.java-version`
- `.tool-versions`
- `go.mod`
- `global.json`
- `package.json`
- `composer.json`
- `Gemfile`
- `runtime.txt`
- `Dockerfile`

### 検出ポリシー

具体的なバージョンだけを候補にする。

採用例:

- `22.18.0`
- `3.13.7`
- `go 1.25.1`
- `FROM node:22.18.0-alpine`
- `FROM postgres:17-alpine`

除外例:

- `latest`
- `stable`
- `lts`
- `>=22`
- `^8.2`
- 環境変数のみの `FROM node:${NODE_VERSION}`

Dockerfileでは、Node.js / Python / PHP / Ruby / Go / Java / Ubuntu / PostgreSQL / MySQL / Redis / MongoDB / nginx / .NET / Kubernetes / Windows Serverについて、具体的な公式・一般的イメージ名と数値タグが確認できる場合のみ候補化する。

## EOL系列との対応付け

検出された完全バージョンをそのままマイEOLへ保存しない。

`my-eol-data.json` の現在のリリース系列と比較し、最長一致する系列へ正規化する。

例:

- Node.js `22.18.0` → `22`
- Python `3.13.7` → `3.13`
- Next.js `16.1.2` → `16`

現在のEOLデータに一致する系列がない場合は「系列を対応付けできなかった検出」として表示し、保存対象外にする。

同じ製品について複数の異なる系列が検出された場合も競合として表示し、自動保存しない。

## マイEOLへの保存

解析結果は自動保存しない。

ユーザー画面で以下を表示する。

- 対応製品
- 保存されるEOL系列
- 実際に検出したバージョン
- 検出元（SBOM / ファイル名）
- 既存のマイEOL保存内容

ユーザーがチェックされた候補を確認し、「選択した候補をマイEOLへ保存」を押した場合だけ既存の `eol-jp:tracked-products:v1` localStorageへ保存する。

## プライバシー / コスト

MVPはブラウザからGitHubへ直接アクセスする。

そのため次をEOL情報.jp側には保存しない。

- GitHubリポジトリURL
- SBOM
- manifest/runtimeファイル内容
- 解析結果
- GitHub credential

Cloudflare WorkerのAPI中継、追加KV、常設DBは不要で、追加固定費0円の運用方針を維持する。

## private repository

MVPでは対応しない。

private repositoryにはGitHub App / OAuth / fine-grained token等の認証設計が必要になる。アカウントレス・低コスト・credential非保存を優先するため、ブラウザlocalStorageやCloudflare KVへGitHub tokenを保存する設計は採用しない。

将来必要になった場合は次の順で再検討する。

1. ユーザーがローカルSBOM JSONをアップロードしてブラウザ内解析
2. GitHub Appでread-only権限を明示的に取得
3. OAuth連携

## テスト

`src/lib/github-import.ts` の純粋処理についてCIで次を検証する。

- GitHub URLの正規化 / 不正URL拒否
- runtime manifest検出
- Dockerfileの具体バージョン検出
- SBOM purl allowlist
- 完全バージョンからEOL系列への正規化
- 同一系列の複数証跡統合
- 異なる系列の競合検出
- 現在のEOLデータにない系列の保存除外
