import path from "node:path";
import { CACHE_CONTROL_PUBLIC_YEAR, HEADERS, SERVICE_NAME } from "#constants";
import { getStore } from "#store";
import { defineRoute } from "#utils/api-router";
import { authenticateOrThrow } from "#utils/auth";
import { getMimeType } from "#utils/mime-utils";
import { generateProjectContainerName } from "#utils/shared-model";
import { urlBuilder } from "#utils/url-builder";
import z from "zod";

export const serveStorybook = defineRoute(
  "get",
  ":projectId/:buildSHA/*",
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
  async ({ params, request }) => {
    const { buildSHA, projectId } = params;
    const { storage } = getStore();
    const { pathname } = new URL(request.url);
    const filepath = pathname.split(`${buildSHA}/`).at(1) || "index.html";

    const containerFilepath = path.posix.join(buildSHA, filepath);
    await authenticateOrThrow([
      { action: "read", projectId, resource: "build" },
    ]);

    const response = await storage.downloadFile(
      generateProjectContainerName(projectId),
      containerFilepath,
    );
    response.headers.append(HEADERS.cacheControl, CACHE_CONTROL_PUBLIC_YEAR);

    if (!filepath.endsWith("index.html")) {
      if (!response.headers.has(HEADERS.contentType)) {
        response.headers.set(HEADERS.contentType, getMimeType(filepath));
      }
      return response;
    }

    // Appending custom UI to index.html
    const content = await response.clone().text();
    const bodyWithBackButton = content.replace(
      `</body>`,
      `
      <div><a id="view-all" href="${urlBuilder.allBuilds(projectId)}"
        style="position: fixed; bottom: 0.5rem; left: 0.5rem; z-index: 9999; padding: 0.25rem 0.5rem; background-color: black; color: white; border-radius: 0.25rem; text-decoration: none; font-size: 1rem; font-face: sans-serif; font-weight: 400;">
        ← ${SERVICE_NAME}
      </a></div></body>`,
    );
    const headers = new Headers(response.headers);
    headers.set(HEADERS.contentLength, bodyWithBackButton.length.toString());

    return new Response(bodyWithBackButton, { headers, status: 200 });
  },
);
