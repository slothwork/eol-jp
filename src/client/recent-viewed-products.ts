import {
    VIEW_HISTORY_STORAGE_KEY,
    clearViewHistory,
    parseViewHistory,
    removeViewedProduct,
    serializeViewHistory,
    type ViewHistoryState
  } from '@/lib/view-history';

  const DEFAULT_VISIBLE_ITEMS = 6;
  const SIDEBAR_VISIBLE_ITEMS = 4;

  document.querySelectorAll<HTMLElement>('[data-view-history-section]').forEach((section) => {
    const list = section.querySelector<HTMLElement>('[data-view-history-list]');
    const clearButton = section.querySelector<HTMLButtonElement>('[data-view-history-clear]');
    const moreRow = section.querySelector<HTMLElement>('[data-view-history-more-row]');
    const moreButton = section.querySelector<HTMLButtonElement>('[data-view-history-more]');
    if (!list || !clearButton || !moreRow || !moreButton) return;

    const sidebarSlot = document.querySelector<HTMLElement>('[data-view-history-slot]');
    const sidebarLayout = sidebarSlot?.parentElement ?? null;
    const isSidebar = Boolean(sidebarSlot);
    const initialVisibleItems = isSidebar ? SIDEBAR_VISIBLE_ITEMS : DEFAULT_VISIBLE_ITEMS;
    let expanded = false;

    if (sidebarSlot) {
      section.dataset.viewHistoryPlacement = 'sidebar';
      sidebarSlot.append(section);
    } else {
      const pageHead = document.querySelector<HTMLElement>('main > .page-head');
      pageHead?.after(section);
    }

    const updatePlacementVisibility = (hasItems: boolean) => {
      if (!sidebarSlot) return;
      sidebarSlot.hidden = !hasItems;
      sidebarLayout?.classList.toggle('has-recent-history', hasItems);
    };

    const load = (): ViewHistoryState => {
      try {
        return parseViewHistory(localStorage.getItem(VIEW_HISTORY_STORAGE_KEY));
      } catch {
        return parseViewHistory(null);
      }
    };

    const persist = (state: ViewHistoryState) => {
      localStorage.setItem(VIEW_HISTORY_STORAGE_KEY, serializeViewHistory(state));
    };

    const formatViewedAt = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const render = () => {
      const state = load();
      const visibleItems = expanded ? state.items : state.items.slice(0, initialVisibleItems);
      list.replaceChildren();

      if (state.items.length === 0) {
        section.hidden = true;
        updatePlacementVisibility(false);
        return;
      }

      section.hidden = false;
      updatePlacementVisibility(true);
      for (const item of visibleItems) {
        const article = document.createElement('article');
        article.className = 'history-item view-history-item';

        const content = document.createElement('div');
        const heading = document.createElement('h3');
        const link = document.createElement('a');
        link.href = `/eol/${encodeURIComponent(item.slug)}/`;
        link.textContent = item.label;
        heading.append(link);

        const meta = document.createElement('p');
        meta.className = 'muted';
        meta.textContent = `最終閲覧: ${formatViewedAt(item.viewedAt)}`;
        content.append(heading, meta);

        const removeButton = document.createElement('button');
        removeButton.className = 'button';
        removeButton.type = 'button';
        removeButton.textContent = '履歴から削除';
        removeButton.addEventListener('click', () => {
          try {
            persist(removeViewedProduct(load(), item.slug));
            render();
          } catch {
            removeButton.disabled = true;
            removeButton.textContent = '削除できません';
          }
        });

        article.append(content, removeButton);
        list.append(article);
      }

      moreRow.hidden = state.items.length <= initialVisibleItems;
      moreButton.setAttribute('aria-expanded', String(expanded));
      moreButton.textContent = expanded ? '表示を減らす' : `すべて表示（${state.items.length}件）`;
    };

    clearButton.addEventListener('click', () => {
      try {
        persist(clearViewHistory());
        expanded = false;
        render();
      } catch {
        clearButton.disabled = true;
        clearButton.textContent = '削除できません';
      }
    });

    moreButton.addEventListener('click', () => {
      expanded = !expanded;
      render();
    });

    window.addEventListener('storage', (event) => {
      if (event.key === VIEW_HISTORY_STORAGE_KEY) render();
    });

    render();
  });
