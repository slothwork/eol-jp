# 現在の状態

最終更新: 2026-11-21

この文書は履歴保管ではなく、プロジェクトの「今」を短時間で把握するために使う。目的・制約は `docs/PROJECT.md`、重要な判断理由は `docs/DECISIONS.md`、中期計画は `ROADMAP.md` を参照する。

## 現在のフェーズ

公開後改善 / Growth gate。

Phase 0〜6の公開・通知・信頼性情報・GitHub Import・運用・テスト基盤は完了済み。現在はSearch Consoleのインデックス反映と検索実データを待ち、Phase 7のデータ駆動改善へ入る条件を確認している。

`ai-design-template` の初回パイロットも完了し、既存UXを大きく変えずにDesign replaceabilityを改善できることを確認した。デザイン改善自体を次の作業目的にはせず、新しい課題・Reference design・利用データ等の根拠が生じた場合に再開する。

## 完了したこと

直近の重要な完了事項:

- 一覧・比較画面を高密度テーブル中心へ整理
- 製品詳細のバージョンサポート表を5列構成へ整理
- `/releases/` とページング・性能対策を公開
- sitemapと全indexable canonical HTMLのCI整合性検証を追加
- Search Consoleへsitemap送信、主要URLのインデックス登録リクエストを実施
- 外部HTTP/HTTPSリンクを別タブで開く共通処理を追加
- PR #90で `PROJECT / DECISIONS / CURRENT_STATE` を導入し、標準開発プロセスを反映
- PR #91で文書専用変更のCI軽量化を導入。通常変更と差分判定失敗時は既存のフルCIを維持
- PR #92で標準化の振り返りを追加し、文書専用の実PRで軽量CI経路を確認
- PR #93で標準化・CI軽量化完了後の現在地を確定
- PR #94でSearch ConsoleのGrowth gate観測結果を現在地へ反映
- PR #97で `ai-design-template` のDesign Baselineとsemantic design token基盤を導入
- PR #98でglobal semantic tokenの適用範囲をPerformance budgetと実際の変更波及から調整
- PR #99で主要Navigationへsemanticかつ非Color依存の現在位置表現を追加
- PR #100で高密度な情報設計に合わせてTypography hierarchyを調整
- PR #101でHeader / Footerをsemantic roleへ寄せ、共通Shellの差し替え容易性を改善
- トップページにEOL・サポート期限の読み方、期限確認後の手順、掲載情報の根拠を追加。目的は利用者向けコンテンツの充実であり、インデックス登録への効果や未登録原因との関係は仮定しない
- PR #113で期限変更とカテゴリ別入口、バージョン確認と環境別チェックリスト、最新リリースとマイEOL活用例を追加。利用者の情報探索・継続確認を目的とし、SEO効果は未判定

## 直近の検証結果

2026-11-21の運用点検: PR #132 の自動化がmainへ反映され、期限切れ・権限不足だった `EOL_AUTOMATION_TOKEN` の書き込み権限が修正された。手動起動した `Sync EOL data` → 更新PR #131 → フルCI → Cloudflareビルド → `Auto-merge verified EOL data` → main CI がすべて成功。PR #131は自動マージ済みで、mainにEOLスナップショット更新が反映された。独自の公式情報確認・日本語説明・開発PRは自動マージ対象外である。

2026-11-14時点で、mainのCIはPR #125 / #126マージ後にPASS、定期EOL同期も成功。URL検査では未登録問題が継続しているが、全ページに及ぶ技術的ブロックは確認されていない。検索流入の観測・改善判断は依然としてGrowth gate中。

`PASS` — 初回Design Refinementは完了。PR #97〜#101では、既存のResponsive / Accessibility / Astro check / production build / Performance budget / browser smoke / SEO等の品質gateを維持したまま改善を行った。

特にPR #98では、global token化を広げすぎた段階でCSS Performance budget超過を検出した。budgetを緩和せず、Component内で完結するVisual valueをlocalへ戻し、Theme全体・複数Component・Domain meaningとの境界に関係する値だけをglobal semantic tokenとして残すことでPASSへ戻した。この結果を `docs/DESIGN.md` に反映済み。

2026-09-17時点で、直近のmain CI、日次EOLデータ同期、snapshot鮮度チェックに未解決の失敗は確認していない。デザイン改善や標準化を目的とした追加実装は行わない。

PR #113のフルCIとマージ後のmain CIはすべて成功。公開TOPはHTTP 200で追加見出しを確認し、変更履歴・代表カテゴリ・リリース・マイEOL・カレンダー・3製品詳細の代表リンク10件をHTTP 200で確認した。サイト全体のインデックス状況は引き続き未判定。

## 本番確認・公開後の判断

`未判定` — Growth gateは継続する。技術的なindex可否と、Googleが実際にindexするかは区別する。

2026-11-21の**Google Search Console画面実測**（ユーザー提供画像、`sc-domain:eol.slothwright.com`）:

- **ページ登録：登録済み0／未登録473**。内訳は「検出 - インデックス未登録」452件、「クロール済み - インデックス未登録」21件。これはGSCページ登録レポートの実際の集計値であり、以前のURL検査標本の0件とは異なる。グラフ表示の時点は11月中旬まで。レポートの正確な更新日は画像から未確認。
- **サイトマップ：** `https://eol.slothwright.com/sitemap.xml` は2026-09-16に送信、**2026-11-15に最終読み込み**、取得状態「成功しました」、検出ページ473件。
- **公開URLをテスト：** トップページ（2026-11-21 09:32 JST）とNode.js（09:34 JST）の両方が「URLはGoogleに登録できます」。Google検査ツール（スマートフォン）でクロール許可「はい」、ページ取得「成功」、index許可「はい」。ユーザー指定canonicalは各URL自身、Google選択canonicalは「インデックス登録後にのみ決定されます」。ライブ検査合格は登録済みを意味しない。
- 「クロール済み」のGSC修正検証は画面上「失敗しました」、「検出」の修正検証は「開始」。この検証ステータスだけからページ取得エラーやrobots遮断と断定しない。
- **切り分け：** サイトマップ未送信・未取得や、代表2URLの恒常的なrobots/noindex/取得失敗が主要原因である可能性は低い。452 URLはGoogleが認識済みだが未クロール、21 URLはクロール後に未登録。Googleの索引選択理由は現時点で未確定であり、ユーザー側の一律設定不備と断定しない。
- 初期の取得状態調査 [Issue #129](https://github.com/slothwork/eol-jp/issues/129) は完了としてclose。インデックス未登録の**改善と経過観測**は [Issue #134](https://github.com/slothwork/eol-jp/issues/134) に切り出して対応する。

2026-11-21のSearch Console再確認（プロパティ `sc-domain:eol.slothwright.com`、OpenSEO経由の保存済みURL検査）:

- 代表10 URL中「クロール済み - インデックス未登録」8件、「Googleに認識されていません」2件（`/my-eol/`, `/trust/official-sources/`）。この10件は標本であり、サイト全体の登録件数ではない。
- クロール済み8 URLの保存済み最終クロールは2026-09-04〜09-29。robots許可・index許可・取得成功・両canonicalの一致を確認。11月時点のライブ取得状況は不明。
- 検索パフォーマンスは2026-10-22〜11-18の28日間すべて表示0・クリック0。2026-08-18〜11-18のページ別データ行も0。これのみでは全URL未登録とは断定しない。
- 既存の外部クローラー監査（2026-11-14）は50件すべてHTTP 200・トップページはindexable、約2,498語相当（クローラー計測）。対象50件に重大なタイトル/H1欠落・canonical競合・リンク切れはないが、約492 URLはページ上限で未検査。短いtitle/descriptionの情報レベル指摘が未登録の原因と証明されたわけではない。
- コード再確認: `robots.txt` はクロール許可・sitemap案内、`astro.config.mjs` は本番origin・静的生成、`BaseLayout.astro` はself canonical・noindex指定時のみrobotsメタ。トップ/Node.js/Python/PHP/Ubuntuには独自日本語解説、EOL表、FAQ、移行・公式資料への導線があり、重大な内容欠落は現時点で確認していない。
- **2026-11-14時点では未取得だった判断材料**: GSCページ登録集計・サイトマップ・公開URLテストは、その後2026-11-21にユーザー提供画像で取得済み。残る課題は原因仮説の検証と登録済み0件からの改善観測（Issue #134）。


2026-11-14の再調査結果（Google Search Console `sc-domain:eol.slothwright.com` の実データ）:

- URL検査を主要20 URLに実施。標本内の登録済みは0件。内訳は「クロール済み - インデックス未登録」14件、「URL が Google に認識されていません」6件。**これはサイト全体の登録件数を意味しない**。
- クロール済み14件はGoogleの保存済み検査結果で、当時の取得は成功、robots / index許可、Google選択canonicalとユーザー指定canonicalは一致。最終クロール日時は2026-09-04〜09-29の範囲。現在のGooglebotによる取得成功を保証するデータではない。
- 検査対象にはトップ、製品一覧、最新リリース、期限一覧、カレンダー、変更履歴、Node.js / Python / PHP / Ubuntu / PostgreSQL / Windows / Kubernetes / Docker Engine等の製品詳細を含む。未認識の例: マイEOL、公式ソース照合、MySQL、Redis、nginx、.NET。
- 検索パフォーマンスは2026-08-11〜11-11のページ別・クエリ別で該当行が0。直近28日（取得対象2026-10-15〜11-11）の日別応答27行（10月15日〜11月10日）はクリック・表示回数とも0。表示回数0をサイト全体の未登録件数の根拠にはしない。
- 2026-11-14の外部クローラーによる50ページ限定の本番監査では50件すべてHTTP 200。欠落title / H1、canonical競合、内部リンク切れの指摘なし。指摘はmeta descriptionが短い36ページ、トップtitleが短い1ページ（いずれも情報レベル）と50ページ上限。これはGooglebotのライブ取得を代替せず、短いメタ情報が未登録の原因と判断する証拠もない。
- ソース上の `public/robots.txt` は `Allow: /` と正しいsitemap URLを案内し、`astro.config.mjs` は本番originと静的出力を指定。代表ページには固有の見出し、バージョン一覧、移行・公式情報への導線がある。現時点で根拠のない一括title / description変更、無差別noindex化、ページ削除は行わない。
- Search Consoleの**「ページのインデックス登録」レポートの登録件数・未登録理由別件数**と代表URLの**「公開URLをテスト」**は今回未取得。現状の主要ブロッカーとして [Issue #129](https://github.com/slothwork/eol-jp/issues/129) で追跡する。

2026-09-26の再調査結果:

- Windsor経由のSearch Consoleで `sc-domain:eol.slothwright.com` を確認。9月1日〜25日を指定した取得結果は9月3日〜23日で、クリック・表示回数はすべて0。表示0だけから全URL未登録とは断定しない。
- sitemapは463 URL、error 0、warning 0。最終取得は2026-09-25 15:27:44 UTC（9月26日 00:27:44 JST）。
- 公開サイトへの通常のHTTP GETで、ホーム、`/eol/`、`/releases/`、`/eol/nodejs/`、`/eol/python/` は200。確認したHTMLのcanonicalは本番URL自身を指し、noindexとX-Robots-Tagはない。
- 公開robots.txtは全体を許可し、本番sitemapを案内。sitemapは200で463 URL、originは本番のみ。存在しない検査用URLは404。
- これは通常のHTTP取得であり、Googlebotの取得成功やGoogleが選択したcanonicalの確認を代替しない。
- 9月16日の主要4URL「クロール済み - インデックス未登録」は過去の観測として保持する。今回の接続はURL検査・Indexing Trackerを提供していないため、現在の各URLの登録状態は未確認。
- 過去の「sitemap indexed 0」をサイト全体の登録件数の根拠に使う記述を訂正する。Google Sitemaps APIの `contents[].indexed` は廃止項目で使用不可。登録件数はSearch Console画面の「ページのインデックス登録」、個別状態はURL検査で確認する。

出典: https://developers.google.com/webmaster-tools/v1/sitemaps

確認範囲では登録を妨げる配信・SEO設定の異常は見つからない。未登録理由は未確定であり、「品質不足」や「CloudflareがGooglebotを遮断」とは断定しない。

## 作業中のこと

- [Issue #134](https://github.com/slothwork/eol-jp/issues/134) — GSC登録済み0件・未登録473件に対するクロール・インデックス採用の改善検証。Issue #129の基礎調査は完了済み。

## 次に行うこと

1. **検出・未クロール452件のサンプル調査** — GSCで3〜5件の例示URLを選び、サイトマップ・内部HTMLリンク元・index設定・HTTP状態を照合する。全473件が同一原因と決めつけない。
2. **クロール済み・未登録21件のサンプル調査** — トップ・Node.js・Python・PHP・Ubuntuのうち、実際にGoogleがクロールしたページと対応する既存サイトとの差異、独自の説明・公式情報・内部リンクを比較する。検証失敗の対象URLも確認する。
3. **少数ページで対策・再観測** — 確認した改善点に限定したPRを作成し、2〜4週間後（目安2026-12-05〜12-19）に同じGSCの登録済み件数・理由別件数・最終クロールと表示回数を比較する。サイト全体のtitle等を一括変更しない。

## ブロッカー・重要リスク

- **登録済み0件:** GSCで473件の未登録が確認された。代表2URLは公開URLテストで取得成功したが、452件の未クロール／21件のクロール済み未登録が続く。内部リンク・Googleのクロール優先度・コンテンツ独自性を検証する（Issue #134）。
- **自動化の対象外:** 公式ソース照合、独自日本語説明、商用サポート、変更内容の一次情報確認は別途手動レビューを要する。
- GSCの保存済みクロール日時（2026年9月）と2026-11-21の公開URLライブテストを混同しない。Googleがインデックス登録を保証したわけではない。
- インデックス反映待ちの段階で大規模なSEO変更を重ねると、何が効いたか比較できなくなる
- 文書パスが将来build / test入力になる場合は、同じ変更でCI分類を再検討する
- 新しいプロセス文書やCIロジックを増やしすぎて、管理負荷を実開発より重くしないこと
- Design replaceabilityを理由に、Component-localで十分なVisual valueまでglobal abstractionへ押し上げないこと

## 関連するPull Request / Issue

- [Issue #129](https://github.com/slothwork/eol-jp/issues/129) — GSCの理由別件数・公開URLライブ検査の調査。クローズ済み
- [Issue #134](https://github.com/slothwork/eol-jp/issues/134) — 登録済み0件・未登録473件の改善と2〜4週間後の再観測。対応中
- [PR #132](https://github.com/slothwork/eol-jp/pull/132) — EOL更新データの安全な自動公開。マージ済み
- [PR #90](https://github.com/slothwork/eol-jp/pull/90) — 企画・判断・現在地の整理。マージ済み
- [PR #91](https://github.com/slothwork/eol-jp/pull/91) — 文書専用変更のCI軽量化。マージ済み
- [PR #92](https://github.com/slothwork/eol-jp/pull/92) — 標準化の振り返りと文書専用軽量CIの実案件確認。マージ済み
- [PR #93](https://github.com/slothwork/eol-jp/pull/93) — 標準化完了後の現在地確定。マージ済み
- [PR #94](https://github.com/slothwork/eol-jp/pull/94) — Search ConsoleのGrowth gate観測結果記録。マージ済み
- [PR #97](https://github.com/slothwork/eol-jp/pull/97) — `ai-design-template` 初回適用とsemantic token基盤。マージ済み
- [PR #98](https://github.com/slothwork/eol-jp/pull/98) — semantic tokenの適用範囲調整。マージ済み
- [PR #99](https://github.com/slothwork/eol-jp/pull/99) — 主要Navigationの現在位置表現。マージ済み
- [PR #100](https://github.com/slothwork/eol-jp/pull/100) — Typography hierarchy調整。マージ済み
- [PR #101](https://github.com/slothwork/eol-jp/pull/101) — Header / Footer Presentation整理。マージ済み

## 最終更新時の補足

日次同期で `main` は継続的に進むため、最新SHAや一時的なCI run番号はこの文書へ固定しない。新しいセッションではGitHubの最新 `main` とopen PR / open Issueを最初に確認し、文書に残る記載より実際のGitHub状態を優先する。
