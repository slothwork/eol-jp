import {
  EMAIL_NOTIFICATION_STORAGE_KEY,
  MAX_EMAIL_NOTIFICATION_ITEMS,
  buildEmailNotificationPayload,
  clearEmailNotificationSubscription,
  emailNotificationNeedsSync,
  emptyEmailNotificationState,
  markEmailNotificationSynced,
  parseEmailNotificationState,
  serializeEmailNotificationState,
  setEmailNotificationSubscription,
  type EmailNotificationState
} from '@/lib/email-notifications';
import { EOL_REMINDER_STORAGE_KEY, parseEolReminderState } from '@/lib/eol-reminders';
import { TRACKED_PRODUCTS_STORAGE_KEY, parseTrackedProducts } from '@/lib/tracked-products';
import { getTurnstile, loadTurnstile } from './turnstile';

const summary = document.querySelector<HTMLElement>('[data-email-summary]');
const message = document.querySelector<HTMLElement>('[data-email-message]');
const requestForm = document.querySelector<HTMLFormElement>('[data-email-request-form]');
const verifyForm = document.querySelector<HTMLFormElement>('[data-email-verify-form]');
const configured = document.querySelector<HTMLElement>('[data-email-configured]');
const emailInput = document.querySelector<HTMLInputElement>('[data-email-address]');
const codeInput = document.querySelector<HTMLInputElement>('[data-email-code]');
const requestButton = document.querySelector<HTMLButtonElement>('[data-email-request-button]');
const verifyButton = document.querySelector<HTMLButtonElement>('[data-email-verify-button]');
const cancelVerify = document.querySelector<HTMLButtonElement>('[data-email-cancel-verify]');
const verifyTarget = document.querySelector<HTMLElement>('[data-email-verify-target]');
const addressLabel = document.querySelector<HTMLElement>('[data-email-address-label]');
const statusText = document.querySelector<HTMLElement>('[data-email-status]');
const syncBadge = document.querySelector<HTMLElement>('[data-email-sync-badge]');
const syncButton = document.querySelector<HTMLButtonElement>('[data-email-sync]');
const deleteButton = document.querySelector<HTMLButtonElement>('[data-email-delete]');
const turnstileContainer = document.querySelector<HTMLElement>('[data-email-turnstile]');

let emailState: EmailNotificationState = emptyEmailNotificationState();
let emailEnabled = false;
let turnstileToken = '';
let turnstileWidgetId: string | null = null;
let challengeId: string | null = null;

const readPayload = () => {
  const tracked = parseTrackedProducts(localStorage.getItem(TRACKED_PRODUCTS_STORAGE_KEY));
  const reminders = parseEolReminderState(localStorage.getItem(EOL_REMINDER_STORAGE_KEY));
  return buildEmailNotificationPayload(tracked, reminders);
};

const showMessage = (text: string, isError = false) => {
  if (!message) return;
  message.hidden = false;
  message.textContent = text;
  message.classList.toggle('email-message-error', isError);
};

const clearMessage = () => {
  if (message) message.hidden = true;
};

const persist = () => localStorage.setItem(EMAIL_NOTIFICATION_STORAGE_KEY, serializeEmailNotificationState(emailState));

const errorText = (error: string) => ({
  email_notifications_unconfigured: 'メール通知はまだ本番設定されていません。',
  invalid_email: 'メールアドレスを確認してください。',
  turnstile_failed: 'ボット確認に失敗しました。もう一度お試しください。',
  verification_rate_limited: '確認コードの送信回数上限に達しました。時間を空けてお試しください。',
  email_daily_limit_reached: '本日のメール送信上限に達しました。明日もう一度お試しください。',
  email_send_failed: '確認メールを送信できませんでした。送信設定を確認してください。',
  verification_not_found: '確認コードの有効期限が切れています。最初からやり直してください。',
  verification_expired: '確認コードの有効期限が切れています。最初からやり直してください。',
  verification_code_mismatch: '確認コードが一致しません。',
  verification_locked: '確認コードの入力上限に達しました。最初からやり直してください。',
  unauthorized: 'このブラウザの管理情報が無効です。通知設定を登録し直してください。',
  too_many_tracked_items: `メール通知は最大${MAX_EMAIL_NOTIFICATION_ITEMS}製品までです。`
} as Record<string, string>)[error] ?? '処理に失敗しました。時間を空けてお試しください。';

const resetTurnstile = () => {
  turnstileToken = '';
  const api = getTurnstile();
  if (api && turnstileWidgetId) api.reset(turnstileWidgetId);
};

const updateUi = () => {
  const payload = readPayload();
  const subscription = emailState.subscription;
  if (summary) {
    if (payload.items.length === 0) summary.textContent = '先に製品ページで利用中バージョンを1件以上保存してください。';
    else if (payload.items.length > MAX_EMAIL_NOTIFICATION_ITEMS) summary.textContent = `メール通知は最大${MAX_EMAIL_NOTIFICATION_ITEMS}製品までです。現在${payload.items.length}件保存されています。`;
    else if (payload.thresholds.length === 0) summary.textContent = '30 / 90 / 180日前のリマインダーを1つ以上有効にしてください。';
    else summary.textContent = `${payload.items.length}製品を ${payload.thresholds.map((value) => `${value}日前`).join('・')} に通知します。`;
  }

  const usable = emailEnabled && payload.items.length > 0 && payload.items.length <= MAX_EMAIL_NOTIFICATION_ITEMS && payload.thresholds.length > 0;
  if (requestButton) requestButton.disabled = !usable;

  if (!subscription) {
    if (configured) configured.hidden = true;
    if (requestForm && !challengeId) requestForm.hidden = !emailEnabled;
    return;
  }

  if (requestForm) requestForm.hidden = true;
  if (verifyForm) verifyForm.hidden = true;
  if (configured) configured.hidden = false;
  if (addressLabel) addressLabel.textContent = `通知先: ${subscription.emailMasked}`;
  const needsSync = emailNotificationNeedsSync(emailState, payload);
  if (syncBadge) {
    syncBadge.textContent = needsSync ? '同期が必要' : '同期済み';
    syncBadge.classList.toggle('status-warning', needsSync);
    syncBadge.classList.toggle('status-supported', !needsSync);
  }
  if (statusText) statusText.textContent = `最終同期: ${new Date(subscription.syncedAt).toLocaleString('ja-JP')}`;
  if (syncButton) syncButton.disabled = !usable || !needsSync;
};

const initialize = async () => {
  emailState = parseEmailNotificationState(localStorage.getItem(EMAIL_NOTIFICATION_STORAGE_KEY));
  try {
    const response = await fetch('/api/notifications/email/config', { headers: { Accept: 'application/json' } });
    const config = await response.json() as { enabled?: boolean; turnstileSiteKey?: string | null };
    emailEnabled = Boolean(response.ok && config.enabled && config.turnstileSiteKey);
    if (!emailEnabled) {
      if (summary) summary.textContent = 'メール通知は準備中です。Resend / Turnstileの本番設定後に利用できます。Slack / Discord通知は引き続き利用できます。';
      updateUi();
      return;
    }

    if (!emailState.subscription && turnstileContainer && config.turnstileSiteKey) {
      const api = await loadTurnstile();
      turnstileWidgetId = api.render(turnstileContainer, {
        sitekey: config.turnstileSiteKey,
        action: 'email_notification',
        theme: 'auto',
        callback: (token: string) => { turnstileToken = token; },
        'expired-callback': () => { turnstileToken = ''; },
        'error-callback': () => { turnstileToken = ''; }
      });
    }

    if (emailState.subscription) {
      const { id, token } = emailState.subscription;
      const response = await fetch(`/api/notifications/email/subscriptions/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (response.status === 404 || response.status === 401) {
        emailState = clearEmailNotificationSubscription();
        persist();
      } else if (response.ok) {
        const data = await response.json() as { emailMasked?: string };
        if (data.emailMasked && emailState.subscription) emailState.subscription.emailMasked = data.emailMasked;
      }
    }
  } catch {
    showMessage('メール通知の設定状態を取得できませんでした。', true);
  }
  updateUi();
};

requestForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  const payload = readPayload();
  const email = emailInput?.value.trim() ?? '';
  if (!turnstileToken) {
    showMessage('ボット確認の完了を待ってから送信してください。', true);
    return;
  }
  if (requestButton) requestButton.disabled = true;
  try {
    const response = await fetch('/api/notifications/email/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, turnstileToken, ...payload })
    });
    const data = await response.json() as { challengeId?: string; emailMasked?: string; error?: string };
    resetTurnstile();
    if (!response.ok || !data.challengeId) {
      showMessage(errorText(data.error ?? ''), true);
      return;
    }
    challengeId = data.challengeId;
    if (verifyTarget) verifyTarget.textContent = data.emailMasked ?? '入力したメールアドレス';
    if (requestForm) requestForm.hidden = true;
    if (verifyForm) verifyForm.hidden = false;
    codeInput?.focus();
    showMessage('確認コードを送信しました。');
  } catch {
    resetTurnstile();
    showMessage('確認メールの送信に失敗しました。', true);
  } finally {
    updateUi();
  }
});

verifyForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  if (!challengeId) return;
  if (verifyButton) verifyButton.disabled = true;
  try {
    const response = await fetch('/api/notifications/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ challengeId, code: codeInput?.value.trim() ?? '' })
    });
    const data = await response.json() as { id?: string; token?: string; emailMasked?: string; error?: string };
    if (!response.ok || !data.id || !data.token || !data.emailMasked) {
      showMessage(errorText(data.error ?? ''), true);
      if (data.error === 'verification_expired' || data.error === 'verification_not_found' || data.error === 'verification_locked') {
        challengeId = null;
        if (verifyForm) verifyForm.hidden = true;
        if (requestForm) requestForm.hidden = false;
        resetTurnstile();
      }
      return;
    }
    const payload = readPayload();
    emailState = setEmailNotificationSubscription(
      emptyEmailNotificationState(),
      { id: data.id, token: data.token, emailMasked: data.emailMasked },
      payload
    );
    persist();
    challengeId = null;
    if (codeInput) codeInput.value = '';
    showMessage('メール通知を登録しました。');
  } catch {
    showMessage('確認処理に失敗しました。', true);
  } finally {
    if (verifyButton) verifyButton.disabled = false;
    updateUi();
  }
});

cancelVerify?.addEventListener('click', () => {
  challengeId = null;
  if (verifyForm) verifyForm.hidden = true;
  if (requestForm) requestForm.hidden = false;
  if (codeInput) codeInput.value = '';
  resetTurnstile();
  clearMessage();
  updateUi();
});

syncButton?.addEventListener('click', async () => {
  const subscription = emailState.subscription;
  if (!subscription) return;
  clearMessage();
  const payload = readPayload();
  if (syncButton) syncButton.disabled = true;
  try {
    const response = await fetch(`/api/notifications/email/subscriptions/${encodeURIComponent(subscription.id)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${subscription.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      showMessage(errorText(data.error ?? ''), true);
      return;
    }
    emailState = markEmailNotificationSynced(emailState, payload);
    persist();
    showMessage('メール通知を現在のマイEOLと同期しました。');
  } catch {
    showMessage('同期に失敗しました。', true);
  } finally {
    updateUi();
  }
});

deleteButton?.addEventListener('click', async () => {
  const subscription = emailState.subscription;
  if (!subscription) return;
  clearMessage();
  if (deleteButton) deleteButton.disabled = true;
  try {
    const response = await fetch(`/api/notifications/email/subscriptions/${encodeURIComponent(subscription.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${subscription.token}` }
    });
    if (!response.ok && response.status !== 204) {
      const data = await response.json() as { error?: string };
      showMessage(errorText(data.error ?? ''), true);
      return;
    }
    emailState = clearEmailNotificationSubscription();
    persist();
    showMessage('メール通知を解除しました。');
  } catch {
    showMessage('メール通知を解除できませんでした。', true);
  } finally {
    if (deleteButton) deleteButton.disabled = false;
    updateUi();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === TRACKED_PRODUCTS_STORAGE_KEY || event.key === EOL_REMINDER_STORAGE_KEY) updateUi();
});

void initialize();
