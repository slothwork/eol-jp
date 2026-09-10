# AGENTS.md

## Project goal

日本の開発者・インフラ担当・情シス向けに、ソフトウェアのEOLとサポート期限を「判断しやすい日本語」で提示する。

## Session start / handoff

新しいチャットや作業セッションでは、過去チャットの記憶を前提にせず、次の順で現在地を復元する。

1. GitHubで最新 `main` と open PR を確認する。コミットSHAを過去チャットから使い回さない。
2. この `AGENTS.md` を読む。
3. `docs/PROJECT_HANDOFF.md` で現在の待ち状態・直近の重要判断・作業上の合意を確認する。
4. `ROADMAP.md` で現在の優先順位と着手条件を確認する。
5. アーキテクチャ変更なら `docs/ARCHITECTURE.md`、本番運用・障害対応なら `docs/RUNBOOK.md` を追加で確認する。

チャットが切り替わっても復元できるよう、状態や方針が変わるPRでは必要に応じて `docs/PROJECT_HANDOFF.md` と `ROADMAP.md` も同じPRで更新する。日次データ同期のSHAなど、すぐ古くなる情報は引き継ぎ文書へ固定しない。

## Repository change workflow

- `main` は本番ブランチ。変更前に必ず最新 `main` と直前の関連PRがマージ済みか確認する。
- 通常の変更は作業ブランチを作成し、GitHub上で変更、PR作成、diff確認、CI完走確認まで行う。
- このプロジェクトのChatGPT作業では Codex を使わず、GitHub integrationを直接利用する。
- PR説明とプロジェクト文書は原則日本語で書く。コードコメントは必要な箇所だけ簡潔な日本語にする。
- CIが成功し、`main` からbehindしておらず、mergeableであることを確認してマージ可否を報告する。
- ユーザーから明示的な指示がない限りPRをマージしない。
- 運用費をほぼ0円に保つ。新しいWorker / KV / DB / 外部API・有料サービス依存は、明確な必要性と再設計判断なしに追加しない。

## Non-negotiable architecture

1. Astro + TypeScript の静的サイトを基本とする。公開コンテンツをSSRやDBへ安易に移行しない。
2. Cloudflare Workers + Static Assets を配信基盤とし、Workerは通知API・公開API・badge・scheduled処理など必要な動的機能だけを担当する。
3. ライフサイクルデータの主ソースは endoflife.date API v1 とする。HTMLスクレイピングは禁止。
4. 本番build時にendoflife.date APIを必須依存させない。コミット済み `src/data/eol-snapshot.json` からbuildする。
5. API取得・正規化は `scripts/sync-eol.mjs` に集約し、API仕様変更はここで吸収する。
6. endoflife.dateの製品説明文を機械翻訳して転載しない。日本語説明は `src/data/product-meta.ts` 等で独自作成する。
7. 元データ、公式サポート方針、免責事項への導線を削除しない。
8. アカウント・恒久DB・private GitHub認証など、運用コストや個人情報管理を増やす設計は明確な再設計判断なしに導入しない。

## Privacy / local state

- マイEOL、閲覧履歴、GitHub importの保存結果は原則ブラウザlocalStorageへ保持する。
- GitHub importは公開リポジトリを対象とし、GitHub tokenを入力・保存させない。
- ブラウザ内で完結できる処理をWorker/KVへ不要に送信しない。
- 通知機能で必要な外部送信先・メール情報は、機能提供に必要な最小範囲だけ保存する。

## UX rules

- ISO日付だけで終わらせず「EOLまであとN日」を併記する。
- 0–30日: critical、31–90日: warning、91–180日: planning、181日以上: supported。
- EOL済みを明確に区別する。
- 「アップグレード推奨」は断定せず、公式移行ガイド・互換性確認を促す。
- モバイルで期限が読みやすいことを優先する。
- localStorage、GitHub API、通知APIなど外部依存が失敗しても、基本的なEOL情報の閲覧を妨げない。
- 比較・一覧が主目的の画面は高密度テーブルを基本とし、探索・説明・確認操作が主目的の箇所はカードを使い分ける。
- 外部 `http` / `https` リンクは別タブ、内部リンクは同一タブを基本とする。

## SEO rules

- 製品ページのcanonicalは `/eol/{slug}/`。
- タイトルの基本形は `{製品名}のEOL・サポート終了日 | EOL情報.jp`。
- 主要検索意図: `{product} EOL`, `{product} サポート期限`, `{product} {version} EOL`。
- sitemap、RSS、iCalendarを壊さない。
- indexableなcanonical HTMLとsitemapの整合性を維持する。
- 薄い自動生成記事を大量作成しない。製品ページに独自価値を追加する。
- title / description の個別最適化、内部リンク拡張、バージョン専用URLは、Search Console等の実需要を根拠に行う。
- Search Consoleの反映・実データ待ちの間は、インデックス登録を狙った推測変更を繰り返さない。

## Data integrity / trust

- 日付は `YYYY-MM-DD` を正規形とする。
- 不明な日付を推測しない。nullは「未定」と表示する。
- EOL期限の変更を `change-log.json` に記録する。
- 同期差分の監査情報を `audit-log.json` に残す。
- API schema versionをsnapshotに保存する。
- 新しいAPIフィールドをUIへ直接漏らさず、正規化層を通す。
- 公式ソース照合、商用サポート、リリース変更点など手動確認データには確認日を残し、将来の再確認対象にできるようにする。

## Testing before merge

- `npm run check`
- `npm run build`
- 関連する `npm run test:*` を実行する。
- `/`, `/eol/`, `/upcoming/`, `/calendar/`, 主要製品ページが生成されること。
- sitemap.xml / feed.xml / calendar.ics が生成されること。
- EOL日境界（昨日/今日/30/90/180日）を確認すること。
- UIの重要フローを変更した場合は、localStorage無効・外部API失敗時のフォールバックも確認する。
- 既存CIのperformance budget、browser smoke、SEO validationを安易に緩和しない。

## Current priorities

優先順位の正本は `ROADMAP.md`、チャット間の現在地は `docs/PROJECT_HANDOFF.md` とする。Phase 0〜6は完了済み。現在はSearch Consoleのインデックス反映・検索実データを待つゲート期間で、データがない段階のSEO推測最適化より、運用維持、バグ修正、ユーザーから明示された小規模UX改善を優先する。本番障害・資格情報更新時は `docs/RUNBOOK.md` を参照する。
