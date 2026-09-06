export type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

export function getTurnstile(): TurnstileApi | undefined {
  return (window as TurnstileWindow).turnstile;
}

export async function loadTurnstile(): Promise<TurnstileApi> {
  const existing = getTurnstile();
  if (existing) return existing;

  await new Promise<void>((resolve, reject) => {
    const current = document.querySelector<HTMLScriptElement>('script[data-eol-turnstile]');
    if (current) {
      current.addEventListener('load', () => resolve(), { once: true });
      current.addEventListener('error', () => reject(new Error('turnstile_load_failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.eolTurnstile = '1';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('turnstile_load_failed')), { once: true });
    document.head.append(script);
  });

  const api = getTurnstile();
  if (!api) throw new Error('turnstile_unavailable');
  return api;
}
