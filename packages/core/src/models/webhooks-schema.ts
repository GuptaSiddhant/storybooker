import { z } from "@hono/zod-openapi";
import { WEBHOOK_EVENTS } from "../utils/constants.ts";

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type WebhookType = z.infer<typeof WebhookSchema>;
export const WebhookSchema = z
  .object({
    id: z.uuid().meta({ description: "The unique identifier for the webhook." }),
    url: z.string().url().meta({ description: "The URL to send the webhook to." }),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .meta({ description: "Optional headers to include in the webhook request." }),
    events: z.enum(WEBHOOK_EVENTS).array().optional().meta({
      description: "The events that will trigger the webhook.",
    }),
    createdAt: z.iso.datetime().default(new Date().toISOString()),
    updatedAt: z.iso.datetime().default(new Date().toISOString()),
  })
  .meta({ id: "Webhook", title: "StoryBooker Webhook" });

export type WebhookCreateType = z.infer<typeof WebhookCreateSchema>;
export const WebhookCreateSchema = WebhookSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WebhookUpdateType = z.infer<typeof WebhookUpdateSchema>;
export const WebhookUpdateSchema = WebhookCreateSchema.partial();

export type WebhooksListResultType = z.infer<typeof WebhooksListResultSchema>;
export const WebhooksListResultSchema = z.object({
  webhooks: WebhookSchema.array(),
});
export type WebhooksGetResultType = z.infer<typeof WebhooksGetResultSchema>;
export const WebhooksGetResultSchema = z.object({
  webhook: WebhookSchema,
});
