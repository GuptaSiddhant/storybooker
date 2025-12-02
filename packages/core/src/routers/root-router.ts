import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import z from "zod";
import { handleServeStoryBook } from "../handlers/handle-serve-storybook";
import { ProjectsModel } from "../models/projects-model";
import { mimes } from "../utils/mime-utils";
import { openapiResponsesHtml } from "../utils/openapi-utils";
import { checkIsJSONRequest } from "../utils/request";
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
            ...openapiResponsesHtml,
            [mimes.json]: { schema: z.object({}) },
          },
          description: "Render homepage or return a list of endpoint-urls.",
        },
      },
    }),
    async (context) => {
      const { ui } = getStore();

      if (checkIsJSONRequest()) {
        return context.json({});
      }

      if (!ui) {
        return context.notFound();
      }

      const projects = await new ProjectsModel().list({ limit: 5 });

      return context.html(ui.renderHomePage({ projects }, createUIAdapterOptions()));
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
