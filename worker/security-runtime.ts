import runtime from './index';
import { withDynamicSecurityHeaders } from './security-headers';

type FetchRequest = Parameters<typeof runtime.fetch>[0];
type FetchEnv = Parameters<typeof runtime.fetch>[1];
type ScheduledController = Parameters<typeof runtime.scheduled>[0];
type ScheduledEnv = Parameters<typeof runtime.scheduled>[1];

export default {
  async fetch(request: FetchRequest, env: FetchEnv): Promise<Response> {
    return withDynamicSecurityHeaders(await runtime.fetch(request, env));
  },

  async scheduled(controller: ScheduledController, env: ScheduledEnv): Promise<void> {
    await runtime.scheduled(controller, env);
  }
};
