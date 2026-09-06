# AGENTS.md

## Project goal

日本の開発者・インフラ担当・情シス向けに、ソフトウェアのEOLとサポート期限を「判断しやすい日本語」で提示する。

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

## SEO rules

- 製品ページのcanonicalは `/eol/{slug}/`。
- タイトルの基本形は `{製品名}のEOL・サポート終了日 | EOL情報.jp`。
- 主要検索意図: `{product} EOL`, `{product} サポート期限`, `{product} {version} EOL`。
- sitemap、RSS、iCalendarを壊さない。
- 薄い自動生成記事を大量作成しない。製品ページに独自価値を追加する。
- title / description の個別最適化やバージョン専用URLは、Search Console等の実需要を根拠に行う。

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

## Current priorities

次の優先順位は `ROADMAP.md` を正とする。Phase 0〜6の基盤・機能追加・安定化・運用整備は完了している。Phase 7のSEO・内部リンク・コンテンツ拡張はSearch Consoleや閲覧データの実績を根拠にし、実データがない段階で推測最適化しない。データ待ちの間は、アカウントや恒久DBを増やさずに完結するマイEOLのローカルバックアップ/復元など、既存方針と整合する独立タスクを優先できる。本番障害・資格情報更新時は `docs/RUNBOOK.md` を参照する。
