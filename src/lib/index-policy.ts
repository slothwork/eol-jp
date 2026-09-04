import { productSummaries } from '@/data/product-meta';
import type { Product } from '@/lib/eol';

const MIN_DATED_EOL_RELEASES = 2;

export type ProductIndexReason = 'curated' | 'lifecycle-data' | 'insufficient-data';

export type ProductIndexDecision = {
  indexable: boolean;
  reason: ProductIndexReason;
  datedEolReleases: number;
};

export function productIndexDecision(product: Product): ProductIndexDecision {
  const datedEolReleases = product.releases.filter((release) => Boolean(release.eolFrom)).length;

  if (Boolean(productSummaries[product.slug])) {
    return { indexable: true, reason: 'curated', datedEolReleases };
  }

  const hasSource = Boolean(product.links.releasePolicy || product.links.html);
  if (hasSource && datedEolReleases >= MIN_DATED_EOL_RELEASES) {
    return { indexable: true, reason: 'lifecycle-data', datedEolReleases };
  }

  return { indexable: false, reason: 'insufficient-data', datedEolReleases };
}

export function isIndexableProduct(product: Product): boolean {
  return productIndexDecision(product).indexable;
}
