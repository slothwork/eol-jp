export const VIEW_HISTORY_STORAGE_KEY = 'eol-jp:view-history:v1';
export const MAX_VIEW_HISTORY_ITEMS = 20;

export type ViewedProduct = {
  slug: string;
  label: string;
  viewedAt: string;
};

export type ViewHistoryState = {
  schemaVersion: 1;
  items: ViewedProduct[];
};

export function emptyViewHistoryState(): ViewHistoryState {
  return { schemaVersion: 1, items: [] };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseViewHistory(raw: string | null): ViewHistoryState {
  if (!raw) return emptyViewHistoryState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.items)) {
      return emptyViewHistoryState();
    }

    const items: ViewedProduct[] = [];
    const seen = new Set<string>();

    for (const value of parsed.items) {
      if (!isPlainObject(value)) continue;
      const slug = typeof value.slug === 'string' ? value.slug.trim() : '';
      const label = typeof value.label === 'string' ? value.label.trim() : '';
      const viewedAt = typeof value.viewedAt === 'string' ? value.viewedAt.trim() : '';
      if (!slug || !label || !viewedAt || seen.has(slug)) continue;

      seen.add(slug);
      items.push({ slug, label, viewedAt });
      if (items.length >= MAX_VIEW_HISTORY_ITEMS) break;
    }

    return { schemaVersion: 1, items };
  } catch {
    return emptyViewHistoryState();
  }
}

export function serializeViewHistory(state: ViewHistoryState): string {
  return JSON.stringify(state);
}

export function recordViewedProduct(
  state: ViewHistoryState,
  slug: string,
  label: string,
  viewedAt = new Date().toISOString()
): ViewHistoryState {
  const normalizedSlug = slug.trim();
  const normalizedLabel = label.trim();
  if (!normalizedSlug || !normalizedLabel) return state;

  return {
    schemaVersion: 1,
    items: [
      { slug: normalizedSlug, label: normalizedLabel, viewedAt },
      ...state.items.filter((item) => item.slug !== normalizedSlug)
    ].slice(0, MAX_VIEW_HISTORY_ITEMS)
  };
}

export function removeViewedProduct(state: ViewHistoryState, slug: string): ViewHistoryState {
  return {
    schemaVersion: 1,
    items: state.items.filter((item) => item.slug !== slug)
  };
}

export function clearViewHistory(): ViewHistoryState {
  return emptyViewHistoryState();
}
