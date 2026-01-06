import type { WebhookEvent } from "../types.ts";
import { generateDatabaseCollectionId } from "../utils/adapter-utils.ts";
import { checkAuthorisation } from "../utils/auth.ts";
import { decrypt, encrypt, generateHMAC } from "../utils/crypto-utils.ts";
import { getStore } from "../utils/store.ts";
import {
  WebhookSchema,
  type WebhookCreateType,
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
      createdAt: now,
      updatedAt: now,
    };
    await this.database.createDocument(this.collectionId, webhook, this.dbOptions);

    return webhook;
  }

  async get(id: string): Promise<WebhookType> {
    this.log("Get webhook '%s'...", id);
    const item = await this.database.getDocument(this.collectionId, id, this.dbOptions);

    const { config } = getStore();
    const webhook = WebhookSchema.parse(item);
    webhook.secret = config?.secret ? decrypt(config.secret, webhook.secret) : webhook.secret;

    return webhook;
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
    payload: unknown,
    options?: { skipProjectHooks?: boolean; timeoutMs?: number },
  ): Promise<void> {
    const { logger, config } = getStore();
    const { skipProjectHooks, timeoutMs = 5000 } = options ?? {};

    const configHooks =
      config?.webhooks?.filter((hook) => !hook.events || hook.events.includes(event)) ?? [];
    const projectHooks: WebhookType[] = skipProjectHooks
      ? []
      : await this.list().catch((error: unknown) => {
          logger?.error?.(error);
          return [];
        });

    const allHooks: WebhookCreateType[] = [...configHooks, ...projectHooks];

    if (!allHooks || allHooks.length === 0) {
      return;
    }

    // Run in parallel but don't throw — we only want best-effort delivery here
    await Promise.allSettled(
      allHooks.map((hook) => this.dispatchEventToHook(event, hook, { payload, timeoutMs })),
    );
  }

  async dispatchEventToHook(
    event: WebhookEvent,
    hook: WebhookCreateType,
    options: { payload: unknown; timeoutMs?: number },
  ): Promise<{ url: string; ok: boolean; status: number; error?: string }> {
    const { logger } = getStore();
    const { timeoutMs = 5000, payload } = options;
    const { id, url, secret } = hook;
    const body = JSON.stringify({ event, projectId: this.projectId, payload });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-id": id,
          "x-webhook-event": event,
          "x-webhook-project-id": this.projectId,
          "x-webhook-signature": generateHMAC(secret, body),
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      logger?.log?.("[webhook] (%s) %s - %s", event, id, res.status);
      return { url, ok: res.ok, status: res.status };
    } catch (error) {
      logger?.error?.("[webhook] ERROR (%s) %s - $s", event, id, error);
      return {
        url,
        ok: false,
        status: 500,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  static sanitisePayload(payload: Record<string, unknown>): Record<string, unknown> {
    const store = getStore();
    const secret = store.config?.secret;

    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const bodySecretValue = payload?.["secret"];
    if (bodySecretValue && typeof bodySecretValue === "string" && secret) {
      payload["secret"] = encrypt(secret, bodySecretValue);
    }

    const bodyEventsValue = payload?.["events"];
    if (typeof bodyEventsValue === "string") {
      payload["events"] = [bodyEventsValue];
    }

    /**
     * Convert headers from this format:
        ```js
        headers: [Object: null prototype] {
          "0": [Object: null prototype] { name: "Authorization", value: "xas" },
          "1": [Object: null prototype] { name: "", value: "" },
          "2": [Object: null prototype] { name: "", value: "" }
        }
        ```
     * to this format:
        `headers: { "Authorization": "xas" }`
    */
    const bodyHeadersValue = payload?.["headers"];
    if (bodyHeadersValue && typeof bodyHeadersValue === "object") {
      const headersValue: Record<string, string> = {};
      for (const key of Object.keys(bodyHeadersValue)) {
        const valueObj: unknown = (bodyHeadersValue as Record<string, unknown>)[key];
        if (valueObj && typeof valueObj === "object" && "name" in valueObj && "value" in valueObj) {
          const { name, value } = valueObj;
          if (value && name && typeof name === "string" && typeof value === "string") {
            headersValue[name] = secret ? encrypt(secret, value) : value;
          }
        }
      }

      payload["headers"] = headersValue;
    }

    return payload;
  }
}
