# Performance budget

EOL情報.jpでは、ネットワークやCIランナーの瞬間的な速度ではなく、Production build成果物のサイズを継続監視する。

## 目的

- 新機能追加でクライアントJavaScriptが無制限に増えることを防ぐ
- 主要ページの初期転送量の悪化をPR時に検出する
- Astro / Viteのチャンク構成変更で巨大なJSファイルが発生した場合に検出する
- 外部の有料監視サービスや追加ブラウザ依存を増やさず、既存CIだけで運用する

## 計測対象

`npm run build` 後に `npm run check:performance-budget` を実行する。

### ビルド全体

- `dist` 配下の全 `.js` のgzip相当合計
- `dist` 配下の全 `.css` のgzip相当合計
- 最大JSチャンクのgzip相当サイズ

### 主要ページ

- `/`
- `/eol/`
- `/eol/nodejs/`（代表的な製品詳細ページ）
- `/my-eol/`
- `/my-eol/github-import/`

各ページについて以下を計測する。

- HTMLのrawサイズ / gzip相当サイズ
- 実行対象のインラインJavaScript + 参照ローカルJavaScriptのgzip相当サイズ
- インラインCSS + 参照ローカルCSSのgzip相当サイズ
- HTML + 参照ローカルJS/CSSの初期転送量相当

`application/ld+json` などの構造化データは実行JavaScriptとしては数えない。ただしHTML自体のサイズには含まれる。

外部URLのスクリプトやCSSはビルド成果物ではないためサイズ予算には含めない。Turnstile等の外部依存はBrowser smoke / 機能テストとCSPで別途管理する。

## 予算

予算値はルートの `performance-budget.json` に保存する。

初回導入時は現在のProduction buildを基準に実測し、通常の小変更で毎回予算を書き換えなくて済む程度の余裕を持たせる。予算を引き上げる場合は、単にCIを通す目的で変更せず、増加理由をPR本文に記載する。

## CI failure時

1. `Performance budget report` の対象ページ / global指標を確認する。
2. 新しく追加されたJS/CSSが初期表示に本当に必要か確認する。
3. 必要なら遅延ロード、責務分割、サーバー生成HTMLへの移動を検討する。
4. 仕様上サイズ増加が避けられない場合のみ、実測値と理由を確認して予算を更新する。

## Lighthouseについて

Core Web Vitalsや実ネットワークの体感速度はSearch Console / Chrome UX Report等の実データが得られた時点で補完する。PRごとの必須CIでは、環境差によるflaky failureを避けるため、再現性の高いbuild artifact budgetをマージゲートとする。
