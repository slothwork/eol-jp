export type ProductSeoOverride = {
  title?: string;
  description?: string;
  rationale?: string;
};

/**
 * Search Console の実データで改善根拠が確認できた製品だけを追加する。
 * 推測だけで主要製品を一括変更しない。
 *
 * Example:
 * nodejs: {
 *   title: 'Node.jsのEOL・LTSサポート期限',
 *   description: '...',
 *   rationale: 'Search Console: 「Node.js LTS EOL」の表示回数が多くCTRが低い'
 * }
 */
export const productSeoOverrides: Record<string, ProductSeoOverride> = {};
