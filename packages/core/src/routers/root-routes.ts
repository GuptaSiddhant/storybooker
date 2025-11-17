import z from "zod";
import { handleOpenAPIRoute } from "../handlers/handle-openapi-route";
import { handleServeStoryBook } from "../handlers/handle-serve-storybook";
import { ProjectsModel } from "../models/projects-model";
import { renderRootPage } from "../ui/root-pages";
import { URLS } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { mimes } from "../utils/mime-utils";
import { checkIsJSONRequest } from "../utils/request";
import { commonErrorResponses, responseHTML } from "../utils/response";
import { defineRoute } from "../utils/router-utils";
import { getStore } from "../utils/store";
import { urlJoin } from "../utils/url";

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
          [mimes.html]: { example: "<!DOCTYPE html>" },
          [mimes.json]: { schema: rootSchema },
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
    tags: ["UI"],
  },
  () => new Response("Service is Healthy", { status: 200 }),
);

export const serveStorybook = defineRoute(
  "get",
  "_/:projectId/:buildSHA/*filepath",
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
    tags: ["UI"],
  },
  async ({ params }) => {
    const { buildSHA, projectId, filepath } = params;
    return await handleServeStoryBook({ buildSHA, filepath, projectId });
  },
);

export const openapi = defineRoute(
  "get",
  URLS.ui.openapi,
  undefined,
  handleOpenAPIRoute,
);
