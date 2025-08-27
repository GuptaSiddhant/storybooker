import { defineRoute } from "#utils/api-router";
import { authenticateOrThrow } from "#utils/auth";
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
    const { pathname } = new URL(request.url);
    const filepath = pathname.split(`${buildSHA}/`).at(1) || "index.html";
    await authenticateOrThrow([`build:read:${projectId}`]);
    return new Response(JSON.stringify({ buildSHA, filepath, projectId }));
  },
);
