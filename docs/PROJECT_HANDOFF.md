# Project handoff

最終更新: 2026-09-16

この文書は、旧handoff運用から `project-planning-template` 準拠の文書構成へ移行した後も、既存リンクや過去チャットから迷わず現在地へ到達できるように残す互換導線です。

現在地の正本ではありません。

## 新しい正本

新しいチャットや作業セッションでは、次の順で確認します。

1. GitHubの最新 `main` と open PR / open Issue
2. `README.md`
3. `AGENTS.md`
4. `docs/PROJECT.md` — 目的、対象ユーザー、提供価値、優先順位、制約、非目標
5. `docs/DECISIONS.md` — 長期的に効く重要な判断と理由
6. `docs/CURRENT_STATE.md` — 現在フェーズ、直近の検証、本番判断、次の1〜3件、ブロッカー
7. `ROADMAP.md` — 中期の順序とGrowth gate
8. 必要に応じて `docs/ARCHITECTURE.md` / `docs/RUNBOOK.md` 等の専門文書

日次データ同期で `main` は継続的に進むため、最新commit SHAや一時的なCI run番号は文書へ固定しません。

## 役割を変更した理由

従来のこの文書には、現在地、重要判断、作業ルール、中期計画が混在していました。新しいチャットからの復元には役立った一方、`ROADMAP.md` や `AGENTS.md` と重複し、時間経過でdriftしやすい構造でした。

2026-09-16から、情報を次の役割へ分けます。

- 恒久的な企画方針: `docs/PROJECT.md`
- 後から理由を失うと困る判断: `docs/DECISIONS.md`
- 今だけ必要な現在地: `docs/CURRENT_STATE.md`
- 中期計画: `ROADMAP.md`
- AIの作業ルール: `AGENTS.md`

この文書へ新しいcurrent stateや判断履歴を追記しません。

## 作業途中でチャットが切り替わった場合

一時情報をこの文書へ無理に書き込まず、まずopen Pull Requestを確認し、PR本文・diff・CIから作業途中の状態を復元します。

PRが存在しない状態で現在地が変わっている場合は `docs/CURRENT_STATE.md` を更新します。目的・制約が変わった場合は `docs/PROJECT.md`、重要な判断理由が増えた場合は `docs/DECISIONS.md` へ記録します。
