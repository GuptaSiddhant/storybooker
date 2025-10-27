// oxlint-disable max-lines

import z from "zod";
import { BuildsModel } from "../builds/model";
import { TagsModel } from "../tags/model";
import { urlBuilder, URLS } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { CONTENT_TYPES } from "../utils/constants";
import {
  checkIsHTMLRequest,
  checkIsHXRequest,
  validateIsFormEncodedRequest,
} from "../utils/request";
import {
  commonErrorResponses,
  errorContent,
  responseError,
  responseHTML,
  responseRedirect,
} from "../utils/response";
import { defineRoute } from "../utils/router-utils";
import { ProjectIdSchema } from "../utils/shared-model";
import { urlSearchParamsToObject } from "../utils/url";
import { ProjectsModel } from "./model";
import {
  ProjectCreateSchema,
  ProjectGetResultSchema,
  ProjectsListResultSchema,
  ProjectUpdateSchema,
  type ProjectGetResultType,
  type ProjectsListResultType,
} from "./schema";
import {
  renderProjectCreatePage,
  renderProjectDetailsPage,
  renderProjectsPage,
  renderProjectUpdatePage,
} from "./ui/render";

const tag = "Projects";

export const listProjects = defineRoute(
  "get",
  URLS.projects.all,
  {
    responses: {
      ...commonErrorResponses(),
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
    await authenticateOrThrow({
      action: "read",
      projectId: undefined,
      resource: "project",
    });
    const projects = await new ProjectsModel().list();

    if (checkIsHTMLRequest()) {
      return await responseHTML(renderProjectsPage({ projects }));
    }

    const result: ProjectsListResultType = { projects };
    return Response.json(result);
  },
);

export const createProject = defineRoute(
  "post",
  URLS.projects.create,
  {
    requestBody: {
      content: {
        [CONTENT_TYPES.FORM_ENCODED]: { schema: ProjectCreateSchema },
      },
      description: "Data about the project",
      required: true,
    },
    responses: {
      ...commonErrorResponses(),
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
      409: { content: errorContent, description: "Project already exists." },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Create a new project",
    tags: [tag],
  },
  async ({ request }) => {
    await authenticateOrThrow({
      action: "create",
      projectId: undefined,
      resource: "project",
    });

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return await responseError(validFormError.message, validFormError.status);
    }

    const project = await new ProjectsModel().create(
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.projectId(project.id), 303);
    }

    const result: ProjectGetResultType = { project };
    return Response.json(result, { status: 201 });
  },
);

export const createProjectForm = defineRoute(
  "get",
  URLS.projects.create,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Form to create project",
      },
    },
    summary: "Form to create project",
    tags: [tag],
  },
  async () => {
    await authenticateOrThrow({
      action: "create",
      projectId: undefined,
      resource: "project",
    });

    return await responseHTML(renderProjectCreatePage());
  },
);

export const getProject = defineRoute(
  "get",
  URLS.projects.id,
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses(),
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
    await authenticateOrThrow({
      action: "read",
      projectId,
      resource: "project",
    });

    const project = await new ProjectsModel().get(projectId);

    if (checkIsHTMLRequest()) {
      const recentBuilds = await new BuildsModel(projectId).list({ limit: 10 });
      const recentTags = await new TagsModel(projectId).list({ limit: 10 });

      return await responseHTML(
        renderProjectDetailsPage({ project, recentBuilds, recentTags }),
      );
    }

    const result: ProjectGetResultType = { project };
    return Response.json(result);
  },
);

export const deleteProject = defineRoute(
  "delete",
  URLS.projects.id,
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses(),
      204: { description: "Project deleted successfully" },
      404: { description: "Matching project not found." },
    },
    summary: "Delete a project",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    await authenticateOrThrow({
      action: "delete",
      projectId,
      resource: "project",
    });
    await new ProjectsModel().delete(projectId);

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.allProjects(), 303);
    }

    return new Response(null, { status: 204 });
  },
);

export const updateProject = defineRoute(
  "post",
  URLS.projects.update,
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
      ...commonErrorResponses(),
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
    await authenticateOrThrow({
      action: "update",
      projectId,
      resource: "project",
    });

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return await responseError(validFormError.message, validFormError.status);
    }

    await new ProjectsModel().update(
      projectId,
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.projectId(projectId), 303);
    }

    return new Response(null, { status: 202 });
  },
);

export const updateProjectForm = defineRoute(
  "get",
  URLS.projects.update,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Form to update project",
      },
    },
    summary: "Form to update project",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    await authenticateOrThrow({
      action: "update",
      projectId: undefined,
      resource: "project",
    });

    const project = await new ProjectsModel().get(projectId);

    return await responseHTML(renderProjectUpdatePage({ project }));
  },
);
