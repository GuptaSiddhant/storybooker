import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import z from "zod";
import { handleServeStoryBook } from "../handlers/handle-serve-storybook";
import { ProjectsModel } from "../models/projects-model";
import { UrlBuilder, urlBuilder } from "../urls";
import { SERVICE_NAME } from "../utils";
import { authenticateOrThrow } from "../utils/auth";
import { mimes } from "../utils/mime-utils";
import { openapiResponsesHtml } from "../utils/openapi-utils";
import { checkIsHTMLRequest } from "../utils/request";
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";

/**
 * @private
 */
export const rootRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "Homepage",
      method: "get",
      path: "/",
      responses: {
        200: {
          content: {
            [mimes.json]: {
              schema: z.object({
                name: z.string(),
                adapters: z.record(z.string(), z.object({ name: z.string() })),
                config: z.record(z.string(), z.unknown()),
                urls: z.record(z.string(), z.string()),
              }),
            },
            ...openapiResponsesHtml,
          },
          description: "Render homepage or return a list of endpoint-urls.",
        },
      },
    }),
    async (context) => {
      const { auth, database, logger, storage, ui, config } = getStore();

      if (ui?.renderHomePage && checkIsHTMLRequest(true)) {
        await authenticateOrThrow({ action: "read", resource: "project", projectId: undefined });
        const projects = await new ProjectsModel().list({ limit: 5 });

        return context.html(ui.renderHomePage({ projects }, createUIAdapterOptions()));
      }

      const urls: Record<string, string> = {};
      for (const urlKey of Object.getOwnPropertyNames(UrlBuilder.prototype)) {
        const func = urlBuilder[urlKey as keyof UrlBuilder];
        if (urlKey === "constructor" || typeof func !== "function") {
          continue;
        }

        const keyword = "ARG0REMOVE";
        const url = (func as (...args: string[]) => string).call(urlBuilder, keyword);
        if (url.includes(keyword)) {
          continue;
        }

        urls[urlKey] = url;
      }

      return context.json({
        name: SERVICE_NAME,
        adapters: {
          auth: auth?.metadata,
          database: database.metadata,
          logger: logger.metadata,
          storage: storage.metadata,
          ui: ui?.metadata,
        },
        config: {
          ...config,
          middlewares: config?.middlewares?.map((mw) => mw.name),
          errorParser: undefined,
        },
        urls,
      });
    },
  )
  .openapi(
    createRoute({
      summary: "Health check",
      method: "get",
      path: "/health",
      responses: {
        200: { description: "Health check status" },
      },
    }),
    (context) => {
      return context.text("Service is healthy.");
    },
  )
  .openapi(
    createRoute({
      summary: "Serve build files",
      method: "get",
      path: "_/{projectId}/{buildId}/{filepath{.+}}",
      request: {
        params: z.object({
          projectId: z.string(),
          buildId: z.string(),
          filepath: z.string(),
        }),
        query: z
          .object({
            id: z.string(),
            path: z.string(),
            viewMode: z.enum(["story"]),
          })
          .partial(),
      },
      responses: {
        200: {
          description: "Serving the uploaded file",
          content: { "*/*": { schema: z.string() } },
        },
      },
    }),
    (context) => {
      const { buildId, filepath, projectId } = context.req.param();
      return handleServeStoryBook({ buildId, filepath, projectId });
    },
  );
