# GitHub package / SBOM連携による自動バージョン検出の検討

確認日: 2026-09-05

## 結論

GitHub連携による自動バージョン検出は技術的に実現可能。ただし、**GitHub Packages APIを主軸にはせず、GitHub Dependency GraphのSBOMを入口にし、必要に応じてリポジトリ内のマニフェスト/ランタイム指定ファイルを補完的に読む方式**を採用する。

現時点ではSBOMだけで主要20製品を十分な精度で検出できないため、Phase 4では調査・設計までを完了とし、ユーザー向け実装は後続フェーズで行う。

## GitHub SBOMを採用する理由

GitHubのDependency Graphは、リポジトリの依存関係をSPDX形式のSBOMとして出力できる。SBOMには依存パッケージ名、バージョン、Package URL（purl）などが含まれるため、EOL情報.jp側の製品slugへ保守的に対応付けできる。

公式ドキュメント:

- https://docs.github.com/en/rest/dependency-graph/sboms
- https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/export-dependencies-as-sbom

公開リポジトリについては、GitHubの公式REST API上で認証なしの取得が可能と明記されている。

## 旧同期APIは採用しない

従来の `GET /repos/{owner}/{repo}/dependency-graph/sbom` は2026-11-13に終了予定と案内されている。

実装時は最初から次の非同期フローを利用する。

1. SBOM生成要求
2. GitHubから返されたSBOM URL / UUIDを保持
3. 生成完了まで状態確認
4. SPDX JSONを取得
5. EOL情報.jpで高信頼度の製品だけ抽出

GitHub API versionは実装時点の最新安定版を固定して利用する。

## GitHub Packages APIを主軸にしない理由

GitHub Packages REST APIはGitHub Packagesに公開・保存されているパッケージの管理を目的としており、リポジトリが実際に利用している依存関係の棚卸し用途とは目的が異なる。

また、Packages APIの利用では `read:packages` を含む認証が必要になるケースがあり、公開リポジトリのEOL自動検出という用途に対して認証コストと権限が過大になる。

公式ドキュメント:

- https://docs.github.com/en/rest/packages/packages

## SBOMだけでは検出できないもの

SBOMは「依存パッケージ」の検出には強いが、実行環境そのものは必ずしも含まれない。

SBOMだけで比較的高信頼度に対応しやすい例:

- `pkg:npm/next@...` -> Next.js
- `pkg:pypi/django@...` -> Django
- `pkg:composer/laravel/framework@...` -> Laravel

SBOMだけでは原則として不足する例:

- Node.js / Python / PHP / Java / Go / Ruby のランタイム
- Ubuntu / Windows / Windows Server
- Docker Engine / Kubernetes / nginx
- PostgreSQL / MySQL / Redis / MongoDB のサーバー本体

クライアントライブラリとサーバー製品を誤対応させてはいけない。例えばMySQLクライアントパッケージが存在しても、利用中のMySQL Serverバージョンを確定したとは扱わない。

## 推奨する将来実装

### 1. Public GitHub Repository Import

ユーザーが `https://github.com/{owner}/{repo}` を入力する。

対象はまず公開リポジトリのみとし、GitHubトークン入力は求めない。

### 2. SBOM解析

GitHubの非同期SBOM APIでSPDX JSONを取得し、purlをallowlist方式でEOL製品へ変換する。

自動登録対象は「製品名とパッケージ名が明確に対応するもの」だけとする。

### 3. マニフェスト補完

SBOMで検出できないランタイムは、明示的なバージョン指定が存在する場合のみ補完候補にする。

例:

- `.nvmrc` / `.node-version`
- `.python-version`
- `.ruby-version`
- `go.mod`
- `composer.json` / `composer.lock`
- `Dockerfile`
- `devcontainer.json`
- GitHub Actionsの `setup-node` / `setup-python` 等

曖昧なバージョン範囲や `latest` は自動登録せず、「候補」としてユーザー確認を求める。

### 4. マイEOLへ取り込み

検出結果はサーバー側アカウントに保存せず、既存のマイEOLと同じローカル保存へ取り込む。

初期実装では以下を必須とする。

- 検出元を表示（SBOM / ファイル名）
- 検出バージョンを表示
- EOL情報.jp上の対応製品を表示
- ユーザーが選択してから保存
- 自動で勝手にマイEOLへ追加しない

## private repository対応

初期実装では行わない。

private repositoryを扱うにはGitHub App / OAuth / Fine-grained token等の認証設計が必要になる。EOL情報.jpは現時点でアカウントレス・低コスト運用を優先しているため、GitHub credentialをブラウザlocalStorageやKVへ保存する設計は採用しない。

将来必要になった場合は次の順で再検討する。

1. ユーザーがローカルでSBOM JSONをアップロードして解析
2. GitHub Appでread-only権限を明示的に取得
3. OAuth連携

## コスト方針

公開リポジトリのSBOM取得とブラウザ側解析を中心にすれば、追加の常設DBは不要。

Cloudflare Workerを利用する場合も、入力検証・GitHub API中継・短時間キャッシュ程度に限定し、既存の低コスト運用方針を維持する。

## 実装判断

- GitHub Packages API単独: 採用しない
- GitHub SBOM単独: 一部製品には有効だがカバレッジ不足
- GitHub SBOM + manifest/runtime detection: 採用候補
- private repository認証: 初期対象外
- 自動保存: 採用しない。ユーザー確認後にマイEOLへ保存

次の実装優先度は、サイト全体のモバイルUX改善と閲覧履歴を先に行い、その後にPublic GitHub Repository Import MVPを実装する。
