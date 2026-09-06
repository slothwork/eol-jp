# Browser smoke tests

Phase 6 の回帰防止として、Production build を実ブラウザで最低限操作する smoke test を CI に組み込む。

## 実行方法

```bash
npm run build
npm run test:browser-smoke
```

`test:browser-smoke` は Astro preview を localhost で起動し、Chrome / Chromium を headless で起動して Chrome DevTools Protocol (CDP) 経由で操作する。

Playwright / Puppeteer 等の追加ブラウザ依存は入れず、GitHub Actions の Ubuntu runner に既に存在する Chrome を利用する。これにより lockfile やブラウザバイナリの追加ダウンロードを増やさず、CI 時間と依存関係を抑える。

## 現在の smoke 対象

- `/`
- `/eol/`
- `/upcoming/`
- `/calendar/`
- `/my-eol/`
- `/my-eol/github-import/`
- `/eol/nodejs/` で実際にバージョンを選択して My EOL へ保存
- `/my-eol/` で保存した製品が表示されること
- 製品ページ閲覧後、`/eol/` の「最近見た製品」に反映されること
- GitHub Import で非 GitHub URL を送信し、ブラウザ側バリデーションが動作すること
- 375px 幅でモバイルメニューが開き、`aria-expanded` が更新されること

## 外部サービスを smoke test に含めない理由

GitHub Import の成功系で GitHub REST API を実際に呼ぶ、メール送信、Slack / Discord Webhook、Turnstile 検証などは、この smoke test では実行しない。

これらを CI の必須条件にすると外部サービス障害・レート制限・シークレットの有無で main の品質と無関係に CI が不安定になるため。外部通信ロジックは既存 unit test / client test で検証し、browser smoke は当サイト内の DOM・localStorage・主要操作フローを対象とする。

## 失敗時の確認順

1. `Production build` が成功しているか
2. `Browser smoke tests` の Astro preview log / Chrome log
3. 失敗した URL または操作の data attribute が変更されていないか
4. localStorage schema (`tracked-products`, `view-history`) を破壊していないか
5. JavaScript の初期化タイミングが変わっていないか

テストを単に新しい DOM に合わせるのではなく、ユーザー操作自体が維持されていることを確認してから期待値を変更する。
