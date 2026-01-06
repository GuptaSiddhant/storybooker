import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import { ProjectsModel } from "../models/projects-model.ts";
import { ProjectIdSchema } from "../models/projects-schema.ts";
import { TagSchema } from "../models/tags-schema.ts";
import { WebhooksModel } from "../models/webhooks-model.ts";
import {
  WebhookCreateSchema,
  WebhooksGetResultSchema,
  WebhooksListResultSchema,
  WebhookUpdateSchema,
} from "../models/webhooks-schema.ts";
import { urlBuilder } from "../urls.ts";
import { authenticateOrThrow } from "../utils/auth.ts";
import { WEBHOOK_EVENTS } from "../utils/constants.ts";
import { mimes } from "../utils/mime-utils.ts";
import {
  openapiCommonErrorResponses,
  openapiErrorResponseContent,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils.ts";
import { checkIsHTMLRequest } from "../utils/request.ts";
import { getStore } from "../utils/store.ts";
import { createUIResultResponse } from "../utils/ui-utils.ts";

const webhooksTag = "Webhooks";
const projectIdPathParams = z.object({ projectId: ProjectIdSchema });
const webhookIdPathParams = z.object({
  projectId: ProjectIdSchema,
  webhookId: TagSchema._zod.def.shape.id,
});

/**
 * @private
 */
export const webhooksRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "List webhooks",
      method: "get",
      path: "/projects/{projectId}/webhooks",
      tags: [webhooksTag],
      request: {
        params: projectIdPathParams,
        query: z.object({ event: z.union([z.enum(WEBHOOK_EVENTS), z.literal("")]) }).partial(),
      },
      responses: {
        200: {
          description: "A list of webhooks in the project.",
          content: {
            [mimes.json]: { schema: WebhooksListResultSchema },
            ...openapiResponsesHtml,
          },
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      const { projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "read",
        projectId,
        resource: "project",
      });

      const { event } = context.req.valid("query");
      const webhooks = await new WebhooksModel(projectId).list();
      const filteredWebhooks = event
        ? webhooks.filter((tag) => tag.events?.includes(event))
        : webhooks;

      if (ui?.renderWebhooksListPage && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);

        return createUIResultResponse(context, ui.renderWebhooksListPage, {
          project,
          webhooks: filteredWebhooks,
          defaultEvent: event,
        });
      }

      return context.json({ webhooks: filteredWebhooks });
    },
  )
  .openapi(
    createRoute({
      summary: "Create webhook - UI",
      method: "get",
      path: "/projects/{projectId}/webhooks/create",
      tags: [webhooksTag],
      request: { params: projectIdPathParams },
      responses: {
        200: {
          description: "UI to create webhook",
          content: openapiResponsesHtml,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      if (!ui?.renderWebhookCreatePage) {
        throw new HTTPException(405, { message: "UI not available for this route." });
      }

      const { projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "project",
      });

      const project = await new ProjectsModel().get(projectId);

      return createUIResultResponse(context, ui.renderWebhookCreatePage, { project });
    },
  )
  .openapi(
    createRoute({
      summary: "Create webhook - action",
      method: "post",
      path: "/projects/{projectId}/webhooks/create",
      tags: [webhooksTag],
      request: {
        params: projectIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: WebhookCreateSchema } },
          required: true,
        },
      },
      responses: {
        201: {
          description: "Webhook created successfully",
          content: { [mimes.json]: { schema: WebhooksGetResultSchema } },
        },
        303: openapiResponseRedirect("Redirect to webhook."),
        409: {
          content: openapiErrorResponseContent,
          description: "Webhook already exists.",
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.valid("param");

      if (!(await new ProjectsModel().has(projectId))) {
        throw new HTTPException(404, { message: `The project '${projectId}' does not exist.` });
      }

      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "project",
      });

      const body = await context.req.parseBody({ dot: true, all: true });
      const data = WebhookCreateSchema.parse(WebhooksModel.sanitisePayload(body));

      const webhook = await new WebhooksModel(projectId).create(data);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.webhookDetails(projectId, webhook.id), 303);
      }

      return context.json({ webhook }, 201);
    },
  )
  .openapi(
    createRoute({
      summary: "Tag details",
      method: "get",
      path: "/projects/{projectId}/webhooks/{webhookId}",
      tags: [webhooksTag],
      request: { params: webhookIdPathParams },
      responses: {
        200: {
          description: "Details of the tag",
          content: {
            [mimes.json]: { schema: WebhooksGetResultSchema },
            ...openapiResponsesHtml,
          },
        },
        404: {
          description: "Matching tag not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      const { projectId, webhookId } = context.req.valid("param");

      authenticateOrThrow({
        action: "read",
        projectId,
        resource: "tag",
      });

      const webhook = await new WebhooksModel(projectId).get(webhookId);

      if (ui?.renderWebhookDetailsPage && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);

        return createUIResultResponse(context, ui.renderWebhookDetailsPage, {
          project,
          webhook,
        });
      }

      return context.json({ webhook });
    },
  )
  .openapi(
    createRoute({
      summary: "Delete webhook - action",
      method: "post",
      path: "/projects/{projectId}/webhooks/{webhookId}/delete",
      tags: [webhooksTag],
      request: { params: webhookIdPathParams },
      responses: {
        204: { description: "Webhook deleted successfully." },
        303: openapiResponseRedirect("Redirect to webhooks list."),
        404: {
          description: "Matching webhook not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId, webhookId } = context.req.valid("param");
      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "project",
      });

      await new WebhooksModel(projectId).delete(webhookId);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.webhooksList(projectId), 303);
      }

      return new Response(null, { status: 204 });
    },
  )
  .openapi(
    createRoute({
      summary: "Update webhook - UI",
      method: "get",
      path: "/projects/{projectId}/webhooks/{webhookId}/update",
      tags: [webhooksTag],
      request: { params: webhookIdPathParams },
      responses: {
        200: {
          description: "UI to update webhook",
          content: openapiResponsesHtml,
        },
        404: {
          description: "Matching webhook not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      if (!ui?.renderWebhookUpdatePage) {
        throw new HTTPException(405, { message: "UI not available for this route." });
      }

      const { webhookId, projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "tag",
      });

      const webhook = await new WebhooksModel(projectId).get(webhookId);
      const project = await new ProjectsModel().get(projectId);

      return createUIResultResponse(context, ui.renderWebhookUpdatePage, { project, webhook });
    },
  )
  .openapi(
    createRoute({
      summary: "Update webhook - action",
      method: "post",
      path: "/projects/{projectId}/webhooks/{webhookId}/update",
      tags: [webhooksTag],
      request: {
        params: webhookIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: WebhookUpdateSchema } },
          required: true,
        },
      },
      responses: {
        202: { description: "Webhook updated successfully" },
        303: openapiResponseRedirect("Redirect to webhook."),
        404: {
          description: "Matching project or webhook not found.",
          content: openapiErrorResponseContent,
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { webhookId, projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "project",
      });

      const body = await context.req.parseBody({ dot: true, all: true });
      const data = WebhookUpdateSchema.parse(WebhooksModel.sanitisePayload(body));

      await new WebhooksModel(projectId).update(webhookId, data);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.webhookDetails(projectId, webhookId), 303);
      }

      return new Response(null, { status: 202 });
    },
  )
  .openapi(
    createRoute({
      summary: "Test webhook - action",
      method: "post",
      path: "/projects/{projectId}/webhooks/{webhookId}/test",
      tags: [webhooksTag],
      request: {
        params: webhookIdPathParams,
        body: {
          content: {
            [mimes.formEncoded]: {
              schema: z.object({ event: z.enum(WEBHOOK_EVENTS), payload: z.unknown() }),
            },
          },
        },
      },
      responses: {
        204: { description: "Webhook request sent successfully" },
        404: {
          description: "Matching project or webhook not found.",
          content: openapiErrorResponseContent,
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { webhookId, projectId } = context.req.valid("param");
      const { event, payload } = context.req.valid("form");

      authenticateOrThrow({
        action: "read",
        projectId,
        resource: "project",
      });

      const webhookModel = new WebhooksModel(projectId);
      const webhook = await webhookModel.get(webhookId);

      const { ok, status, error } = await webhookModel.dispatchEventToHook(event, webhook, {
        payload,
      });

      if (!ok) {
        throw new HTTPException(status as ContentfulStatusCode, {
          message: `Failed to send test webhook: ${error ?? "Unknown error"}`,
        });
      }

      if (checkIsHTMLRequest(true)) {
        const redirectUrl =
          context.req.query("redirect") ?? urlBuilder.webhookDetails(projectId, webhookId);
        return context.redirect(redirectUrl, 303);
      }

      return new Response(null, { status });
    },
  );
