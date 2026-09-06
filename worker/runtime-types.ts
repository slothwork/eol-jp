import type { EmailKvNamespace, EmailRuntimeEnv } from './email-runtime.ts';

export type WorkerKvNamespace = EmailKvNamespace;

export type WorkerRuntimeEnv = EmailRuntimeEnv & {
  ASSETS: { fetch(request: Request): Promise<Response> };
  NOTIFICATION_SUBSCRIPTIONS?: WorkerKvNamespace;
};
