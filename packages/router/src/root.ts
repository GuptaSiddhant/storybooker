import { CONTENT_TYPES } from "#constants";
import { getStore } from "#store";
import { defineRoute } from "#utils/api-router";
import { authenticateOrThrow } from "#utils/auth";
import {
  commonErrorResponses,
  responseHTML,
  responseRedirect,
} from "#utils/response";
import { urlJoin } from "#utils/url";

export const root = defineRoute(
  "get",
  // oxlint-disable-next-line prefer-string-raw
  "/",
  {
    responses: {
      ...commonErrorResponses,
      200: {
        content: { [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" } },
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
  },
  async ({ params }) => {
    const { headless, prefix } = getStore();
    if (headless) {
      return responseRedirect(urlJoin(prefix, "projects"), 301);
    }

    await authenticateOrThrow(["ui:read:"]);
    return responseHTML(
      `<html><body><h1>Hello from Router!</h1><pre>${JSON.stringify(params)}<pre></body></html>`,
    );
  },
);

export const health = defineRoute(
  "get",
  "health",
  {
    responses: { 200: { description: "Service is healthy." } },
    summary: "Health check",
  },
  () => new Response("Service is Healthy", { status: 200 }),
);
