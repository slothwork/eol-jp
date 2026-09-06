import { loadCatalog } from './catalog-runtime.ts';
import { handleEmailApi, runEmailNotifications } from './email-runtime.ts';
import {
  handleExternalNotificationApi,
  runExternalNotifications
} from './external-notification-runtime.ts';
import { handleBadge, handlePublicApi } from './public-api-runtime.ts';
import type { WorkerRuntimeEnv } from './runtime-types.ts';

export default {
  async fetch(request: Request, env: WorkerRuntimeEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/notifications/email/')) return handleEmailApi(request, env);
    if (url.pathname.startsWith('/api/notifications/')) return handleExternalNotificationApi(request, env);
    if (url.pathname.startsWith('/api/v1/')) return handlePublicApi(request, env);
    if (url.pathname.startsWith('/badge/')) return handleBadge(request, env);
    return env.ASSETS.fetch(request);
  },

  async scheduled(controller: { scheduledTime: number }, env: WorkerRuntimeEnv): Promise<void> {
    if (!env.NOTIFICATION_SUBSCRIPTIONS) return;
    const catalog = await loadCatalog(env);
    const now = new Date(controller.scheduledTime);
    await runExternalNotifications(env, catalog, now);
    await runEmailNotifications(env, catalog, now);
  }
};
