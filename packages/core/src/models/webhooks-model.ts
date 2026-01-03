import type { WebhookEvent } from "../types.ts";
import { generateDatabaseCollectionId } from "../utils/adapter-utils.ts";
import { checkAuthorisation } from "../utils/auth.ts";
import { getStore } from "../utils/store.ts";
import {
  type WebhookCreateType,
  WebhookSchema,
  type WebhookUpdateType,
  type WebhookType,
} from "./webhooks-schema.ts";
import { Model, type BaseModel, type ListOptions } from "./~model.ts";

export type { WebhookType, WebhookEvent };

export class WebhooksModel extends Model<WebhookType> {
  constructor(projectId: string) {
    super(projectId, generateDatabaseCollectionId(projectId, "Webhooks"));
  }

  async list(options: ListOptions<WebhookType> = {}): Promise<WebhookType[]> {
    this.log("List webhooks...");
    const items = await this.database.listDocuments(this.collectionId, options, this.dbOptions);

    return WebhookSchema.array().parse(items);
  }

  async create(data: WebhookCreateType): Promise<WebhookType> {
    this.log("Create webhook '%s'...", data.url);

    const now = new Date().toISOString();
    const webhook: WebhookType = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await this.database.createDocument(this.collectionId, webhook, this.dbOptions);

    return webhook;
  }

  async get(id: string): Promise<WebhookType> {
    this.log("Get webhook '%s'...", id);
    const item = await this.database.getDocument(this.collectionId, id, this.dbOptions);

    return WebhookSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check webhook '%s'...", id);
    try {
      return await this.database.hasDocument(this.collectionId, id, this.dbOptions);
    } catch {
      return false;
    }
  }

  async update(id: string, data: WebhookUpdateType): Promise<void> {
    this.log("Update webhook '%s'...", id);
    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...data, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );
  }

  async delete(id: string): Promise<void> {
    this.log("Delete webhook '%s'...", id);
    await this.database.deleteDocument(this.collectionId, id, this.dbOptions);
  }

  checkAuth(): boolean {
    return checkAuthorisation({ projectId: this.projectId, action: "update", resource: "project" });
  }

  id: BaseModel<WebhookType>["id"] = (id: string) => {
    return {
      checkAuth: this.checkAuth.bind(this),
      delete: this.delete.bind(this, id),
      get: this.get.bind(this, id),
      has: this.has.bind(this, id),
      id,
      update: this.update.bind(this, id),
    };
  };

  async dispatchEvent(
    event: WebhookEvent,
    payload: Record<string, unknown>,
    options?: { skipProjectHooks?: boolean; timeoutMs?: number },
  ): Promise<void> {
    const { logger, config } = getStore();
    const { skipProjectHooks, timeoutMs = 5000 } = options ?? {};

    const configHooks =
      config?.webhooks?.filter((hook) => !hook.events || hook.events.includes(event)) ?? [];
    const projectHooks: WebhookType[] = skipProjectHooks
      ? []
      : await this.list().catch((error) => {
          logger?.error?.(error);
          return [];
        });

    const allHooks: WebhookCreateType[] = [...configHooks, ...projectHooks];

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
            body: JSON.stringify({ event, projectId: this.projectId, payload }),
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
}
