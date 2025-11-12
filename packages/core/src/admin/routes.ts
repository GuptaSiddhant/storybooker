import z from "zod";
import { buildUploadVariants } from "../builds/schema";
import { handleProcessZip } from "../handlers/handle-process-zip";
import { handlePurge } from "../handlers/handle-purge";
import { urlBuilder, URLS } from "../urls";
import { urlSearchParamsToObject } from "../utils";
import { authenticateOrThrow } from "../utils/auth";
import { checkIsHTMLRequest, checkIsHXRequest } from "../utils/request";
import { responseError, responseRedirect } from "../utils/response";
import { defineRoute } from "../utils/router-utils";

const tag = "Admin";

const purgeSearchParams = z.object({ project: z.string().optional() }).loose();
export const purge = defineRoute(
  "post",
  URLS.admin.purge,
  {
    requestParams: { query: purgeSearchParams },
    responses: { 204: { description: "Purge complete" } },
    summary: "Purge old data",
    tags: [tag],
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
      resource: "tag",
    });

    await handlePurge({ projectId }, {});

    return new Response(null, { status: 204 });
  },
);

const processZipSearchParams = z
  .object({
    project: z.string(),
    sha: z.string(),
    variant: z.enum(buildUploadVariants),
  })
  .loose();
export const processZip = defineRoute(
  "post",
  URLS.admin.processZip,
  {
    requestParams: { query: processZipSearchParams },
    responses: { 202: { summary: "Request to process zip file accepter" } },
    summary: "Process uploaded zip file",
    tags: [tag],
  },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const {
      project: projectId,
      sha,
      variant,
    } = processZipSearchParams.parse(urlSearchParamsToObject(searchParams));

    try {
      await handleProcessZip(projectId, sha, variant);

      if (checkIsHTMLRequest() || checkIsHXRequest()) {
        return responseRedirect(urlBuilder.buildSHA(projectId, sha), 303);
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      return responseError(error);
    }
  },
);
