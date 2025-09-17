import { CONTENT_TYPES } from "#constants";
import { ProjectsModel } from "#projects/model";
import { defineRoute } from "#router";
import { getStore } from "#store";
import { URLS } from "#urls";
import { authenticateOrThrow } from "#utils/auth";
import { checkIsJSONRequest } from "#utils/request";
import {
  commonErrorResponses,
  responseError,
  responseHTML,
  responseRedirect,
} from "#utils/response";
import { urlJoin } from "#utils/url";
import z from "zod";
import { renderAccountPage, renderRootPage } from "./render";

const rootSchema = z.object({
  urls: z.record(z.string(), z.record(z.string(), z.url())),
});

export const root = defineRoute(
  "get",
  // oxlint-disable-next-line prefer-string-raw
  URLS.ui.root,
  {
    responses: {
      ...commonErrorResponses,
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
    const { headless, prefix, url } = getStore();

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

export const login = defineRoute("get", URLS.ui.login, undefined, async () => {
  const { auth, request, url } = getStore();
  if (!auth?.login) {
    return responseError("Auth is not setup", 404);
  }
  const serviceUrl = url.replace(URLS.ui.login, "");
  const response = await auth.login(request, serviceUrl);

  if (response.status >= 300 && response.status < 400) {
    return responseRedirect(
      response.headers.get("Location") || "/",
      response.status,
    );
  }

  return response;
});

export const logout = defineRoute(
  "get",
  URLS.ui.logout,
  undefined,
  async () => {
    const { auth, request, user } = getStore();
    if (!auth?.logout || !user) {
      return responseError("Auth is not setup", 404);
    }

    const response = await auth.logout(request, user);
    if (response.status >= 300 && response.status < 400) {
      return responseRedirect(
        response.headers.get("Location") || "/",
        response.status,
      );
    }

    return response;
  },
);

export const account = defineRoute(
  "get",
  URLS.ui.account,
  undefined,
  async () => {
    const { auth, request, user, url } = getStore();
    if (!auth) {
      return responseError("Auth is not setup", 404);
    }

    if (!user) {
      const serviceUrl = url.replace(URLS.ui.account, "");

      if (auth.login) {
        return await auth.login(request, serviceUrl);
      }

      return responseRedirect(serviceUrl, 404);
    }

    const children = await auth.renderAccount?.(request, user);

    return responseHTML(renderAccountPage({ children }));
  },
);
