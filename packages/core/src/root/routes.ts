import { CONTENT_TYPES } from "#constants";
import { ProjectsModel } from "#projects/model";
import { defineRoute } from "#router";
import { getStore } from "#store";
import { URLS } from "#urls";
import { authenticateOrThrow } from "#utils/auth";
import {
  commonErrorResponses,
  responseError,
  responseHTML,
  responseRedirect,
} from "#utils/response";
import { urlJoin } from "#utils/url";
import { renderRootPage } from "./render";

export const root = defineRoute(
  "get",
  // oxlint-disable-next-line prefer-string-raw
  URLS.ui.root,
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
    tags: ["UI"],
  },
  async () => {
    const { headless, prefix } = getStore();
    if (headless) {
      return responseRedirect(urlJoin(prefix, "projects"), 301);
    }

    await authenticateOrThrow({
      action: "read",
      projectId: undefined,
      resource: "ui",
    });

    const projects = await new ProjectsModel().list({ limit: 5 });
    return responseHTML(renderRootPage({ projects }));
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

export const logout = defineRoute(
  "get",
  URLS.ui.logout,
  undefined,
  async () => {
    const { auth, request, user } = getStore();
    if (!auth?.logout || !user) {
      return responseError("Auth is not setup", 404);
    }

    return await auth.logout(request, user);
  },
);
