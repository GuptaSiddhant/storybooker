import { getStore } from "./store";

export const WEBHOOK_EVENTS = [
  "build:created",
  "build:deleted",
  "build:updated",
  "project:created",
  "project:deleted",
  "project:updated",
  "tag:created",
  "tag:deleted",
  "tag:updated",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Webhook event to their corresponding URL.
 */
export interface WebhookEntry {
  url: string;
  headers?: Record<string, string>;
  events?: WebhookEvent[];
}

export async function dispatchWebhooks(
  event: WebhookEvent,
  options: {
    projectId: string;
    payload: Record<string, unknown>;
    timeoutMs?: number;
    projectHooks?: WebhookEntry[];
  },
): Promise<void> {
  const { logger, config } = getStore();
  const { projectId, payload, timeoutMs = 5000, projectHooks = [] } = options;

  const configHooks =
    config?.webhooks?.filter((hook) => !hook.events || hook.events.includes(event)) ?? [];
  const allHooks = [...configHooks, ...projectHooks];

  if (!allHooks || allHooks.length === 0) {
    return;
  }

  // Run in parallel but don't throw — we only want best-effort delivery here
  await Promise.allSettled(
    allHooks.map(async (hook) => {
      const { url, headers } = hook;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { ...headers, "content-type": "application/json", "x-webhook-event": event },
          body: JSON.stringify({ event, projectId, payload }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        logger?.log?.("[webhook] (%s) %s - %s", event, url, res.status);
        return { url, ok: res.ok, status: res.status };
      } catch (error) {
        logger?.error?.("[webhook] ERROR (%s) %s - $s", event, url, error);
        return { url, ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    }),
  );
}
