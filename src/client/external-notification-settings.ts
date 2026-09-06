import {
  EXTERNAL_NOTIFICATION_STORAGE_KEY,
  MAX_EXTERNAL_NOTIFICATION_ITEMS,
  buildExternalNotificationPayload,
  clearExternalNotificationSubscription,
  emptyExternalNotificationState,
  externalNotificationNeedsSync,
  markExternalNotificationSynced,
  parseExternalNotificationState,
  serializeExternalNotificationState,
  setExternalNotificationSubscription,
  type ExternalNotificationChannel,
  type ExternalNotificationState
} from '@/lib/external-notifications';
import { EOL_REMINDER_STORAGE_KEY, parseEolReminderState } from '@/lib/eol-reminders';
import { TRACKED_PRODUCTS_STORAGE_KEY, parseTrackedProducts } from '@/lib/tracked-products';
import { getTurnstile, loadTurnstile } from './turnstile';

const form = document.querySelector<HTMLFormElement>('[data-external-notification-form]');
const configured = document.querySelector<HTMLElement>('[data-external-notification-configured]');
const summary = document.querySelector<HTMLElement>('[data-external-notification-summary]');
const message = document.querySelector<HTMLElement>('[data-external-notification-message]');
const channelSelect = document.querySelector<HTMLSelectElement>('[data-external-notification-channel]');
const webhookInput = document.querySelector<HTMLInputElement>('[data-external-notification-webhook]');
const registerButton = document.querySelector<HTMLButtonElement>('[data-external-notification-register]');
const channelLabel = document.querySelector<HTMLElement>('[data-external-notification-channel-label]');
const statusText = document.querySelector<HTMLElement>('[data-external-notification-status]');
const syncBadge = document.querySelector<HTMLElement>('[data-external-notification-sync-badge]');
const syncButton = document.querySelector<HTMLButtonElement>('[data-external-notification-sync]');
const deleteButton = document.querySelector<HTMLButtonElement>('[data-external-notification-delete]');
const turnstileContainer = document.querySelector<HTMLElement>('[data-external-notification-turnstile]');

let externalState: ExternalNotificationState = emptyExternalNotificationState();
let externalEnabled = false;
let turnstileSiteKey = '';
let turnstileToken = '';
let turnstileWidgetId: string | null = null;

const readPayload = () => {
  const tracked = parseTrackedProducts(localStorage.getItem(TRACKED_PRODUCTS_STORAGE_KEY));
  const reminders = parseEolReminderState(localStorage.getItem(EOL_REMINDER_STORAGE_KEY));
  return buildExternalNotificationPayload(tracked, reminders);
};

const thresholdText = (thresholds: number[]) => thresholds.length > 0
  ? thresholds.map((threshold) => `${threshold}日前`).join('・')
  : '通知タイミング未設定';

const showMessage = (text: string, isError = false) => {
  if (!message) return;
  message.hidden = false;
  message.textContent = text;
  message.classList.toggle('external-notification-error', isError);
};

const clearMessage = () => {
  if (!message) return;
  message.hidden = true;
  message.textContent = '';
  message.classList.remove('external-notification-error');
};

const persistExternalState = () => {
  localStorage.setItem(EXTERNAL_NOTIFICATION_STORAGE_KEY, serializeExternalNotificationState(externalState));
};

const registrationErrorText = (code: string) => ({
  invalid_webhook_url: 'SlackまたはDiscordの正しいWebhook URLを確認してください。',
  too_many_tracked_items: `外部通知は最大${MAX_EXTERNAL_NOTIFICATION_ITEMS}製品までです。`,
  turnstile_failed: 'ボット確認に失敗しました。もう一度お試しください。',
  external_notification_rate_limited: 'この接続元からの新規登録回数が上限に達しました。時間を空けてお試しください。',
  external_notification_daily_limit_reached: '本日の外部通知新規登録上限に達しました。明日もう一度お試しください。',
  external_notifications_unconfigured: '外部通知の新規登録保護設定が利用できません。時間を空けてお試しください。',
  forbidden_origin: '安全確認に失敗しました。ページを再読み込みしてお試しください。',
  client_ip_unavailable: '接続元を確認できないため登録できませんでした。時間を空けてお試しください。'
} as Record<string, string>)[code] ?? '通知登録またはテスト送信に失敗しました。Webhook URLを確認してください。';

const render = () => {
  if (!form || !configured || !summary || !registerButton || !channelLabel || !statusText || !syncBadge || !syncButton) return;
  const payload = readPayload();
  const count = payload.items.length;
  const tooMany = count > MAX_EXTERNAL_NOTIFICATION_ITEMS;
  const noThresholds = payload.thresholds.length === 0;
  summary.textContent = `現在の通知対象: ${count}製品 / ${thresholdText(payload.thresholds)}`;

  const subscription = externalState.subscription;
  form.hidden = Boolean(subscription) || !externalEnabled;
  configured.hidden = !subscription;

  if (!subscription) {
    registerButton.disabled = !externalEnabled || !turnstileToken || count === 0 || tooMany || noThresholds;
    if (!externalEnabled) summary.textContent += ' — 新規登録は安全確認設定が利用可能になるまで停止しています。';
    else if (tooMany) summary.textContent += ` — 外部通知は最大${MAX_EXTERNAL_NOTIFICATION_ITEMS}製品までです。`;
    else if (count === 0) summary.textContent += ' — 先に利用中バージョンを保存してください。';
    else if (noThresholds) summary.textContent += ' — 30 / 90 / 180日前のいずれかをONにしてください。';
    return;
  }

  const needsSync = externalNotificationNeedsSync(externalState, payload);
  channelLabel.textContent = subscription.channel === 'slack' ? 'Slack通知を登録済み' : 'Discord通知を登録済み';
  statusText.textContent = `最終同期: ${new Date(subscription.syncedAt).toLocaleString('ja-JP')}`;
  syncBadge.textContent = needsSync ? '同期が必要' : '同期済み';
  syncBadge.className = `status-badge ${needsSync ? 'status-warning' : 'status-supported'}`;
  syncButton.disabled = count === 0 || tooMany || noThresholds || !needsSync;
};

const resetTurnstile = () => {
  turnstileToken = '';
  const api = getTurnstile();
  if (api && turnstileWidgetId) api.reset(turnstileWidgetId);
  render();
};

const ensureTurnstile = async () => {
  if (!externalEnabled || !turnstileSiteKey || !turnstileContainer || turnstileWidgetId) return;
  const api = await loadTurnstile();
  turnstileWidgetId = api.render(turnstileContainer, {
    sitekey: turnstileSiteKey,
    action: 'external_notification',
    theme: 'auto',
    callback: (token: string) => {
      turnstileToken = token;
      render();
    },
    'expired-callback': () => {
      turnstileToken = '';
      render();
    },
    'error-callback': () => {
      turnstileToken = '';
      render();
    }
  });
};

const authorizedFetch = (method: string, body?: unknown) => {
  const subscription = externalState.subscription;
  if (!subscription) throw new Error('subscription_missing');
  return fetch(`/api/notifications/subscriptions/${encodeURIComponent(subscription.id)}`, {
    method,
    headers: {
      Authorization: `Bearer ${subscription.token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
};

const verifyRemote = async () => {
  const subscription = externalState.subscription;
  if (!subscription) return;
  try {
    const response = await authorizedFetch('GET');
    if (response.status === 401 || response.status === 404) {
      externalState = clearExternalNotificationSubscription();
      persistExternalState();
      await ensureTurnstile();
      render();
      showMessage('サーバー側の通知設定を確認できなかったため、このブラウザの古い管理情報をクリアしました。', true);
      return;
    }
    if (!response.ok) showMessage('通知設定の状態確認に失敗しました。後でもう一度確認してください。', true);
  } catch {
    showMessage('通知設定の状態確認に失敗しました。通信状態を確認してください。', true);
  }
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  if (!channelSelect || !webhookInput || !registerButton) return;

  const payload = readPayload();
  if (payload.items.length === 0 || payload.items.length > MAX_EXTERNAL_NOTIFICATION_ITEMS || payload.thresholds.length === 0) {
    render();
    return;
  }
  const webhookUrl = webhookInput.value.trim();
  if (!webhookUrl) {
    showMessage('Webhook URLを入力してください。', true);
    return;
  }
  if (!turnstileToken) {
    showMessage('ボット確認の完了を待ってから登録してください。', true);
    return;
  }

  registerButton.disabled = true;
  registerButton.textContent = 'テスト送信中…';
  try {
    const channel = channelSelect.value as ExternalNotificationChannel;
    const response = await fetch('/api/notifications/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, webhookUrl, turnstileToken, ...payload })
    });
    const data = await response.json() as { id?: string; token?: string; error?: string };
    if (!response.ok || !data.id || !data.token) {
      resetTurnstile();
      throw new Error(data.error ?? 'registration_failed');
    }

    externalState = setExternalNotificationSubscription(
      externalState,
      { id: data.id, token: data.token, channel },
      payload
    );
    persistExternalState();
    webhookInput.value = '';
    turnstileToken = '';
    render();
    showMessage('テスト送信に成功し、外部通知を登録しました。');
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    showMessage(registrationErrorText(code), true);
  } finally {
    registerButton.textContent = 'テストして通知を登録';
    render();
  }
});

syncButton?.addEventListener('click', async () => {
  clearMessage();
  const payload = readPayload();
  if (payload.items.length === 0 || payload.items.length > MAX_EXTERNAL_NOTIFICATION_ITEMS || payload.thresholds.length === 0) {
    render();
    return;
  }
  syncButton.disabled = true;
  syncButton.textContent = '同期中…';
  try {
    const response = await authorizedFetch('PUT', payload);
    const data = await response.json() as { error?: string };
    if (!response.ok) throw new Error(data.error ?? 'sync_failed');
    externalState = markExternalNotificationSynced(externalState, payload);
    persistExternalState();
    render();
    showMessage('現在の利用中バージョンとリマインダー設定を外部通知へ同期しました。');
  } catch {
    showMessage('外部通知の同期に失敗しました。後でもう一度実行してください。', true);
  } finally {
    syncButton.textContent = '現在のマイEOLと同期';
    render();
  }
});

deleteButton?.addEventListener('click', async () => {
  clearMessage();
  if (!deleteButton) return;
  deleteButton.disabled = true;
  deleteButton.textContent = '解除中…';
  try {
    const response = await authorizedFetch('DELETE');
    if (!response.ok && response.status !== 404) throw new Error('delete_failed');
    externalState = clearExternalNotificationSubscription();
    persistExternalState();
    if (turnstileWidgetId) resetTurnstile();
    else await ensureTurnstile();
    render();
    showMessage('外部通知設定を解除しました。');
  } catch {
    showMessage('外部通知設定を解除できませんでした。後でもう一度実行してください。', true);
  } finally {
    deleteButton.textContent = '通知設定を解除';
    deleteButton.disabled = false;
  }
});

const initialize = async () => {
  try {
    externalState = parseExternalNotificationState(localStorage.getItem(EXTERNAL_NOTIFICATION_STORAGE_KEY));
    const response = await fetch('/api/notifications/config', { headers: { Accept: 'application/json' } });
    const config = await response.json() as { enabled?: boolean; turnstileSiteKey?: string | null };
    externalEnabled = Boolean(response.ok && config.enabled && config.turnstileSiteKey);
    turnstileSiteKey = config.turnstileSiteKey ?? '';
    if (externalEnabled && !externalState.subscription) await ensureTurnstile();
    if (!externalEnabled && !externalState.subscription) {
      showMessage('Slack / Discord通知の新規登録は安全確認設定が利用できないため一時停止しています。既存設定の同期・解除には影響しません。', true);
    }
    render();
    void verifyRemote();
  } catch {
    render();
    showMessage('外部通知の設定状態を取得できませんでした。通信状態を確認してください。', true);
  }
};

void initialize();
