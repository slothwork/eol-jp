# Maintenance baseline

最終整理: 2026-09-10

この文書はPhase 6で整備した保守基盤の「現在の運用チェックリスト」とする。優先順位は `ROADMAP.md`、チャット間の現在地は `docs/PROJECT_HANDOFF.md` を参照する。

## Phase 6 baseline — completed

- [x] EOL snapshot鮮度監視（72時間でwarning、168時間でfail、サイト側stale表示）
- [x] 手動確認情報の再レビュー期限検出（180日でwarning、365日でfail）
- [x] Production buildに対する実Chrome browser smoke test
- [x] HTTPセキュリティヘッダー監査とCI検証
- [x] Dependabotによる依存更新運用
- [x] 障害・資格情報更新Runbook
- [x] performance baseline / budget
- [x] 大型モジュールの責務分割
- [x] sitemapとindexable canonical HTMLの整合性検証

## Ongoing automated maintenance

通常は新機能として再実装せず、既存の自動化が正常に動いているかを監視する。

- 日次EOL snapshot同期
- snapshot freshness check
- 手動レビュー情報のfreshness check
- EOL注目度データ更新
- unit / static tests
- Astro check / Production build
- sitemap validation / SEO validation
- security header tests
- performance budget check
- release pagination / dense table / general browser smoke
- Dependabot PR

## Human review triggers

次の場合だけ人手で優先対応する。

1. 日次同期・CI・定期freshness checkがfailした
2. snapshotがwarning / fail閾値へ近づいた
3. 手動レビュー情報が再確認期限へ達した
4. Dependabot更新で互換性エラーが出た
5. performance budgetを超過した
6. browser smokeや本番確認で回帰が見つかった
7. Search Consoleでクロール・インデックス・canonical・sitemapの異常が確認された
8. ユーザーから具体的な不具合・UX問題が報告された

障害時の切り分け・復旧は `docs/RUNBOOK.md` を正とする。

## Growth gate

Search Consoleの実データが揃うまでは、title / description、内部リンク、indexableページ生成範囲を推測で広げない。検索成長施策の開始条件と手順は `ROADMAP.md` の `Waiting / Growth gate` と `Next — Phase 7` を参照する。

## Document maintenance

このファイルに新しい未完了機能バックログを追加しない。保守基盤そのものを変更する場合だけ更新する。将来機能・優先順位は `ROADMAP.md`、チャット間の作業状態は `docs/PROJECT_HANDOFF.md` へ記録する。
