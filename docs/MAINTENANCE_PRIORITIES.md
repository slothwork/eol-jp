# Phase 6 maintenance priorities

この文書は、Phase 6の実装順を判断するための簡易チェックリストです。詳細な棚卸しは `docs/ROADMAP_REVIEW_2026-09.md` を参照してください。

## P0 — trust / detection

1. [x] EOL snapshot鮮度監視（72時間でwarning、168時間でfail、サイト側stale表示）
2. [x] 手動確認情報の再レビュー期限検出（180日でwarning、365日でfail。公式ソース・比較照合・商用サポート・リリース変更点を対象）
3. [x] 主要ユーザーフローのbrowser smoke test（Production buildを実Chromeで操作。主要URL、My EOL、閲覧履歴、GitHub Import入力検証、モバイルナビ）

## P1 — security / operations

4. [ ] HTTPセキュリティヘッダー監査
5. [ ] dependency update automation
6. [ ] 障害・トークン更新Runbook

## P2 — maintainability / performance

7. [ ] performance baseline / budget
8. [ ] 大型ファイルの責務分割

## Growth gate

Search Consoleの実データが揃うまでは、title / descriptionやページ生成範囲を推測で広げない。成長施策はPhase 6の安定化後、実検索・閲覧データを根拠にPhase 7で進める。
