import { CONTENT_TYPES, SERVICE_NAME } from "#constants";
import { ProjectsModel } from "#projects/model";
import { defineRoute } from "#router";
import { getStore } from "#store";
import { URLS } from "#urls";
import { authenticateOrThrow } from "#utils/auth";
import { checkIsJSONRequest } from "#utils/request";
import { commonErrorResponses, responseHTML } from "#utils/response";
import { urlJoin, urlSearchParamsToObject } from "#utils/url";
import z from "zod";
import { handleOpenAPIRoute } from "../handlers/handle-openapi-route";
import { handlePurge } from "../handlers/handle-purge";
import { handleServeStoryBook } from "../handlers/handle-serve-storybook";
import { renderRootPage } from "./render";

const rootSchema = z.object({
  urls: z.record(z.string(), z.record(z.string(), z.url())),
});

export const root = defineRoute(
  "get",
  // oxlint-disable-next-line prefer-string-raw
  URLS.ui.root,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
          [CONTENT_TYPES.JSON]: { schema: rootSchema },
        },
        description: "Root endpoint",
      },
      303: {
        description: "Redirects to all projects",
        headers: {
          Location: {
            description: "The URL to redirect to",
            schema: { format: "uri", type: "string" },
          },
        },
      },
      400: null,
    },
    summary: "Homepage",
    tags: ["UI"],
  },
  async () => {
    const { prefix, url } = getStore();

    if (checkIsJSONRequest()) {
      const urls: z.infer<typeof rootSchema>["urls"] = {};
      for (const [key, group] of Object.entries(URLS)) {
        urls[key] = {};
        for (const [subkey, path] of Object.entries(group)) {
          urls[key][subkey] = urlJoin(url, prefix, path);
        }
      }

      const data: z.infer<typeof rootSchema> = { urls };
      return Response.json(data, { status: 200 });
    }

    await authenticateOrThrow({
      action: "read",
      projectId: undefined,
      resource: "ui",
    });

    const projects = await new ProjectsModel().list({ limit: 5 });
    return await responseHTML(renderRootPage({ projects }));
  },
);

export const health = defineRoute(
  "get",
  URLS.ui.health,
  {
    responses: { 200: { description: "Service is healthy." } },
    summary: "Health check",
  },
  () => new Response("Service is Healthy", { status: 200 }),
);

export const serveStorybook = defineRoute(
  "get",
  "_/:projectId/:buildSHA/*",
  {
    overridePath: ":projectId/:buildSHA/:filepath",
    requestParams: {
      path: z.object({
        buildSHA: z.string(),
        filepath: z.string(),
        projectId: z.string(),
      }),
    },
    responses: { 200: { summary: "Serving the uploaded file" } },
    summary: "Serve StoryBook",
    tags: ["Serve"],
  },
  async ({ params }) => {
    const { buildSHA, projectId, "*": filepath = "index.html" } = params;
    return await handleServeStoryBook({ buildSHA, filepath, projectId });
  },
);

export const openapi = defineRoute(
  "get",
  URLS.ui.openapi,
  {
    responses: {
      200: {
        content: {
          [CONTENT_TYPES.JSON]: {
            example: { info: { title: SERVICE_NAME }, openapi: "3.1.0" },
          },
          [CONTENT_TYPES.HTML]: {
            encoding: "utf8",
            example: "<!DOCTYPE html>",
            schema: { type: "string" },
          },
        },
      },
    },
    summary: "OpenAPI spec",
  },
  handleOpenAPIRoute,
);

const purgeSearchParams = z.object({ project: z.string().optional() }).loose();
export const purge = defineRoute(
  "post",
  URLS.ui.purge,
  {
    requestParams: { query: purgeSearchParams },
    responses: { 204: { description: "Purge complete" } },
    summary: "Purge old data",
  },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const { project: projectId } = purgeSearchParams.parse(
      urlSearchParamsToObject(searchParams),
    );

    await authenticateOrThrow({
      action: "update",
      projectId,
      resource: "project",
    });
    await authenticateOrThrow({
      action: "delete",
      projectId,
      resource: "build",
    });
    await authenticateOrThrow({
      action: "delete",
      projectId,
      resource: "label",
    });

    await handlePurge({ projectId }, {});

    return new Response(null, { status: 204 });
  },
);
