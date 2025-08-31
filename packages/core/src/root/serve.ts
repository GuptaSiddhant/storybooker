import path from "node:path";
import { CACHE_CONTROL_PUBLIC_YEAR, HEADERS, SERVICE_NAME } from "#constants";
import { defineRoute } from "#router";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { authenticateOrThrow } from "#utils/auth";
import { getMimeType } from "#utils/mime-utils";
import { responseError } from "#utils/response";
import { generateProjectContainerName } from "#utils/shared-model";
import z from "zod";

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
  async ({ params, request }) => {
    const { buildSHA, projectId } = params;
    const { storage } = getStore();
    const { pathname } = new URL(request.url);
    const filepath = pathname.split(`${buildSHA}/`).at(1) || "index.html";

    const containerFilepath = path.posix.join(buildSHA, filepath);
    await authenticateOrThrow({ action: "read", projectId, resource: "build" });

    try {
      const result = await storage.downloadFile(
        generateProjectContainerName(projectId),
        containerFilepath,
      );

      const headers = new Headers();
      headers.set(HEADERS.contentType, getMimeType(filepath));
      headers.append(HEADERS.cacheControl, CACHE_CONTROL_PUBLIC_YEAR);

      if (!filepath.endsWith("index.html")) {
        return new Response(result, { headers, status: 200 });
      }

      // Appending custom UI to index.html
      const content =
        typeof result === "string" ? result : await new Response(result).text();
      const bodyWithBackButton = content.replace(
        `</body>`,
        `
        <div><a id="view-all" href="${urlBuilder.allBuilds(projectId)}"
        style="position: fixed; bottom: 0.5rem; left: 0.5rem; z-index: 9999; padding: 0.25rem 0.5rem; background-color: black; color: white; border-radius: 0.25rem; text-decoration: none; font-size: 1rem; font-face: sans-serif; font-weight: 400;">
        ← ${SERVICE_NAME}
        </a></div></body>`,
      );

      return new Response(bodyWithBackButton, { headers, status: 200 });
    } catch (error) {
      return responseError(error, 404);
    }
  },
);
