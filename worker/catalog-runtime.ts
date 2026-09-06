import type { NotificationCatalog } from './notification-core.ts';
import type { PublicCatalog } from './public-api.ts';
import type { WorkerRuntimeEnv } from './runtime-types.ts';

export async function loadCatalog(env: WorkerRuntimeEnv): Promise<NotificationCatalog & PublicCatalog> {
  const response = await env.ASSETS.fetch(new Request('https://assets.local/my-eol-data.json'));
  if (!response.ok) throw new Error(`catalog_fetch_${response.status}`);
  return response.json() as Promise<NotificationCatalog & PublicCatalog>;
}
