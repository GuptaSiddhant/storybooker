// oxlint-disable max-lines

import {
  renderBuildCreatePage,
  renderBuildDetailsPage,
  renderBuildEditPage,
  renderBuildsPage,
} from "#builds-ui/render";
import { CONTENT_TYPES, QUERY_PARAMS } from "#constants";
import { ProjectsModel } from "#projects/model";
import { defineRoute } from "#utils/api-router";
import { authenticateOrThrow } from "#utils/auth";
import {
  checkIsHTMLRequest,
  checkIsHXRequest,
  checkIsNewMode,
  validateBuildUploadZipBody,
  validateIsFormEncodedRequest,
} from "#utils/request";
import {
  commonErrorResponses,
  responseError,
  responseHTML,
  responseRedirect,
} from "#utils/response";
import { BuildSHASchema, ProjectIdSchema } from "#utils/shared-model";
import { urlSearchParamsToObject } from "#utils/url";
import { urlBuilder } from "#utils/url-builder";
import z from "zod";
import { BuildsModel } from "./model";
import {
  BuildCreateSchema,
  BuildsGetResultSchema,
  BuildsListResultSchema,
  BuildUploadFormSchema,
  BuildUploadQueryParamsSchema,
  type BuildsGetResultType,
  type BuildsListResultType,
} from "./schema";

const tag = "Builds";

export const listBuilds = defineRoute(
  "get",
  "/:projectId/builds",
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses,
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
          [CONTENT_TYPES.JSON]: { schema: BuildsListResultSchema },
        },
        description: "A list of builds.",
      },
    },
    summary: "List all builds for a project",
    tags: [tag],
  },
  async ({ params: { projectId }, request }) => {
    if (checkIsNewMode()) {
      await authenticateOrThrow([
        { action: "create", projectId: undefined, resource: "build" },
      ]);
      const project = await new ProjectsModel().get(projectId);
      const labelSlug =
        new URL(request.url).searchParams.get(QUERY_PARAMS.labelSlug) ??
        undefined;

      return responseHTML(renderBuildCreatePage({ labelSlug, project }));
    }

    await authenticateOrThrow([
      { action: "read", projectId, resource: "build" },
    ]);
    const builds = await new BuildsModel(projectId).list();

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      return responseHTML(renderBuildsPage({ builds, project }));
    }

    const result: BuildsListResultType = { builds };
    return Response.json(result);
  },
);

export const createBuild = defineRoute(
  "post",
  "/:projectId/builds",
  {
    requestBody: {
      content: { [CONTENT_TYPES.FORM_ENCODED]: { schema: BuildCreateSchema } },
      description: "Data about the build",
      required: true,
    },
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses,
      201: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: BuildsGetResultSchema },
        },
        description: "Build created successfully",
      },
      303: {
        description: "Build created, redirecting...",
        headers: { Location: z.url() },
      },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Create a new build",
    tags: [tag],
  },
  async ({ params: { projectId }, request }) => {
    const projectModel = new ProjectsModel().id(projectId);
    if (!(await projectModel.has())) {
      return responseError(`The project '${projectId}' does not exist.`, 404);
    }

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return responseError(validFormError.message, validFormError.status);
    }

    await authenticateOrThrow([
      { action: "create", projectId, resource: "build" },
    ]);

    const build = await new BuildsModel(projectId).create(
      urlSearchParamsToObject(await request.formData()),
    );
    const url = urlBuilder.buildSHA(projectId, build.id);

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.buildSHA(projectId, build.id), 303);
    }

    const result: BuildsGetResultType = { build, url };
    return Response.json(result);
  },
);

export const getBuild = defineRoute(
  "get",
  "/:projectId/builds/:buildSHA",
  {
    requestParams: {
      path: z.object({
        buildSHA: BuildSHASchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses,
      200: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: BuildsGetResultSchema },
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Build details retrieved successfully",
      },
    },
    summary: "Get build details",
    tags: [tag],
  },
  async ({ params: { buildSHA, projectId }, request }) => {
    await authenticateOrThrow([
      { action: "read", projectId, resource: "build" },
    ]);

    const build = await new BuildsModel(projectId).get(buildSHA);

    if (checkIsNewMode()) {
      await authenticateOrThrow([
        { action: "update", projectId: undefined, resource: "build" },
      ]);

      return responseHTML(renderBuildEditPage({ build, projectId }));
    }

    if (checkIsHTMLRequest()) {
      return responseHTML(renderBuildDetailsPage({ build, projectId }));
    }

    const result: BuildsGetResultType = { build, url: request.url };
    return Response.json(result);
  },
);

export const deleteBuild = defineRoute(
  "delete",
  "/:projectId/builds/:buildSHA",
  {
    requestParams: {
      path: z.object({
        buildSHA: BuildSHASchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses,
      204: { description: "Build deleted successfully" },
      303: {
        description: "Build deleted, redirecting...",
        headers: { Location: z.url() },
      },
      404: { description: "Build not found" },
    },
    security: [{ ppp: ["build:delete"] }],
    summary: "Delete build",
    tags: [tag],
  },
  async ({ params: { buildSHA, projectId } }) => {
    await authenticateOrThrow([
      { action: "delete", projectId, resource: "build" },
    ]);
    await new BuildsModel(projectId).delete(buildSHA);

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.allBuilds(projectId), 303);
    }

    return new Response(null, { status: 204 });
  },
);

export const uploadBuild = defineRoute(
  "put",
  "/:projectId/builds/:buildSHA",
  {
    description: "Upload build files in a compressed zip",
    requestBody: {
      content: {
        [CONTENT_TYPES.FORM_MULTIPART]: {
          schema: z.object({ file: z.file() }),
        },
        [CONTENT_TYPES.ZIP]: {
          example: "storybook.zip",
          schema: { format: "binary", type: "string" },
        },
      },
      description: "Compressed zip containing files.",
      required: true,
    },
    requestParams: {
      path: z.object({
        buildSHA: BuildSHASchema,
        projectId: ProjectIdSchema,
      }),
      query: BuildUploadQueryParamsSchema,
    },
    responses: {
      ...commonErrorResponses,
      204: { description: "File uploaded successfully" },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Upload build",
    tags: [tag],
  },

  async ({ params: { buildSHA, projectId }, request }) => {
    const buildsModel = new BuildsModel(projectId);

    if (!(await buildsModel.has(buildSHA))) {
      return responseError(
        `The build '${buildSHA}' does not exist in project '${projectId}'.`,
        404,
      );
    }

    await authenticateOrThrow([
      { action: "update", projectId, resource: "build" },
    ]);

    const contentType = request.headers.get("content-type");
    if (!contentType) {
      return responseError("Content-Type header is required", 400);
    }

    if (contentType.startsWith(CONTENT_TYPES.FORM_MULTIPART)) {
      const { file } = BuildUploadFormSchema.parse(
        urlSearchParamsToObject(await request.formData()),
      );

      await buildsModel.upload(buildSHA, file);

      if (checkIsHTMLRequest() || checkIsHXRequest()) {
        return responseRedirect(request.url, 303);
      }

      return new Response(null, { status: 204 });
    }

    if (contentType.startsWith(CONTENT_TYPES.ZIP)) {
      const bodyError = validateBuildUploadZipBody(request);
      if (bodyError) {
        return responseError(bodyError.message, bodyError.status);
      }

      await buildsModel.upload(buildSHA);

      if (checkIsHTMLRequest() || checkIsHXRequest()) {
        return responseRedirect(request.url, 303);
      }

      return new Response(null, { status: 204 });
    }

    return responseError(
      `Invalid content type, expected ${CONTENT_TYPES.ZIP} or ${CONTENT_TYPES.FORM_MULTIPART}.`,
      415,
    );
  },
);
