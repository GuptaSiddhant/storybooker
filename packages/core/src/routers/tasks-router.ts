import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { handleProcessZip } from "../handlers/handle-process-zip";
import { handlePurge } from "../handlers/handle-purge";
import { buildUploadVariants } from "../models/builds-schema";
import { urlBuilder } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { checkIsHTMLRequest } from "../utils/request";
import { responseError, responseRedirect } from "../utils/response";

const tasksTag = "Tasks";

const processZipSearchParams = z
  .object({
    projectId: z.string(),
    buildId: z.string(),
    variant: z.enum(buildUploadVariants),
  })
  .loose();

/**
 * @private
 */
export const tasksRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "Purge outdated builds",
      method: "post",
      path: "/purge",
      tags: [tasksTag],
      request: { query: z.object({ projectId: z.string() }).partial().loose() },
      responses: { 204: { description: "Purge complete" } },
    }),
    async (context) => {
      const projectId = context.req.query("projectId");

      await Promise.all([
        authenticateOrThrow({
          action: "update",
          projectId,
          resource: "project",
        }),
        authenticateOrThrow({ action: "delete", projectId, resource: "build" }),
        authenticateOrThrow({ action: "delete", projectId, resource: "tag" }),
      ]);

      await handlePurge({ projectId }, { abortSignal: context.req.raw.signal });

      context.status(204);
      return context.res;
    },
  )
  .openapi(
    createRoute({
      summary: "Process uploaded zip files",
      method: "post",
      path: "/process-zip",
      tags: [tasksTag],
      request: { query: processZipSearchParams },
      responses: {
        204: { description: "Request to process zip file accepter" },
      },
    }),
    async (context) => {
      const { buildId, projectId, variant } = processZipSearchParams.parse({
        buildId: context.req.query("buildId"),
        projectId: context.req.query("projectId"),
        variant: context.req.query("variant"),
      });

      try {
        await handleProcessZip(projectId, buildId, variant);

        if (checkIsHTMLRequest(true)) {
          return responseRedirect(
            urlBuilder.buildDetails(projectId, buildId),
            303,
          );
        }

        context.status(204);
        return context.res;
      } catch (error) {
        return responseError(error);
      }
    },
  );
