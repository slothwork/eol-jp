# Roadmap review — 2026-09

確認日: 2026-09-06

## Summary

Phase 0〜5で、静的EOLサイト、通知、マイEOL、信頼性情報、レスポンシブ改善、閲覧履歴、Public GitHub Repository Importまで主要機能が揃った。

次の段階では、機能数を増やすよりも「データが古くならないこと」「壊れても気づけること」「実ブラウザで主要フローが動くこと」「手動確認情報を再確認できること」を優先する。

Search Consoleは処理中のため、検索実データが揃う前にtitle / descriptionを推測で変更しない。

## Findings

### 1. Documentation drift

`AGENTS.md` と `docs/ARCHITECTURE.md` に、通知やWorker導入前の前提が残っていた。特にCloudflare Pages前提、mainへの直接同期、通知をFuture featureとして扱う記述が現行実装と一致していなかった。

対応: 今回のROADMAP整理と同時に現行構成へ同期する。

### 2. Data freshness is the next trust risk

日次同期は失敗時に既存snapshotを保持するため可用性は高い。一方、複数日同期が止まってもサイトは通常表示できるため、古いsnapshotを静かに配信し続ける可能性がある。

推奨: snapshotの `generatedAt` を使った鮮度監視を追加し、閾値超過をCI/運用で検知する。

### 3. Reviewed content can become stale

公式ソース照合、商用サポート情報、リリース変更点には確認日があるが、再確認期限の自動判定はない。

推奨: 種別ごとに再確認目安を決め、期限を超えた項目をCIで一覧化する。情報を自動推測して更新するのではなく、人手レビュー対象を自動抽出する。

### 4. Tests are strong at unit/static level, but browser flows are not covered

現在のCIは多数の純粋関数テスト、Astro check、production build、SEO validationを持つ。一方、localStorageを使うマイEOL/閲覧履歴、ブラウザからGitHub APIへ接続するimport、モバイルメニュー等は実ブラウザの最低限の回帰テストがあると安全性が上がる。

推奨: Playwright等で少数のsmoke testだけを追加し、CI時間を増やしすぎない。

### 5. Several files are becoming maintenance hotspots

現時点で比較的大きいファイルが存在する。

- `src/lib/github-import.ts` 約21KB
- `src/components/EmailNotificationSettings.astro` 約19KB
- `src/components/ExternalNotificationSettings.astro` 約18KB
- `src/pages/my-eol.astro` 約16KB
- `worker/email-runtime.ts` 約20KB
- `worker/index.ts` 約17KB

すぐに分割する必要はないが、機能追加を続ける前に責務単位で段階分割できる状態へしておくと、変更リスクを抑えやすい。

### 6. Security/maintenance should move from one-time hardening to routine maintenance

通知登録のTurnstile、same-origin、レート制限、GitHub Actions SHA pinなどは実装済み。一方、依存パッケージ更新やHTTPレスポンスヘッダーは定期点検項目として扱う方がよい。

推奨: Dependabot等の低コスト更新運用と、Worker/Static Assetsのセキュリティヘッダー監査をPhase 6へ入れる。

### 7. Search growth should wait for evidence

製品ページにはFAQ、公式ソース、移行資料、変更点など独自価値が増えている。ここから薄いページやバージョンURLを増やすより、Search Consoleの実クエリと閲覧実績で改善対象を選ぶ方が安全。

推奨: Search Console処理完了後にCTR/順位改善を少数ページずつ実施し、関連製品リンクや追加コンテンツも実需要に基づいて追加する。

### 8. Local-only architecture needs a backup path eventually

マイEOLをlocalStorageに限定したことで、低コスト・プライバシー面の利点がある。一方、ブラウザデータ消去や端末移行では設定を失う。

推奨: ログインやDBを追加する前に、JSON export / importによるローカルバックアップを検討する。

## Priority recommendation

1. snapshot鮮度監視
2. 手動レビュー情報の再確認期限
3. browser smoke tests
4. セキュリティヘッダー / dependency maintenance
5. performance baseline
6. 大型モジュールの段階分割
7. Search Console実データに基づくSEO改善
8. 利用実績に基づく追加機能

この順序なら、現在の低コスト・静的中心の設計を維持しながら、サイトの信頼性を上げてから集客・機能拡張へ進められる。
