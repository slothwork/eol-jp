export const TRACKED_PRODUCTS_STORAGE_KEY = 'eol-jp:tracked-products:v1';

export type TrackedProductEntry = {
  version: string;
  savedAt: string;
};

export type TrackedProductsState = {
  schemaVersion: 1;
  products: Record<string, TrackedProductEntry>;
};

export function emptyTrackedProductsState(): TrackedProductsState {
  return {
    schemaVersion: 1,
    products: {}
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseTrackedProducts(raw: string | null): TrackedProductsState {
  if (!raw) return emptyTrackedProductsState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || parsed.schemaVersion !== 1 || !isPlainObject(parsed.products)) {
      return emptyTrackedProductsState();
    }

    const products: Record<string, TrackedProductEntry> = {};
    for (const [slug, value] of Object.entries(parsed.products)) {
      if (!slug || !isPlainObject(value)) continue;

      const version = typeof value.version === 'string' ? value.version.trim() : '';
      const savedAt = typeof value.savedAt === 'string' ? value.savedAt : '';
      if (!version || !savedAt) continue;

      products[slug] = { version, savedAt };
    }

    return {
      schemaVersion: 1,
      products
    };
  } catch {
    return emptyTrackedProductsState();
  }
}

export function serializeTrackedProducts(state: TrackedProductsState): string {
  return JSON.stringify(state);
}

export function setTrackedProduct(
  state: TrackedProductsState,
  slug: string,
  version: string,
  savedAt = new Date().toISOString()
): TrackedProductsState {
  const normalizedSlug = slug.trim();
  const normalizedVersion = version.trim();
  if (!normalizedSlug || !normalizedVersion) return state;

  return {
    schemaVersion: 1,
    products: {
      ...state.products,
      [normalizedSlug]: {
        version: normalizedVersion,
        savedAt
      }
    }
  };
}

export function removeTrackedProduct(state: TrackedProductsState, slug: string): TrackedProductsState {
  const products = { ...state.products };
  delete products[slug];

  return {
    schemaVersion: 1,
    products
  };
}
