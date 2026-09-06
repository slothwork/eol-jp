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

## 2026-09-06 baseline

CI #129 のProduction buildを初期基準とした。値はgzip相当。

| 対象 | 実測 | 予算 |
| --- | ---: | ---: |
| 全JS合計 | 19.2 KiB | 32 KiB |
| 全CSS合計 | 3.8 KiB | 8 KiB |
| 最大JSチャンク | 6.0 KiB | 10 KiB |
| `/` 初期転送量 | 9.2 KiB | 16 KiB |
| `/eol/` 初期転送量 | 29.1 KiB | 48 KiB |
| `/eol/nodejs/` 初期転送量 | 13.7 KiB | 20 KiB |
| `/my-eol/` 初期転送量 | 19.9 KiB | 32 KiB |
| `/my-eol/github-import/` 初期転送量 | 15.1 KiB | 24 KiB |

ページ単位では初期転送量に加え、JSとCSSにも個別上限を設定する。製品一覧 `/eol/` は上流データの製品数増加でHTMLが自然に増えるため、他ページより広い余裕を持たせる。

## 予算変更ルール

予算値はルートの `performance-budget.json` に保存する。

通常の小変更で毎回予算を書き換えない。予算を引き上げる場合は、単にCIを通す目的で変更せず、増加したアセットと必要性を確認し、理由をPR本文に記載する。

逆にリファクタリングや削減で継続的にサイズが下がった場合は、余裕幅を確認したうえで予算を引き下げる。

## CI failure時

1. `Performance budget report` の対象ページ / global指標を確認する。
2. 新しく追加されたJS/CSSが初期表示に本当に必要か確認する。
3. 必要なら遅延ロード、責務分割、静的HTMLへの移動を検討する。
4. 仕様上サイズ増加が避けられない場合のみ、実測値と理由を確認して予算を更新する。

## Lighthouseについて

Core Web Vitalsや実ネットワークの体感速度はSearch Console / Chrome UX Report等の実データが得られた時点で補完する。PRごとの必須CIでは、環境差によるflaky failureを避けるため、再現性の高いbuild artifact budgetをマージゲートとする。
