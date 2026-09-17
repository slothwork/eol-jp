# デザイン方針

この文書は、`ai-design-template` を EOL情報.jp へ適用するための初期 Design Baseline です。

デザイン履歴をすべて保存する場所ではなく、現在採用している方向性、維持する要素、改善対象、デザイン実装上の境界を短時間で把握するために使います。

## デザイン目的

EOL・サポート期限という判断性の高い情報を、短時間で正確に読み取り、公式ソースを確認し、必要に応じて継続監視へ進めるUIを維持・改善する。

見栄えの派手さではなく、次を優先する。

1. 正確性・信頼性を損なわない
2. 期限・状態・現在位置・次の行動を素早く理解できる
3. 高密度な情報でも読み疲れしにくい
4. モバイルでも主要情報を失わない
5. 将来のVisual direction変更を局所的な変更で行える

## 対象ユーザー・利用文脈

主対象は日本のソフトウェア開発者、インフラ / SRE / プラットフォーム担当、情シス / 社内IT担当など、複数製品のライフサイクルを確認する利用者。

主な利用文脈は次のとおり。

- 検索結果から特定製品のEOL情報を確認する
- 複数製品・バージョンの期限を比較する
- 公式一次情報や監査情報から根拠を確認する
- 重要な製品をマイEOLへ登録して継続監視する
- Desktopでは一覧性、Mobileでは主要期限と状態の可読性を重視する

## 現在の評価

### Keep

- 比較・一覧を高密度テーブル中心とする方針
- ISO日付だけでなく残日数・状態を併記する情報設計
- Product detailで期限情報を主役にする構造
- 公式ソース、監査、変更履歴へ到達できる信頼性導線
- Sticky header、Keyboard focus、44px以上の主要操作領域など既存Accessibility配慮
- Astroの静的生成を中心にした軽量なページ構成
- 外部UI frameworkへ依存せず、現在の規模に対して比較的単純なCSS構成
- localStorageや外部機能が失敗しても基本情報閲覧を妨げない設計

### Improve

- Color、Border、Radius、Surface、Focus等のVisual valueが一部CSS custom propertyへ集約されている一方、直接値も多数存在するため、semantic tokenへ段階的に整理する
- Button、Panel、Card、Form control、Status等で似たVisual ruleが分散しており、差し替え時の変更箇所を減らす
- Typography hierarchyを役割ベースで整理し、個別selectorごとの微調整依存を減らす
- Status colorが情報上重要なため、色だけに依存しない表現とContrastを継続確認する
- High-density tableとCard UIの境界を明確にし、情報量の多い箇所でCard分割を増やしすぎない
- Header / Navigation / FooterのVisual definitionを、将来の全体テーマ変更時に追いやすくする
- CSSが複数ファイルへ分かれているため、責務を維持しつつ共通Visual tokenの参照元を一本化する

### Replace

現時点では大規模なUI構造の置換は行わない。

主要導線と情報構造はプロダクト目的に合致しており、まずDesign foundationsと実装上の差し替え容易性を改善する方が変更リスクに対して合理的と判断する。

## デザイン方向性

目指す方向は次の組み合わせとする。

- Trustworthy
- Technical
- Calm
- Information-dense
- Clear hierarchy
- Low decoration

「管理ツールらしい情報密度」と「一般公開サイトとしての読みやすさ」の中間を狙う。

視覚的な装飾より、期限・状態・製品名・公式根拠・Primary actionの優先順位を明確にする。

## 参考デザイン

現時点では外部Reference designを固定しない。

今後、ユーザーから「配色はAサイト」「TypographyはBサイト」「全体の雰囲気はCサイト」のような指定があった場合は、`ai-design-template` の Reference Design Analysis に従い、要素単位で Adopt / Adapt / Reject を判断する。

### Adopt

現時点ではなし。

### Adapt

現時点ではなし。

### Reject

特定サイトのVisual designをそのまま複製することは行わない。

## Design Foundations

### Color

現在のBlue系Primaryと明るいNeutral surfaceは、信頼性・技術情報サイトとして大きな不整合はないため当面維持する。

今後は具体的なhex値を画面要素ごとに増やさず、少なくとも次のsemantic roleへ整理する。

- Background
- Surface
- Text primary / secondary
- Border
- Primary action
- Focus
- Success / Warning / Critical / Ended / Unknown

Statusは意味をColorだけへ依存させない。

### Typography

日本語本文の可読性を最優先する。

現在のSystem font中心の構成はPerformanceと日本語fallbackの点で合理的なため、外部Web fontは明確なVisual benefitがある場合だけ導入する。

Heading、Body、Caption、Table heading、Status、Actionなど役割単位でscaleとweightを整理する。

### Layout / Spacing

比較・一覧画面はCompact〜Balanced、説明・導入画面はBalancedを基本とする。

情報の関係を示す余白を優先し、単純に広い余白を高級感として導入しない。

### Shape / Elevation

Borderと軽いSurface差を基本とし、ShadowやBlurは階層理解に必要な場合へ限定する。

Card、Panel、Button等のRadiusはtoken化し、用途ごとに無秩序な値を増やさない。

### Iconography

現時点では大規模なIcon library導入を前提にしない。

Iconを導入する場合は、装飾ではなく操作・状態理解の補助として使用し、Stroke / Filled / Sizeの一貫性を保つ。

### Imagery / Motion

情報サイトのため、写真やIllustrationを主要UIへ大量導入しない。

MotionはMenu、State transition、Feedback等の理解補助に限定し、`prefers-reduced-motion` を尊重する。

## Interaction / Platform

主要PlatformはWeb。

- Desktop: Mouse / Keyboard、比較・一覧性を優先
- Mobile: Touch、主要期限・状態・Primary actionを優先
- Keyboard: Focus visibilityと論理的な操作順を維持

Desktopの高密度性をそのままMobileへ押し込まず、優先情報を保ちながら必要に応じてscrollやlayout変更を利用する。

## Responsive / Accessibility

- 主要viewportで横方向の破綻を起こさない
- Tableは必要に応じてhorizontal scrollを許容するが、重要列が把握しにくくならないか確認する
- Interactive targetは原則44px以上を維持する
- `focus-visible` を維持する
- ContrastとStatus識別を確認する
- Reduced motionを尊重する
- 長い日本語・英数字・製品名でもlayoutが破綻しないことを確認する

## State設計

必要に応じて次を明示する。

- Loading
- Empty
- Error
- Success
- Disabled
- Partial data
- Storage unavailable
- External API unavailable
- Unknown / unconfirmed lifecycle data

情報取得やlocalStorage関連機能が失敗しても、基本的なEOL情報の閲覧を阻害しない。

## Content / Trust / Localization

UI文言では、操作後の結果が分かる具体的な表現を優先する。

公式情報、upstream data、サイト側の解釈を視覚的・文言上で混同しない。

日付、期限、警告は曖昧な表現だけで済ませず、判断に必要な具体情報を併記する。

主言語は日本語。製品名やversion等の英数字が長い場合も破綻しないことを前提にする。

## デザイン実装方針

### CSS strategy

当面は既存のCSSを継続利用する。

現在の規模ではTailwind CSS等の新規framework導入による利益より移行コストが大きいと判断する。Visual directionの変更に必要な共通値・Component ruleの整理を既存CSS上で先に行う。

### UI / Component library

現時点では導入しない。

既存Astro componentとCSSで十分管理可能であり、library導入でVisual overrideやbundle、依存管理を増やさない。

### Icon library

現時点では導入しない。

必要性が増えた場合にVisual direction、coverage、License、bundleを比較して判断する。

### Font

System font stackを継続する。

外部font導入は日本語可読性、Performance、License、Visual benefitを比較して判断する。

### Design tokens / CSS variables

現在の `--border`、`--muted`、`--surface`、`--primary` を起点として、段階的にsemantic tokenを拡張する。

ただし、全CSSを一度にDesign System化しない。Design refinementで触れる箇所から共通化し、同じ意味の直接値が重複する場合にtokenへ昇格する。

### Motion / Asset

Brand asset生成の既存方式を尊重する。

新しいAssetやMotion dependencyは、明確なデザイン上の必要性がある場合だけ追加する。

## デザイン差し替え方針

Visual directionは将来変更される可能性があるものとして扱う。

将来の変更では、主に次を差し替えることで全体の印象を変更できる状態を目指す。

1. Semantic design tokens
2. Typography role
3. Shared component presentation
4. Header / Navigation / Footer presentation
5. Status presentation
6. Icon / Brand asset
7. Page固有の例外style

Business / Domain logicは、Color、Radius、Font、Shadow等のVisual valueを直接決めない。

期限区分やSupport status等のDomain meaningはBusiness側で保持し、それをどのColor・Badge style・Iconで表現するかはPresentation側で変更可能にする。

変更容易性のためだけにTheme engineや多層抽象化を先回りして導入しない。実際に複数箇所へ波及しているVisual ruleから段階的に共通化する。

## Performance方針

既存のPerformance budgetを維持する。

- 不要なUI frameworkを追加しない
- Web fontは利益が明確な場合だけ導入する
- 大画像、重いBlur、Shadow、Animationを増やさない
- Design refinement後も既存Performance checkを通す

## 意図的に採用しない表現

現時点では次を標準方向としない。

- Gradientを主役にしたGeneric SaaS風UI
- Glassmorphismの多用
- 情報ごとの過剰なCard分割
- 大きなHeroで主要情報を画面下へ押し下げる構成
- 意味のないDecoration icon
- EOL状態をColorだけで伝える表現
- 情報密度を下げること自体を目的にした大幅な余白拡大

## Design QA結果

`FIX` — 現在の情報設計・主要UX・Accessibility方針は概ね維持可能だが、Design replaceabilityの観点では改善余地がある。

初期確認で特に改善対象とする。

- Visual valueの直接指定をsemantic tokenへ段階的に寄せる
- 類似ComponentのVisual ruleを整理する
- Domain meaningとVisual presentationの境界を維持する
- Design refinement後もResponsive / Accessibility / Performanceを回帰確認する

全面再設計を必要とする問題は現時点では確認していない。

## 未確定事項

- 外部Reference designを利用するか
- 現在のBlue / Neutral方向をどの程度維持するか
- Visual refinementでブランド性をどの程度強めるか

これらは実際のデザイン改善へ入る時点で、必要に応じてGuided Design Decisionとして確認する。
