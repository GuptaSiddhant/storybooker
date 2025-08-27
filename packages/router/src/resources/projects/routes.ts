import { CONTENT_TYPES } from "#constants";
import { defineRoute } from "#utils/api-router";
import {
  commonErrorResponses,
  responseError,
  responseRedirect,
} from "#utils/response";
import z from "zod";
import { ProjectsModel } from "./model";
import {
  ProjectGetResultSchema,
  ProjectCreateSchema,
  ProjectsListResultSchema,
  type ProjectGetResultType,
  type ProjectsListResultType,
  ProjectUpdateSchema,
} from "./schema";
import { authenticateOrThrow } from "#utils/auth";
import { urlSearchParamsToObject } from "#utils/url";
import { checkIsHTMLRequest, checkIsHXRequest } from "#utils/request";
import { ProjectIdSchema } from "#utils/shared-model";

const tag = "Projects";

export const listProjects = defineRoute(
  "get",
  "/",
  {
    responses: {
      ...commonErrorResponses,
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
          [CONTENT_TYPES.JSON]: { schema: ProjectsListResultSchema },
        },
        description: "A list of projects.",
      },
    },
    summary: "List all projects",
    tags: [tag],
  },
  async () => {
    await authenticateOrThrow(["project:read:"]);
    const projects = await new ProjectsModel().list();
    const result: ProjectsListResultType = { projects };

    return Response.json(result);
  },
);

export const createProject = defineRoute(
  "post",
  "/",
  {
    requestBody: {
      content: {
        [CONTENT_TYPES.FORM_ENCODED]: { schema: ProjectCreateSchema },
      },
      description: "Data about the project",
      required: true,
    },
    responses: {
      ...commonErrorResponses,
      201: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: ProjectGetResultSchema },
        },
        description: "Project created successfully",
      },
      303: {
        description: "Project created, redirecting...",
        headers: { Location: z.url() },
      },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Create a new project",
    tags: [tag],
  },
  async ({ request }) => {
    await authenticateOrThrow([`project:create:`]);

    const contentType = request.headers.get("content-type");
    if (!contentType) {
      return responseError("Content-Type header is required", 400);
    }
    if (!contentType.includes(CONTENT_TYPES.FORM_ENCODED)) {
      return responseError(
        `Invalid Content-Type, expected ${CONTENT_TYPES.FORM_ENCODED}`,
        415,
      );
    }

    const project = await new ProjectsModel().create(
      urlSearchParamsToObject(await request.formData()),
    );
    const result: ProjectGetResultType = { project };

    return Response.json(result, { status: 201 });
  },
);

export const getProject = defineRoute(
  "get",
  "/:projectId",
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses,
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
          [CONTENT_TYPES.JSON]: { schema: ProjectGetResultSchema },
        },
        description: "Project details retrieved successfully",
      },
      404: { description: "Matching project not found." },
    },
    summary: "Get project details",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    await authenticateOrThrow([`project:read:${projectId}`]);

    const project = await new ProjectsModel().get(projectId);
    const result: ProjectGetResultType = { project };

    return Response.json(result);
  },
);

export const deleteProject = defineRoute(
  "delete",
  "/:projectId",
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses,
      204: { description: "Project deleted successfully" },
      404: { description: "Matching project not found." },
    },
    summary: "Delete a project",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    await authenticateOrThrow([`project:delete:${projectId}`]);
    await new ProjectsModel().delete(projectId);

    return new Response(null, { status: 204 });
  },
);

export const updateProject = defineRoute(
  "patch",
  "/:projectId",
  {
    requestBody: {
      content: {
        [CONTENT_TYPES.FORM_ENCODED]: { schema: ProjectUpdateSchema },
      },
      description: "Updated project data",
      required: true,
    },
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses,
      202: { description: "Project updated successfully" },
      303: {
        description: "Project updated, redirecting...",
        headers: { Location: z.url() },
      },
      404: { description: "Matching project not found." },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Update project details",
    tags: [tag],
  },
  async ({ params: { projectId }, request }) => {
    await authenticateOrThrow([`project:update:${projectId}`]);

    const contentType = request.headers.get("content-type");
    if (!contentType) {
      return responseError("Content-Type header is required", 400);
    }
    if (!contentType.includes(CONTENT_TYPES.FORM_ENCODED)) {
      return responseError(
        `Invalid Content-Type, expected ${CONTENT_TYPES.FORM_ENCODED}`,
        415,
      );
    }

    await new ProjectsModel().update(
      projectId,
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(request.url, 303);
    }

    return new Response(null, { status: 202 });
  },
);
