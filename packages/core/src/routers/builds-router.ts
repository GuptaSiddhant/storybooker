import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { SuperHeaders } from "@remix-run/headers";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import z from "zod";
import { BuildsModel } from "../models/builds-model";
import {
  BuildCreateSchema,
  BuildIdSchema,
  BuildsGetResultSchema,
  BuildsListResultSchema,
  BuildUpdateSchema,
  BuildUploadFormBodySchema,
  BuildUploadQueryParamsSchema,
} from "../models/builds-schema";
import { ProjectsModel } from "../models/projects-model";
import { ProjectIdSchema } from "../models/projects-schema";
import { urlBuilder } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { QUERY_PARAMS } from "../utils/constants";
import { mimes } from "../utils/mime-utils";
import {
  openapiCommonErrorResponses,
  openapiErrorResponseContent,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils";
import { checkIsHTMLRequest, validateBuildUploadZipBody } from "../utils/request";
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";

const buildTag = "Builds";
const projectIdPathParams = z.object({ projectId: ProjectIdSchema });
const buildIdPathParams = z.object({
  projectId: ProjectIdSchema,
  buildId: BuildIdSchema,
});

/**
 * @private
 */
export const buildsRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "List builds",
      method: "get",
      path: "/projects/{projectId}/builds",
      tags: [buildTag],
      request: {
        params: projectIdPathParams,
      },
      responses: {
        200: {
          description: "A list of builds in the project.",
          content: {
            [mimes.json]: { schema: BuildsListResultSchema },
            ...openapiResponsesHtml,
          },
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.valid("param");
      const { ui } = getStore();

      await authenticateOrThrow({
        action: "read",
        projectId,
        resource: "build",
      });

      const builds = await new BuildsModel(projectId).list();

      if (ui?.renderBuildsListPage && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);

        return context.html(ui.renderBuildsListPage({ builds, project }, createUIAdapterOptions()));
      }

      return context.json({ builds });
    },
  )
  .openapi(
    createRoute({
      summary: "Create build - UI",
      method: "get",
      path: "/projects/{projectId}/builds/create",
      tags: [buildTag],
      request: {
        params: projectIdPathParams,
        query: z.object({ [QUERY_PARAMS.tagId]: z.string().optional() }),
      },
      responses: {
        200: {
          description: "UI to create build",
          content: openapiResponsesHtml,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      if (!ui?.renderBuildCreatePage) {
        throw new HTTPException(405, { message: "UI not available for this route." });
      }

      const { projectId } = context.req.valid("param");
      const { tagId } = context.req.valid("query");

      await authenticateOrThrow({
        action: "create",
        projectId,
        resource: "build",
      });

      const project = await new ProjectsModel().get(projectId);

      return context.html(ui.renderBuildCreatePage({ project, tagId }, createUIAdapterOptions()));
    },
  )
  .openapi(
    createRoute({
      summary: "Create build - action",
      method: "post",
      path: "/projects/{projectId}/builds/create",
      tags: [buildTag],
      request: {
        params: projectIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: BuildCreateSchema } },
          required: true,
        },
      },
      responses: {
        201: {
          description: "Build created successfully",
          content: { [mimes.json]: { schema: BuildsGetResultSchema } },
        },
        303: openapiResponseRedirect("Redirect to build."),
        409: {
          content: openapiErrorResponseContent,
          description: "Build already exists.",
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.valid("param");

      const projectModel = new ProjectsModel().id(projectId);
      if (!(await projectModel.has())) {
        throw new HTTPException(404, { message: `The project '${projectId}' does not exist.` });
      }

      await authenticateOrThrow({
        action: "create",
        projectId,
        resource: "build",
      });

      const data = context.req.valid("form");
      const build = await new BuildsModel(projectId).create(data);
      const url = urlBuilder.buildDetails(projectId, build.id);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(url, 303);
      }

      return context.json({ build, url }, 201);
    },
  )
  .openapi(
    createRoute({
      summary: "Build details",
      method: "get",
      path: "/projects/{projectId}/builds/{buildId}",
      tags: [buildTag],
      request: { params: buildIdPathParams },
      responses: {
        200: {
          description: "Details of the build",
          content: {
            [mimes.json]: { schema: BuildsGetResultSchema },
            ...openapiResponsesHtml,
          },
        },
        404: {
          description: "Matching build not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId, buildId } = context.req.valid("param");
      const { ui } = getStore();

      await authenticateOrThrow({
        action: "read",
        projectId,
        resource: "build",
      });

      const model = new BuildsModel(projectId);
      const build = await model.get(buildId);

      if (ui?.renderBuildDetailsPage && checkIsHTMLRequest()) {
        // const [hasDeletePermission, hasUpdatePermission] = await Promise.all([
        //   model.checkAuth("delete"),
        //   model.checkAuth("update"),
        // ]);
        // const canDeleteBuild =
        //   hasDeletePermission && project.latestBuildId !== build.id;

        const project = await new ProjectsModel().get(projectId);
        const stories = await model.getStories(build);

        return context.html(
          ui.renderBuildDetailsPage({ build, stories, project }, createUIAdapterOptions()),
        );
      }

      return context.json({ build, url: context.req.url });
    },
  )
  .openapi(
    createRoute({
      summary: "Delete build - action",
      method: "post",
      path: "/projects/{projectId}/builds/{buildId}/delete",
      tags: [buildTag],
      request: { params: buildIdPathParams },
      responses: {
        204: { description: "Build deleted successfully." },
        303: openapiResponseRedirect("Redirect to builds list."),
        404: {
          description: "Matching build not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId, buildId } = context.req.valid("param");
      await authenticateOrThrow({
        action: "delete",
        projectId,
        resource: "build",
      });

      await new BuildsModel(projectId).delete(buildId, true);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.buildsList(projectId), 303);
      }

      return new Response(null, { status: 204 });
    },
  )
  .openapi(
    createRoute({
      summary: "Update build - action",
      method: "post",
      path: "/projects/{projectId}/builds/{buildId}/update",
      tags: [buildTag],
      request: {
        params: buildIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: BuildUpdateSchema } },
          required: true,
        },
      },
      responses: {
        202: { description: "Build updated successfully" },
        303: openapiResponseRedirect("Redirect to build."),
        404: {
          description: "Matching project or build not found.",
          content: openapiErrorResponseContent,
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { buildId, projectId } = context.req.valid("param");

      const buildsModel = new BuildsModel(projectId);

      if (!(await buildsModel.has(buildId))) {
        throw new HTTPException(404, {
          message: `The build '${buildId}' does not exist in project '${projectId}'.`,
        });
      }

      await authenticateOrThrow({
        action: "update",
        projectId,
        resource: "build",
      });

      const data = context.req.valid("form");
      await buildsModel.update(buildId, data);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.buildDetails(projectId, buildId), 303);
      }

      return new Response(null, { status: 202 });
    },
  )
  .openapi(
    createRoute({
      summary: "Upload build - UI",
      method: "get",
      path: "/projects/{projectId}/builds/{buildId}/upload",
      tags: [buildTag],
      request: {
        params: buildIdPathParams,
        query: BuildUploadQueryParamsSchema,
      },
      responses: {
        200: {
          description: "UI to upload build",
          content: openapiResponsesHtml,
        },
        404: {
          description: "Matching build not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      if (!ui?.renderBuildUploadPage) {
        throw new HTTPException(405, { message: "UI not available for this route." });
      }

      const { buildId, projectId } = context.req.valid("param");

      await authenticateOrThrow({
        action: "update",
        projectId,
        resource: "build",
      });

      const build = await new BuildsModel(projectId).get(buildId);
      const project = await new ProjectsModel().get(projectId);
      const { variant: uploadVariant } = context.req.valid("query");

      return context.html(
        ui.renderBuildUploadPage({ build, uploadVariant, project }, createUIAdapterOptions()),
      );
    },
  )
  .openapi(
    createRoute({
      summary: "Upload build - action",
      method: "post",
      path: "/projects/{projectId}/builds/{buildId}/upload",
      tags: [buildTag],
      request: {
        params: buildIdPathParams,
        query: BuildUploadQueryParamsSchema,
        body: {
          description: "Compressed zip containing files.",
          content: {
            [mimes.formMultipart]: { schema: BuildUploadFormBodySchema },
            [mimes.zip]: {
              schema: { format: "binary", type: "string" },
              example: "storybook.zip",
            },
          },
          required: true,
        },
      },
      responses: {
        204: { description: "File uploaded successfully" },
        303: openapiResponseRedirect("Redirect to project."),
        404: {
          description: "Matching project not found.",
          content: openapiErrorResponseContent,
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { buildId, projectId } = context.req.valid("param");

      const buildsModel = new BuildsModel(projectId);

      if (!(await buildsModel.has(buildId))) {
        throw new HTTPException(404, {
          message: `The build '${buildId}' does not exist in project '${projectId}'.`,
        });
      }

      await authenticateOrThrow({
        action: "update",
        projectId,
        resource: "build",
      });

      const { contentType } = new SuperHeaders(context.req.header());

      if (!contentType.toString()) {
        throw new HTTPException(400, { message: "Content-Type header is required" });
      }

      const redirectUrl = urlBuilder.buildDetails(projectId, buildId);

      // Form submission
      if (contentType.mediaType?.startsWith(mimes.formMultipart)) {
        const { file, variant } = BuildUploadFormBodySchema.parse(await context.req.parseBody());

        await buildsModel.upload(buildId, variant, file);

        if (checkIsHTMLRequest(true)) {
          return context.redirect(redirectUrl, 303);
        }

        return new Response(null, { status: 204 });
      }

      if (contentType.mediaType?.startsWith(mimes.zip)) {
        const bodyError = validateBuildUploadZipBody(context.req.raw);
        if (bodyError) {
          throw new HTTPException(bodyError.status as ContentfulStatusCode, {
            message: bodyError.message,
          });
        }

        const { variant } = context.req.valid("query");

        await buildsModel.upload(buildId, variant);

        if (checkIsHTMLRequest(true)) {
          return context.redirect(redirectUrl, 303);
        }

        return new Response(null, { status: 204 });
      }

      throw new HTTPException(415, {
        message: `Invalid content type, expected ${mimes.zip} or ${mimes.formMultipart}.`,
      });
    },
  );
