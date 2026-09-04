export function hasMeaningfulRankingChange(current, next) {
  if (!current) return true;

  if (
    current.windowDays !== next.windowDays ||
    current.scopeDays !== next.scopeDays ||
    current.source !== next.source
  ) {
    return true;
  }

  const currentItems = Array.isArray(current.items) ? current.items : [];
  const nextItems = Array.isArray(next.items) ? next.items : [];

  if (currentItems.length !== nextItems.length) return true;

  return nextItems.some((item, index) => {
    const previous = currentItems[index];
    return !previous || previous.slug !== item.slug || previous.pageViews !== item.pageViews;
  });
}
